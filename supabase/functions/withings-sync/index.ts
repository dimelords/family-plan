import { createClient } from 'jsr:@supabase/supabase-js@2'

const WITHINGS_TOKEN_URL = 'https://wbsapi.withings.net/v2/oauth2'
const WITHINGS_MEASURE_URL = 'https://wbsapi.withings.net/measure'

async function refreshToken(clientId: string, clientSecret: string, refreshToken: string) {
  const res = await fetch(WITHINGS_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      action: 'requesttoken',
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  })
  const data = await res.json()
  if (data.status !== 0) throw new Error(`Token refresh failed: ${JSON.stringify(data)}`)
  return data.body as { access_token: string; refresh_token: string; expires_in: number }
}

Deno.serve(async (req) => {
  // Expect Authorization: Bearer <supabase_jwt>
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const clientId    = Deno.env.get('WITHINGS_CLIENT_ID')!
  const clientSecret = Deno.env.get('WITHINGS_CLIENT_SECRET')!

  // Verify the user JWT to get user_id
  const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: userErr } = await userClient.auth.getUser()
  if (userErr || !user) return new Response('Unauthorized', { status: 401 })

  const supabase = createClient(supabaseUrl, serviceKey)

  // Fetch stored tokens
  const { data: tokenRow, error: tokenErr } = await supabase
    .from('withings_tokens')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (tokenErr || !tokenRow) {
    return new Response(JSON.stringify({ error: 'not_connected' }), {
      status: 404, headers: { 'Content-Type': 'application/json' },
    })
  }

  // Refresh token if expired (with 5 min buffer)
  let accessToken = tokenRow.access_token
  if (new Date(tokenRow.expires_at).getTime() < Date.now() + 5 * 60 * 1000) {
    const refreshed = await refreshToken(clientId, clientSecret, tokenRow.refresh_token)
    accessToken = refreshed.access_token
    await supabase.from('withings_tokens').update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('user_id', user.id)
  }

  // Fetch last 90 days of weight measurements
  const since = Math.floor(Date.now() / 1000) - 90 * 24 * 60 * 60
  const measureRes = await fetch(
    `${WITHINGS_MEASURE_URL}?action=getmeas&meastype=1&category=1&lastupdate=${since}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const measureData = await measureRes.json()

  if (measureData.status !== 0 || !measureData.body?.measuregrps?.length) {
    return new Response(JSON.stringify({ synced: false, reason: 'no_recent_data' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Get family member info
  const { data: member } = await supabase
    .from('family_members')
    .select('id, name, family_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) {
    return new Response(JSON.stringify({ error: 'no_member' }), {
      status: 404, headers: { 'Content-Type': 'application/json' },
    })
  }

  // Insert all measurements into body_log
  const rows = measureData.body.measuregrps.map((grp: { date: number; measures: Array<{ value: number; unit: number }> }) => {
    const m = grp.measures[0]
    const weightKg = parseFloat((m.value * Math.pow(10, m.unit)).toFixed(1))
    return {
      family_id: member.family_id,
      member_name: member.name,
      weight_kg: weightKg,
      logged_at: new Date(grp.date * 1000).toISOString(),
    }
  })

  await supabase.from('body_log').upsert(rows, { onConflict: 'family_id,member_name,logged_at' })

  // Update latest weight in person_preferences
  const latestWeight = rows[0].weight_kg
  await supabase
    .from('person_preferences')
    .update({ weight_kg: latestWeight, updated_at: new Date().toISOString() })
    .eq('family_member_id', member.id)

  // Update last_synced_at
  await supabase.from('withings_tokens')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('user_id', user.id)

  return new Response(JSON.stringify({
    synced: true,
    weight_kg: latestWeight,
    measurements: rows.length,
  }), { headers: { 'Content-Type': 'application/json' } })
})
