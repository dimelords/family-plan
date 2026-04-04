import { useState } from 'react'
import { useTheme } from './hooks/useTheme'
import { useWeek } from './hooks/useWeek'
import { useFamily } from './hooks/useFamily'
import { useScheduleData } from './hooks/useScheduleData'
import { useCurrentMember } from './hooks/useCurrentMember'
import { usePersonFeatures } from './hooks/usePersonFeatures'
import { supabase } from './lib/supabase'
import { Header } from './components/Header'
import { StatusBar } from './components/StatusBar'
import { DayStrip } from './components/DayStrip'
import { DayPanel } from './components/DayPanel'
import { PersonSwitcher } from './components/PersonSwitcher'
import { TrainingTab } from './tabs/TrainingTab'
import { MealsTab } from './tabs/MealsTab'
import { PantryTab } from './tabs/PantryTab'
import { BodyTab } from './tabs/BodyTab'
import { PhotosTab } from './tabs/PhotosTab'
import { EventModal } from './components/modals/EventModal'
import { MealModal } from './components/modals/MealModal'
import { PantryModal } from './components/modals/PantryModal'
import { SettingsModal } from './components/modals/SettingsModal'
import { OnboardingModal } from './components/modals/OnboardingModal'

const FAMILY_ID = '00000000-0000-0000-0000-000000000001'

type Tab = 'training' | 'meals' | 'pantry' | 'body' | 'photos'
type PantryMode = 'manual' | 'ai'

