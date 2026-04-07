import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { useBodyLog } from '../hooks/useBodyLog'
import { estimateBfPct, calcBmi, bmiCategory } from '../lib/bodyFat'
import type { FamilyMember, PersonPreferences, Gender } from '../types/database'

interface Props {
  familyId: string
  member: FamilyMember
  prefs: PersonPreferences
}

type Metric = 'weight_kg' | 'estimated_bf_pct' | 'muscle_mass_kg' | 'waist_cm'

const METRIC_LABELS: Record<Metric, string> = {
  weight_kg: 'Vikt (kg)',
  estimated_bf_pct: 'Fett %',
  muscle_mass_kg: 'Muskel (kg)',
  waist_cm: 'Midja (cm)',
}

const today = new Date().toISOString().slice(0, 10)

export function BodyTab({ familyId, member, prefs }: Props) {
  const { entries, loading, saveEntry } = useBodyLog(familyId, member.name)
  const [activeMetric, setActiveMetric] = useState<Metric>('weight_kg')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Form state – pre-fill from latest entry
  const latest = entries[0]
  const [form, setForm] = useState({
    logged_at: today,
    weight_kg: '',
    waist_cm: '',
    hip_cm: '',
    neck_cm: '',
    chest_cm: '',
    arm_cm: '',
    thigh_cm: '',
    notes: '',
  })

  function openForm() {
    setForm({
      logged_at: today,
      weight_kg: latest?.weight_kg?.toString() ?? '',
      waist_cm: latest?.waist_cm?.toString() ?? '',
      hip_cm: latest?.hip_cm?.toString() ?? '',
      neck_cm: latest?.neck_cm?.toString() ?? '',
      chest_cm: latest?.chest_cm?.toString() ?? '',
      arm_cm: latest?.arm_cm?.toString() ?? '',
      thigh_cm: latest?.thigh_cm?.toString() ?? '',
      notes: '',
    })
    setShowForm(true)
    setSaved(false)
  }

  function num(v: string): number | null {
    const n = parseFloat(v)
    return isNaN(n) ? null : n
  }

  const previewBf = useMemo(() => estimateBfPct({
    gender: prefs.gender as Gender | null,
    height_cm: prefs.height_cm,
    waist_cm: num(form.waist_cm),
    neck_cm: num(form.neck_cm),
    hip_cm: num(form.hip_cm),
  }), [form.waist_cm, form.neck_cm, form.hip_cm, prefs.gender, prefs.height_cm])

  const previewBmi = useMemo(() =>
    calcBmi(num(form.weight_kg), prefs.height_cm),
    [form.weight_kg, prefs.height_cm])

  async function handleSave() {
    setSaving(true)
    const bf = estimateBfPct({
      gender: prefs.gender as Gender | null,
      height_cm: prefs.height_cm,
      waist_cm: num(form.waist_cm),
      neck_cm: num(form.neck_cm),
      hip_cm: num(form.hip_cm),
    })
    await saveEntry({
      logged_at: form.logged_at,
      weight_kg: num(form.weight_kg),
      waist_cm: num(form.waist_cm),
      hip_cm: num(form.hip_cm),
      neck_cm: num(form.neck_cm),
      chest_cm: num(form.chest_cm),
      arm_cm: num(form.arm_cm),
      thigh_cm: num(form.thigh_cm),
      estimated_bf_pct: bf,
      notes: form.notes || null,
    })
    setSaving(false)
    setSaved(true)
    setShowForm(false)
  }

  // Chart data — reverse so oldest first
  const chartData = useMemo(() =>
    [...entries].reverse().map(e => ({
      date: e.logged_at.slice(5),  // MM-DD
      weight_kg: e.weight_kg,
      estimated_bf_pct: e.estimated_bf_pct,
      muscle_mass_kg: e.muscle_mass_kg,
      waist_cm: e.waist_cm,
    })),
    [entries]
  )

  const hasData = entries.length > 0

  return (
    <div className="body-tab">
      <div className="body-tab-header">
        <div className="body-stats-summary">
          {latest && (
            <>
              {latest.weight_kg && (
                <div className="body-stat-chip">
                  <span className="body-stat-value">{latest.weight_kg} kg</span>
                  <span className="body-stat-label">Vikt</span>
                </div>
              )}
              {latest.estimated_bf_pct && (
                <div className="body-stat-chip">
                  <span className="body-stat-value">{latest.estimated_bf_pct}%</span>
                  <span className="body-stat-label">Fett</span>
                </div>
              )}
              {latest.muscle_mass_kg && (
                <div className="body-stat-chip">
                  <span className="body-stat-value">{latest.muscle_mass_kg} kg</span>
                  <span className="body-stat-label">Muskler</span>
                </div>
              )}
              {latest.water_pct && (
                <div className="body-stat-chip">
                  <span className="body-stat-value">{latest.water_pct}%</span>
                  <span className="body-stat-label">Vatten</span>
                </div>
              )}
              {prefs.height_cm && latest.weight_kg && (() => {
                const bmi = calcBmi(latest.weight_kg, prefs.height_cm)
                return bmi ? (
                  <div className="body-stat-chip">
                    <span className="body-stat-value">{bmi}</span>
                    <span className="body-stat-label">BMI · {bmiCategory(bmi)}</span>
                  </div>
                ) : null
              })()}
              {latest.waist_cm && (
                <div className="body-stat-chip">
                  <span className="body-stat-value">{latest.waist_cm} cm</span>
                  <span className="body-stat-label">Midja</span>
                </div>
              )}
            </>
          )}
          {!hasData && !loading && (
            <p className="body-empty-hint">Ingen data ännu – logga din första mätning!</p>
          )}
        </div>
        <button className="btn-primary" onClick={openForm}>+ Logga mätning</button>
      </div>

      {/* Chart */}
      {hasData && (
        <div className="body-chart-card">
          <div className="body-metric-tabs">
            {(Object.keys(METRIC_LABELS) as Metric[]).map(m => (
              <button
                key={m}
                className={`metric-tab ${activeMetric === m ? 'active' : ''}`}
                onClick={() => setActiveMetric(m)}
              >
                {METRIC_LABELS[m]}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }}
                labelStyle={{ color: 'var(--text-secondary)', fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey={activeMetric}
                name={METRIC_LABELS[activeMetric]}
                stroke="var(--accent)"
                strokeWidth={2}
                dot={{ r: 3, fill: 'var(--accent)' }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent entries */}
      {hasData && (
        <div className="body-entries">
          <h3 className="section-title">Senaste mätningar</h3>
          <div className="body-entry-list">
            {entries.slice(0, 10).map(e => (
              <div key={e.id} className="body-entry-row">
                <span className="body-entry-date">{e.logged_at}</span>
                <div className="body-entry-values">
                  {e.weight_kg         && <span>{e.weight_kg} kg</span>}
                  {e.estimated_bf_pct  && <span>{e.estimated_bf_pct}% fett</span>}
                  {e.muscle_mass_kg    && <span>{e.muscle_mass_kg} kg muskler</span>}
                  {e.water_pct         && <span>{e.water_pct}% vatten</span>}
                  {e.waist_cm          && <span>midja {e.waist_cm} cm</span>}
                  {e.chest_cm    && <span>bröst {e.chest_cm} cm</span>}
                  {e.arm_cm      && <span>arm {e.arm_cm} cm</span>}
                  {e.thigh_cm    && <span>lår {e.thigh_cm} cm</span>}
                </div>
                {e.notes && <p className="body-entry-notes">{e.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log form modal */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Logga mätning</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="modal-body body-form">
              <label className="field-label">Datum
                <input type="date" className="field-input" value={form.logged_at}
                  onChange={e => setForm(f => ({ ...f, logged_at: e.target.value }))} />
              </label>

              <div className="body-form-section">
                <h4>Vikt</h4>
                <label className="field-label">Kroppsvikt (kg)
                  <input type="number" step="0.1" className="field-input" placeholder="e.g. 82.5"
                    value={form.weight_kg}
                    onChange={e => setForm(f => ({ ...f, weight_kg: e.target.value }))} />
                </label>
                {previewBmi && (
                  <p className="body-form-hint">BMI: {previewBmi} – {bmiCategory(previewBmi)}</p>
                )}
              </div>

              <div className="body-form-section">
                <h4>Mått (cm)</h4>
                <div className="body-form-grid">
                  {[
                    { key: 'waist_cm', label: 'Midja' },
                    { key: 'neck_cm',  label: 'Hals' },
                    { key: 'hip_cm',   label: 'Höft', hidden: prefs.gender === 'male' },
                    { key: 'chest_cm', label: 'Bröst/Bröstkorgen' },
                    { key: 'arm_cm',   label: 'Arm (flexad)' },
                    { key: 'thigh_cm', label: 'Lår' },
                  ].filter(f => !f.hidden).map(({ key, label }) => (
                    <label key={key} className="field-label">{label}
                      <input type="number" step="0.5" className="field-input" placeholder="cm"
                        value={form[key as keyof typeof form]}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                    </label>
                  ))}
                </div>
                {previewBf !== null && (
                  <p className="body-form-hint">
                    Uppskattad kroppsfett (Navy-metoden): <strong>{previewBf}%</strong>
                  </p>
                )}
                {previewBf === null && (prefs.gender === 'male'
                  ? form.waist_cm && form.neck_cm && prefs.height_cm
                  : form.waist_cm && form.neck_cm && form.hip_cm && prefs.height_cm
                ) && (
                  <p className="body-form-hint text-warning">
                    Kontrollera måtten – kan inte beräkna fett%
                  </p>
                )}
                {!prefs.height_cm && (
                  <p className="body-form-hint text-warning">
                    Ange din längd i inställningar för BF%-uppskattning
                  </p>
                )}
              </div>

              <div className="body-form-section">
                <label className="field-label">Anteckningar
                  <textarea className="field-input" rows={2} placeholder="Frivilligt…"
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Avbryt</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Sparar…' : 'Spara'}
              </button>
            </div>
          </div>
        </div>
      )}

      {saved && (
        <div className="toast">Mätning sparad ✓</div>
      )}
    </div>
  )
}
