import { createClient } from 'jsr:@supabase/supabase-js@2'

const WITHINGS_TOKEN_URL = 'https://wbsapi.withings.net/v2/oauth2'
const WITHINGS_MEASURE_URL = 'https://wbsapi.withings.net/measure'
const APP_URL = 'https://walter-planner.netlify.app'

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')   // user_id encoded as state
  const error = url.searchParams.get('error')

  if (error || !code || !state) {
    return Response.redirect(`${APP_URL}/?withings=error&reason=${error ?? 'missing_params'}`)
  }

  const clientId     = Deno.env.get('WITHINGS_CLIENT_ID')!
  const clientSecret = Deno.env.get('WITHINGS_CLIENT_SECRET')!
  const supabaseUrl  = Deno.env.get('SUPABASE_URL')!
  const serviceKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const callbackUrl  = `${supabaseUrl}/functions/v1/withings-callback`

  // 1. Exchange authorization code for tokens
  const tokenRes = await fetch(WITHINGS_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      action: 'requesttoken',
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: callbackUrl,
    }),
  })

  const tokenData = await tokenRes.json()
  if (tokenData.status !== 0) {
    console.error('Withings token error:', tokenData)
    return Response.redirect(`${APP_URL}/?withings=error&reason=token_exchange`)
  }

  const { access_token, refresh_token, expires_in, userid: withingsUserId } = tokenData.body

  const supabase = createClient(supabaseUrl, serviceKey)
  const userId = state

  // 2. Store tokens
  const { error: upsertErr } = await supabase.from('withings_tokens').upsert({
    user_id: userId,
    access_token,
    refresh_token,
    expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
    withings_user_id: String(withingsUserId),
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  if (upsertErr) {
    console.error('Token upsert error:', upsertErr)
    return Response.redirect(`${APP_URL}/?withings=error&reason=db`)
  }

  // 3. Fetch latest weight measurement (measttype 1 = weight in kg)
  const measureRes = await fetch(
    `${WITHINGS_MEASURE_URL}?action=getmeas&meastype=1&category=1&lastupdate=0`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  )
  const measureData = await measureRes.json()

  if (measureData.status === 0 && measureData.body?.measuregrps?.length > 0) {
    // Most recent measurement first
    const latest = measureData.body.measuregrps[0]
    const measure = latest.measures[0]
    // Withings stores weight as value * 10^unit (e.g. value=800, unit=-2 → 8.00 kg)
    const weightKg = parseFloat((measure.value * Math.pow(10, measure.unit)).toFixed(1))
    const measuredAt = new Date(latest.date * 1000).toISOString()

    // Update person_preferences.weight_kg
    await supabase
      .from('person_preferences')
      .update({ weight_kg: weightKg, updated_at: new Date().toISOString() })
      .eq('family_member_id', userId)  // may not match — also try via user lookup below

    // Look up family_member to get the right person_preferences row
    const { data: member } = await supabase
      .from('family_members')
      .select('id, family_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (member) {
      await supabase
        .from('person_preferences')
        .update({ weight_kg: weightKg, updated_at: new Date().toISOString() })
        .eq('family_member_id', member.id)

      // Also insert into body_log for history
      await supabase.from('body_log').upsert({
        family_id: member.family_id,
        member_name: userId, // will be resolved to real name below
        weight_kg: weightKg,
        logged_at: measuredAt,
      }, { onConflict: 'family_id,member_name,logged_at' }).select()

      // Get real name for body_log
      const { data: prefs } = await supabase
        .from('person_preferences')
        .select('family_member_id')
        .eq('family_member_id', member.id)
        .maybeSingle()

      if (prefs) {
        const { data: memberData } = await supabase
          .from('family_members')
          .select('name')
          .eq('id', member.id)
          .maybeSingle()

        if (memberData) {
          await supabase.from('body_log').upsert({
            family_id: member.family_id,
            member_name: memberData.name,
            weight_kg: weightKg,
            logged_at: measuredAt,
          }, { onConflict: 'family_id,member_name,logged_at' })
        }
      }
    }
  }

  return Response.redirect(`${APP_URL}/?withings=connected`)
})