export default function App() {
  useTheme()
  const { weekStart, days, selectedDay, setSelectedDay, changeWeek } = useWeek()
  const { members, colorMap } = useFamily(FAMILY_ID)
  const { events, meals, pantry, recentMeals, status, reload } = useScheduleData(FAMILY_ID, weekStart)
  const { member, setMemberId, prefs, loadingPrefs, savePrefs } = useCurrentMember(FAMILY_ID, members)
  const features = usePersonFeatures(prefs)

  const [tab, setTab] = useState<Tab>('training')
  const [eventModalDay, setEventModalDay] = useState<number | null>(null)
  const [mealModalOpen, setMealModalOpen] = useState(false)
  const [pantryModalOpen, setPantryModalOpen] = useState(false)
  const [pantryMode, setPantryMode] = useState<PantryMode>('manual')
  const [settingsOpen, setSettingsOpen] = useState(false)

  async function deleteEvent(id: string) {
    await supabase.from('schedule_events').delete().eq('id', id)
    reload()
  }
  async function deleteMeal(id: string) {
    await supabase.from('meal_plan').delete().eq('id', id)
    reload()
  }
  async function deletePantry(id: string) {
    await supabase.from('pantry').delete().eq('id', id)
    reload()
  }

  function swipeDay(dir: 1 | -1) {
    setSelectedDay(prev => Math.min(6, Math.max(0, prev + dir)))
  }

  // Show onboarding if member selected but prefs not complete
  const showOnboarding = !loadingPrefs && !!member && features.needsOnboarding

  return (
    <>
      <Header
        weekStart={weekStart}
        onPrev={() => changeWeek(-1)}
        onNext={() => changeWeek(1)}
        onSettings={() => setSettingsOpen(true)}
      />

      <PersonSwitcher members={members} current={member} onSelect={setMemberId} />

      {!member && (
        <div className="pick-person-hint">
          Välj vem du är ovan för att komma igång 👆
        </div>
      )}

      {member && (
        <>
          <div className="legend">
            {members.map(m => (
              <div key={m.id} className="legend-item">
                <div className="dot" style={{ background: m.color }} />
                {m.name}
              </div>
            ))}
          </div>

          <StatusBar ok={status.ok} message={status.message} />

          <DayStrip
            days={days}
            selectedDay={selectedDay}
            events={events}
            colorMap={colorMap}
            onSelect={setSelectedDay}
          />

          <DayPanel
            days={days}
            selectedDay={selectedDay}
            events={events}
            colorMap={colorMap}
            onAddEvent={setEventModalDay}
            onDeleteEvent={deleteEvent}
            onSwipe={swipeDay}
          />

          <div className="tabs">
            {features.canUseTraining && (
              <button className={`tab-btn${tab === 'training' ? ' active' : ''}`} onClick={() => setTab('training')}>
                💪 Träning
              </button>
            )}
            {features.canUseNutritionAI && (
              <button className={`tab-btn${tab === 'meals' ? ' active' : ''}`} onClick={() => setTab('meals')}>
                🍽️ Mat
              </button>
            )}
            {features.canUseNutritionAI && (
              <button className={`tab-btn${tab === 'pantry' ? ' active' : ''}`} onClick={() => setTab('pantry')}>
                🛒 Skafferi
              </button>
            )}
            {features.canUseBodyTracking && (
              <button className={`tab-btn${tab === 'body' ? ' active' : ''}`} onClick={() => setTab('body')}>
                📊 Kropp
              </button>
            )}
            {features.canUseBodyTracking && (
              <button className={`tab-btn${tab === 'photos' ? ' active' : ''}`} onClick={() => setTab('photos')}>
                📷 Foton
              </button>
            )}
          </div>

          {tab === 'training' && features.canUseTraining && prefs && (
            <TrainingTab familyId={FAMILY_ID} member={member} prefs={prefs} />
          )}
          {tab === 'meals' && features.canUseNutritionAI && (
            <MealsTab days={days} meals={meals}
              onAdd={() => setMealModalOpen(true)}
              onDelete={deleteMeal} />
          )}
          {tab === 'pantry' && features.canUseNutritionAI && (
            <PantryTab pantry={pantry}
              onAddManual={() => { setPantryMode('manual'); setPantryModalOpen(true) }}
              onAddAI={() => { setPantryMode('ai'); setPantryModalOpen(true) }}
              onDelete={deletePantry}
              canUseScanner={features.canUseScanner}
            />
          )}

          {tab === 'body' && features.canUseBodyTracking && prefs && (
            <BodyTab familyId={FAMILY_ID} member={member} prefs={prefs} />
          )}
          {tab === 'photos' && features.canUseBodyTracking && prefs && (
            <PhotosTab familyId={FAMILY_ID} member={member} prefs={prefs} />
          )}

          {!features.canUseTraining && !features.canUseNutritionAI && !features.canUseBodyTracking && member && (
            <div className="feature-locked">
              <div className="feature-locked-icon">🔒</div>
              <div className="feature-locked-text">
                Gym- och kostfunktioner är inte aktiverade för {member.name}.
                {features.isMinor && ' En vuxen i familjen kan aktivera dem under ⚙️.'}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {member && (
        <>
          <EventModal
            open={eventModalDay !== null}
            familyId={FAMILY_ID}
            day={eventModalDay !== null ? days[eventModalDay] : null}
            members={members}
            onClose={() => setEventModalDay(null)}
            onSaved={() => { setEventModalDay(null); reload() }}
          />
          <MealModal
            open={mealModalOpen}
            familyId={FAMILY_ID}
            day={days[selectedDay]}
            dayIdx={selectedDay}
            pantry={pantry}
            recentMeals={recentMeals}
            currentMeals={meals}
            member={member}
            prefs={prefs}
            onClose={() => setMealModalOpen(false)}
            onSaved={() => { setMealModalOpen(false); reload() }}
          />
          <PantryModal
            open={pantryModalOpen}
            familyId={FAMILY_ID}
            mode={pantryMode}
            onClose={() => setPantryModalOpen(false)}
            onSaved={() => { setPantryModalOpen(false); reload() }}
          />
          <OnboardingModal
            open={showOnboarding}
            member={member}
            onDone={async (p) => { await savePrefs(p); }}
          />
        </>
      )}

      <SettingsModal
        open={settingsOpen}
        member={member}
        prefs={prefs}
        onSavePrefs={savePrefs}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  )
}
