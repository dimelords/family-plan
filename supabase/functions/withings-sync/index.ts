import { createClient } from 'jsr:@supabase/supabase-js@2'

const WITHINGS_TOKEN_URL = 'https://wbsapi.withings.net/v2/oauth2'
const WITHINGS_MEASURE_URL = 'https://wbsapi.withings.net/measure'

// Withings meastype constants
const TYPE_WEIGHT      = 1
const TYPE_FAT_RATIO   = 6
const TYPE_MUSCLE_MASS = 76
const TYPE_WATER_PCT   = 77
const TYPE_BONE_MASS   = 88

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

function withingsVal(value: number, unit: number): number {
  return parseFloat((value * Math.pow(10, unit)).toFixed(2))
}

async function refreshToken(clientId: string, clientSecret: string, token: string) {
  const res = await fetch(WITHINGS_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      action: 'requesttoken',
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: token,
    }),
  })
  const data = await res.json()
  if (data.status !== 0) throw new Error(`Token refresh failed: ${JSON.stringify(data)}`)
  return data.body as { access_token: string; refresh_token: string; expires_in: number }
}

interface WithingsMeasure { type: number; value: number; unit: number }
interface WithingsGrp { date: number; measures: WithingsMeasure[] }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'unauthorized' }, 401)

  const supabaseUrl  = Deno.env.get('SUPABASE_URL')!
  const serviceKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const clientId     = Deno.env.get('WITHINGS_CLIENT_ID')!
  const clientSecret = Deno.env.get('WITHINGS_CLIENT_SECRET')!
  const anonKey      = Deno.env.get('SUPABASE_ANON_KEY')!

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: userErr } = await userClient.auth.getUser()
  if (userErr || !user) return json({ error: 'unauthorized' }, 401)

  const supabase = createClient(supabaseUrl, serviceKey)

  const { data: tokenRow, error: tokenErr } = await supabase
    .from('withings_tokens')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (tokenErr || !tokenRow) return json({ error: 'not_connected' }, 404)

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

  // Fetch last 90 days — no meastype filter so we get all body composition data
  const since = Math.floor(Date.now() / 1000) - 90 * 24 * 60 * 60
  const measureRes = await fetch(
    `${WITHINGS_MEASURE_URL}?action=getmeas&category=1&lastupdate=${since}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const measureData = await measureRes.json()

  if (measureData.status !== 0 || !measureData.body?.measuregrps?.length) {
    return json({ synced: false, reason: 'no_recent_data' })
  }

  const { data: member } = await supabase
    .from('family_members')
    .select('id, name, family_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) return json({ error: 'no_member' }, 404)

  function getMeasure(grp: WithingsGrp, type: number): number | null {
    const m = grp.measures.find((m: WithingsMeasure) => m.type === type)
    return m ? withingsVal(m.value, m.unit) : null
  }

  const rows = measureData.body.measuregrps
    .filter((grp: WithingsGrp) => getMeasure(grp, TYPE_WEIGHT) !== null)
    .map((grp: WithingsGrp) => ({
      family_id:        member.family_id,
      member_name:      member.name,
      logged_at:        new Date(grp.date * 1000).toISOString(),
      weight_kg:        getMeasure(grp, TYPE_WEIGHT),
      estimated_bf_pct: getMeasure(grp, TYPE_FAT_RATIO),
      muscle_mass_kg:   getMeasure(grp, TYPE_MUSCLE_MASS),
      water_pct:        getMeasure(grp, TYPE_WATER_PCT),
      bone_mass_kg:     getMeasure(grp, TYPE_BONE_MASS),
    }))

  await supabase.from('body_log').upsert(rows, { onConflict: 'family_id,member_name,logged_at' })

  const latest = rows[0]
  await supabase
    .from('person_preferences')
    .update({ weight_kg: latest.weight_kg, updated_at: new Date().toISOString() })
    .eq('family_member_id', member.id)

  await supabase.from('withings_tokens')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('user_id', user.id)

  return json({
    synced:         true,
    weight_kg:      latest.weight_kg,
    fat_pct:        latest.estimated_bf_pct,
    muscle_mass_kg: latest.muscle_mass_kg,
    measurements:   rows.length,
  })
})
