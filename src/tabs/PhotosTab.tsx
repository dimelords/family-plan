import { useState, useRef, useCallback, useEffect } from 'react'
import { useProgressPhotos } from '../hooks/useProgressPhotos'
import { claudeCall, getApiKey } from '../lib/claude'
import type { FamilyMember, PersonPreferences, ProgressPhoto } from '../types/database'

interface Props {
  familyId: string
  member: FamilyMember
  prefs: PersonPreferences
}

const today = new Date().toISOString().slice(0, 10)
const LABELS = ['Fram', 'Sida', 'Bak', 'Övrigt']

export function PhotosTab({ familyId, member, prefs }: Props) {
  const { photos, uploadPhoto, getUrl, saveAnalysis, deletePhoto } = useProgressPhotos(familyId, member.name)

  // Upload form state
  const [showUpload, setShowUpload] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [uploadDate, setUploadDate] = useState(today)
  const [uploadLabel, setUploadLabel] = useState('Fram')
  const [uploadNotes, setUploadNotes] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Gallery: signed URLs cache
  const [urls, setUrls] = useState<Record<string, string>>({})
  const loadingUrls = useRef<Set<string>>(new Set())

  const loadUrl = useCallback(async (path: string) => {
    if (urls[path] || loadingUrls.current.has(path)) return
    loadingUrls.current.add(path)
    const url = await getUrl(path)
    if (url) setUrls(prev => ({ ...prev, [path]: url }))
  }, [urls, getUrl])

  useEffect(() => {
    photos.forEach(p => loadUrl(p.storage_path))
  }, [photos, loadUrl])

  // Before/after comparison
  const [compareMode, setCompareMode] = useState(false)
  const [beforeId, setBeforeId] = useState<string | null>(null)
  const [afterId, setAfterId] = useState<string | null>(null)
  const [sliderPct, setSliderPct] = useState(50)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<string | null>(null)

  // Lightbox
  const [lightboxPhoto, setLightboxPhoto] = useState<ProgressPhoto | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadFile(file)
    const reader = new FileReader()
    reader.onload = ev => setUploadPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleUpload() {
    if (!uploadFile) return
    setUploading(true)
    await uploadPhoto(uploadFile, uploadDate, uploadLabel, uploadNotes || null)
    setUploading(false)
    setShowUpload(false)
    setUploadFile(null)
    setUploadPreview(null)
    setUploadNotes('')
  }

  const beforePhoto = photos.find(p => p.id === beforeId)
  const afterPhoto  = photos.find(p => p.id === afterId)

  async function handleAnalyze() {
    if (!beforePhoto || !afterPhoto) return
    const key = getApiKey()
    if (!key) { alert('Ange din Anthropic API-nyckel i ⚙️ Inställningar.'); return }

    const beforeUrl = urls[beforePhoto.storage_path]
    const afterUrl  = urls[afterPhoto.storage_path]
    if (!beforeUrl || !afterUrl) { alert('Bilderna laddas fortfarande…'); return }

    // Fetch both images as base64 for the Claude Vision API call
    setAnalyzing(true)
    setAnalysisResult(null)
    try {
      const toBase64 = async (url: string) => {
        const resp = await fetch(url)
        const blob = await resp.blob()
        return new Promise<{ data: string; mediaType: string }>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            const result = reader.result as string
            const [header, data] = result.split(',')
            const mediaType = header.match(/data:([^;]+)/)?.[1] ?? 'image/jpeg'
            resolve({ data, mediaType })
          }
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
      }

      const [before64, after64] = await Promise.all([toBase64(beforeUrl), toBase64(afterUrl)])

      const gender = prefs.gender
      const goal = prefs.training_goal

      const system = `Du är en certifierad tränings- och kroppskompositionsexpert med djup kunskap om 2025 träningsvetenskap.

Analysera två framstegsfotografier (BEFORE och AFTER) av samma person.
${gender === 'male' ? 'Personen är man.' : gender === 'female' ? 'Personen är kvinna.' : ''}
${goal ? `Personens mål: ${goal === 'muscle_gain' ? 'muskelbygge' : goal === 'weight_loss' ? 'fettförbränning' : goal === 'endurance' ? 'kondition' : 'allmän hälsa'}.` : ''}

Din analys ska:
1. Identifiera KONKRETA synliga förändringar: muskelvolym, definition, fettdistribution, hållning, proportioner
2. Koppla förändringarna till träningsvetenskapliga mekanismer (t.ex. hypertrofi, fettförlust, muskelkompositon)
3. Lyfta fram det mest imponerande framsteget specifikt
4. Ge 1–2 konkreta tips för fortsatt progress baserat på vad bilderna visar

Ton: professionell, evidensbaserad, uppmuntrande. Inga vaga komplimanger – var specifik.
Svara på svenska. Max 220 ord.`

      const content = [
        { type: 'text', text: `BEFORE (${beforePhoto.taken_at}):` },
        { type: 'image', source: { type: 'base64', media_type: before64.mediaType, data: before64.data } },
        { type: 'text', text: `AFTER (${afterPhoto.taken_at}):` },
        { type: 'image', source: { type: 'base64', media_type: after64.mediaType, data: after64.data } },
        { type: 'text', text: 'Analysera framstegen.' },
      ]

      const raw = await claudeCall(system, content as Parameters<typeof claudeCall>[1], 500)
      setAnalysisResult(raw)

      // Save to the "after" photo record
      await saveAnalysis(afterPhoto.id, raw)
    } catch (err) {
      console.error(err)
      setAnalysisResult('Kunde inte analysera bilderna. Kontrollera API-nyckeln.')
    }
    setAnalyzing(false)
  }

  const groupedByDate = photos.reduce<Record<string, ProgressPhoto[]>>((acc, p) => {
    (acc[p.taken_at] ??= []).push(p)
    return acc
  }, {})

  return (
    <div className="photos-tab">
      {/* Header actions */}
      <div className="photos-header">
        <div className="photos-header-actions">
          <button className="btn-primary" onClick={() => setShowUpload(true)}>+ Lägg till foto</button>
          {photos.length >= 2 && (
            <button
              className={`btn-secondary ${compareMode ? 'active' : ''}`}
              onClick={() => { setCompareMode(v => !v); setBeforeId(null); setAfterId(null); setAnalysisResult(null) }}
            >
              {compareMode ? '✕ Avsluta jämförelse' : '⇄ Jämför'}
            </button>
          )}
        </div>
        {compareMode && (
          <p className="photos-compare-hint">
            {!beforeId ? 'Välj FÖRUT-bild' : !afterId ? 'Välj EFTER-bild' : 'Jämför bilderna nedan'}
          </p>
        )}
      </div>

      {/* Before/After slider */}
      {compareMode && beforeId && afterId && (
        <div className="compare-section">
          <div className="compare-slider-wrap">
            <div className="compare-before" style={{ backgroundImage: `url(${urls[beforePhoto!.storage_path]})` }} />
            <div
              className="compare-after"
              style={{
                backgroundImage: `url(${urls[afterPhoto!.storage_path]})`,
                clipPath: `inset(0 ${100 - sliderPct}% 0 0)`,
              }}
            />
            <input
              type="range" min={0} max={100} value={sliderPct}
              className="compare-range"
              onChange={e => setSliderPct(Number(e.target.value))}
            />
            <div className="compare-divider" style={{ left: `${sliderPct}%` }}>
              <span className="compare-handle">⇄</span>
            </div>
            <span className="compare-label compare-label-before">Förut<br/>{beforePhoto!.taken_at}</span>
            <span className="compare-label compare-label-after">Efter<br/>{afterPhoto!.taken_at}</span>
          </div>

          <div className="compare-ai">
            {!analysisResult ? (
              <button className="btn-primary" onClick={handleAnalyze} disabled={analyzing}>
                {analyzing ? '🤖 Analyserar…' : '🤖 AI-analys av framsteg'}
              </button>
            ) : (
              <div className="compare-analysis">
                <div className="compare-analysis-label">🤖 AI-analys</div>
                <p>{analysisResult}</p>
                <button className="btn-secondary" onClick={() => setAnalysisResult(null)}>Ny analys</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gallery grouped by date */}
      {photos.length === 0 && (
        <div className="photos-empty">
          <div className="photos-empty-icon">📷</div>
          <p>Inga framstegsfotografier än. Lägg till ditt första!</p>
        </div>
      )}

      {Object.entries(groupedByDate).map(([date, datePhotos]) => (
        <div key={date} className="photos-date-group">
          <div className="photos-date-label">{date}</div>
          <div className="photos-grid">
            {datePhotos.map(photo => {
              const url = urls[photo.storage_path]
              const isSelectedBefore = beforeId === photo.id
              const isSelectedAfter  = afterId  === photo.id

              function handlePhotoClick() {
                if (!compareMode) { setLightboxPhoto(photo); return }
                if (!beforeId)      { setBeforeId(photo.id); return }
                if (!afterId && photo.id !== beforeId) { setAfterId(photo.id); return }
                // Deselect
                if (beforeId === photo.id) setBeforeId(null)
                else if (afterId === photo.id) setAfterId(null)
              }

              return (
                <div
                  key={photo.id}
                  className={`photo-thumb ${isSelectedBefore ? 'selected-before' : ''} ${isSelectedAfter ? 'selected-after' : ''}`}
                  onClick={handlePhotoClick}
                >
                  {url
                    ? <img src={url} alt={photo.label ?? ''} loading="lazy" />
                    : <div className="photo-thumb-loading">⏳</div>
                  }
                  {photo.label && <span className="photo-label">{photo.label}</span>}
                  {compareMode && isSelectedBefore && <span className="photo-badge">Förut</span>}
                  {compareMode && isSelectedAfter  && <span className="photo-badge after">Efter</span>}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Upload modal */}
      {showUpload && (
        <div className="modal-backdrop" onClick={() => setShowUpload(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Lägg till foto</h2>
              <button className="modal-close" onClick={() => setShowUpload(false)}>✕</button>
            </div>
            <div className="modal-body">
              {!uploadPreview ? (
                <div className="photo-upload-drop" onClick={() => fileInputRef.current?.click()}>
                  <div className="photo-upload-icon">📷</div>
                  <p>Tryck för att välja foto</p>
                  <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
                    style={{ display: 'none' }} onChange={handleFileChange} />
                </div>
              ) : (
                <div className="photo-upload-preview">
                  <img src={uploadPreview} alt="Förhandsvisning" />
                  <button className="btn-secondary" onClick={() => { setUploadFile(null); setUploadPreview(null) }}>
                    Byt bild
                  </button>
                </div>
              )}

              <label className="field-label">Datum
                <input type="date" className="field-input" value={uploadDate}
                  onChange={e => setUploadDate(e.target.value)} />
              </label>

              <label className="field-label">Vinkel
                <div className="pill-row">
                  {LABELS.map(l => (
                    <button key={l} className={`pill ${uploadLabel === l ? 'active' : ''}`}
                      onClick={() => setUploadLabel(l)}>{l}</button>
                  ))}
                </div>
              </label>

              <label className="field-label">Anteckningar
                <textarea className="field-input" rows={2} placeholder="Valfritt…"
                  value={uploadNotes} onChange={e => setUploadNotes(e.target.value)} />
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowUpload(false)}>Avbryt</button>
              <button className="btn-primary" disabled={!uploadFile || uploading} onClick={handleUpload}>
                {uploading ? 'Laddar upp…' : 'Spara'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxPhoto && (
        <div className="modal-backdrop" onClick={() => setLightboxPhoto(null)}>
          <div className="lightbox" onClick={e => e.stopPropagation()}>
            <button className="modal-close lightbox-close" onClick={() => setLightboxPhoto(null)}>✕</button>
            {urls[lightboxPhoto.storage_path] && (
              <img src={urls[lightboxPhoto.storage_path]} alt={lightboxPhoto.label ?? ''} />
            )}
            <div className="lightbox-meta">
              <span>{lightboxPhoto.taken_at}</span>
              {lightboxPhoto.label && <span>{lightboxPhoto.label}</span>}
            </div>
            {lightboxPhoto.notes && <p className="lightbox-notes">{lightboxPhoto.notes}</p>}
            {lightboxPhoto.ai_analysis && (
              <div className="lightbox-analysis">
                <div className="compare-analysis-label">🤖 AI-analys</div>
                <p>{lightboxPhoto.ai_analysis}</p>
              </div>
            )}
            <button
              className="btn-danger"
              onClick={async () => { await deletePhoto(lightboxPhoto); setLightboxPhoto(null) }}
            >
              🗑 Ta bort
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
