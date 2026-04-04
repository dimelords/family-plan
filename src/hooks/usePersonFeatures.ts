import type { PersonPreferences } from '../types/database'

export interface PersonFeatures {
  canUseTraining: boolean
  canUseNutritionAI: boolean
  canUseBodyTracking: boolean
  canUseScanner: boolean
  isMinor: boolean
  ageYears: number | null
  needsOnboarding: boolean
}

function ageFromDob(dob: string | null): number | null {
  if (!dob) return null
  const today = new Date()
  const birth = new Date(dob)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export function usePersonFeatures(prefs: PersonPreferences | null): PersonFeatures {
  if (!prefs) {
    // No prefs yet — show nothing gated, onboarding required
    return {
      canUseTraining: false,
      canUseNutritionAI: false,
      canUseBodyTracking: false,
      canUseScanner: false,
      isMinor: false,
      ageYears: null,
      needsOnboarding: true,
    }
  }

  const age = ageFromDob(prefs.date_of_birth)
  const isMinor = age !== null && age < 18

  return {
    canUseTraining: prefs.enable_training,
    // Minors need explicit opt-in from owner for AI nutrition
    canUseNutritionAI: isMinor ? prefs.enable_nutrition_ai : prefs.enable_nutrition_ai,
    canUseBodyTracking: isMinor ? prefs.enable_body_tracking : prefs.enable_body_tracking,
    // Scanner never available to minors unless owner enables body tracking
    canUseScanner: isMinor ? false : prefs.enable_nutrition_ai,
    isMinor,
    ageYears: age,
    needsOnboarding: !prefs.onboarding_completed,
  }
}
