import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { useTheme } from './hooks/useTheme'
import { useWeek } from './hooks/useWeek'
import { useFamily } from './hooks/useFamily'
import { useScheduleData } from './hooks/useScheduleData'
import { useCurrentMember } from './hooks/useCurrentMember'
import { usePersonFeatures } from './hooks/usePersonFeatures'
import { useAuth } from './hooks/useAuth'
import { useTrainingPlan } from './hooks/useTrainingPlan'
import { dateStr } from './lib/dates'
import { supabase } from './lib/supabase'
import { Header } from './components/Header'
import { StatusBar } from './components/StatusBar'
import { DayStrip } from './components/DayStrip'
import { DayPanel } from './components/DayPanel'
// Tabs — lazy-loaded so only the active tab's code is fetched
const TrainingTab    = lazy(() => import('./tabs/TrainingTab').then(m => ({ default: m.TrainingTab })))
const MealsTab       = lazy(() => import('./tabs/MealsTab').then(m => ({ default: m.MealsTab })))
const PantryTab      = lazy(() => import('./tabs/PantryTab').then(m => ({ default: m.PantryTab })))
const BodyTab        = lazy(() => import('./tabs/BodyTab').then(m => ({ default: m.BodyTab })))
const PhotosTab      = lazy(() => import('./tabs/PhotosTab').then(m => ({ default: m.PhotosTab })))

// Modals — lazy-loaded since they start closed
const EventModal     = lazy(() => import('./components/modals/EventModal').then(m => ({ default: m.EventModal })))
const MealModal      = lazy(() => import('./components/modals/MealModal').then(m => ({ default: m.MealModal })))
const PantryModal    = lazy(() => import('./components/modals/PantryModal').then(m => ({ default: m.PantryModal })))
const SettingsModal  = lazy(() => import('./components/modals/SettingsModal').then(m => ({ default: m.SettingsModal })))
const OnboardingModal = lazy(() => import('./components/modals/OnboardingModal').then(m => ({ default: m.OnboardingModal })))
import { LoginScreen } from './components/auth/LoginScreen'
import { FamilySetupScreen } from './components/auth/FamilySetupScreen'

type Tab = 'training' | 'meals' | 'pantry' | 'body' | 'photos'
type PantryMode = 'manual' | 'ai'

// ─── Root: handles auth state ────────────────────────────────────────────────

export default function App() {
  useTheme()
  const auth = useAuth()
  const joinToken = useMemo(
    () => new URLSearchParams(window.location.search).get('join') ?? undefined,
    [],
  )

  if (auth.status === 'loading') {
    return <div className="loading-screen"><div className="spinner" /></div>
  }
  if (auth.status === 'unauthenticated') {
    return <LoginScreen />
  }
  return <AuthenticatedApp user={auth.user} joinToken={joinToken} />
}

// ─── Authenticated: resolves family membership ───────────────────────────────

type MemberRef = { id: string; family_id: string } | null | 'loading'

function AuthenticatedApp({ user, joinToken }: { user: User; joinToken?: string }) {
  const [memberRef, setMemberRef] = useState<MemberRef>('loading')

  useEffect(() => {
    supabase
      .from('family_members')
      .select('id, family_id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setMemberRef(data ?? null))
  }, [user.id])

  function reload() {
    setMemberRef('loading')
    supabase
      .from('family_members')
      .select('id, family_id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setMemberRef(data ?? null))
  }

  if (memberRef === 'loading') {
    return <div className="loading-screen"><div className="spinner" /></div>
  }
  if (memberRef === null) {
    return (
      <FamilySetupScreen
        user={user}
        inviteToken={joinToken}
        onDone={reload}
      />
    )
  }
  return <MainApp familyId={memberRef.family_id} memberId={memberRef.id} />
}

// ─── Main app ────────────────────────────────────────────────────────────────

function MainApp({ familyId, memberId }: { familyId: string; memberId: string }) {
  const { weekStart, days, selectedDay, setSelectedDay, changeWeek } = useWeek()
  const { members, colorMap } = useFamily(familyId)
  const { events, meals, pantry, recentMeals, status, reload } = useScheduleData(familyId, weekStart)
  const { member, prefs, loadingPrefs, savePrefs } = useCurrentMember(familyId, members, memberId)
  const features = usePersonFeatures(prefs)
  const { sessions: trainingSessions } = useTrainingPlan(familyId, member?.name ?? null)

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

  const showOnboarding = !loadingPrefs && !!member && features.needsOnboarding

  return (
    <>
      <Header
        weekStart={weekStart}
        onPrev={() => changeWeek(-1)}
        onNext={() => changeWeek(1)}
        onSettings={() => setSettingsOpen(true)}
      />

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

      <Suspense fallback={<div className="loading-screen"><div className="spinner" /></div>}>
        {tab === 'training' && features.canUseTraining && prefs && member && (
          <TrainingTab familyId={familyId} member={member} prefs={prefs} />
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
        {tab === 'body' && features.canUseBodyTracking && prefs && member && (
          <BodyTab familyId={familyId} member={member} prefs={prefs} />
        )}
        {tab === 'photos' && features.canUseBodyTracking && prefs && member && (
          <PhotosTab familyId={familyId} member={member} prefs={prefs} />
        )}
      </Suspense>

      {!features.canUseTraining && !features.canUseNutritionAI && !features.canUseBodyTracking && member && (
        <div className="feature-locked">
          <div className="feature-locked-icon">🔒</div>
          <div className="feature-locked-text">
            Gym- och kostfunktioner är inte aktiverade för {member.name}.
            {features.isMinor && ' En vuxen i familjen kan aktivera dem under ⚙️.'}
          </div>
        </div>
      )}

      {member && (
        <Suspense fallback={null}>
          <EventModal
            open={eventModalDay !== null}
            familyId={familyId}
            day={eventModalDay !== null ? days[eventModalDay] : null}
            members={members}
            onClose={() => setEventModalDay(null)}
            onSaved={() => { setEventModalDay(null); reload() }}
          />
          <MealModal
            open={mealModalOpen}
            familyId={familyId}
            day={days[selectedDay]}
            pantry={pantry}
            recentMeals={recentMeals}
            currentMeals={meals}
            member={member}
            prefs={prefs}
            trainingSession={trainingSessions.find(
              s => days[selectedDay] && s.scheduled_date === dateStr(days[selectedDay])
            ) ?? null}
            onClose={() => setMealModalOpen(false)}
            onSaved={() => { setMealModalOpen(false); reload() }}
          />
          <PantryModal
            open={pantryModalOpen}
            familyId={familyId}
            mode={pantryMode}
            onClose={() => setPantryModalOpen(false)}
            onSaved={() => { setPantryModalOpen(false); reload() }}
          />
          <OnboardingModal
            open={showOnboarding}
            member={member}
            onDone={async (p) => { await savePrefs(p) }}
          />
        </Suspense>
      )}

      <Suspense fallback={null}>
        <SettingsModal
          open={settingsOpen}
          member={member}
          prefs={prefs}
          onSavePrefs={savePrefs}
          onClose={() => setSettingsOpen(false)}
        />
      </Suspense>
    </>
  )
}
