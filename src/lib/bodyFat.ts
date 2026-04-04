/**
 * US Navy Body Fat % estimation formulas.
 * All measurements in centimetres, height in centimetres.
 *
 * Men:    BF% = 495 / (1.0324 - 0.19077·log10(waist-neck) + 0.15456·log10(height)) - 450
 * Women:  BF% = 495 / (1.29579 - 0.35004·log10(waist+hip-neck) + 0.22100·log10(height)) - 450
 *
 * Returns null if required measurements are missing/invalid.
 */

export function estimateBfPct(params: {
  gender: 'male' | 'female' | 'other' | null
  height_cm: number | null
  waist_cm: number | null
  neck_cm: number | null
  hip_cm: number | null   // required for female
}): number | null {
  const { gender, height_cm, waist_cm, neck_cm, hip_cm } = params

  if (!height_cm || height_cm <= 0) return null
  if (!waist_cm || !neck_cm) return null
  if (waist_cm <= neck_cm) return null  // would produce log of zero/negative

  const h = height_cm

  if (gender === 'male') {
    const ratio = waist_cm - neck_cm
    if (ratio <= 0) return null
    const bf = 495 / (1.0324 - 0.19077 * Math.log10(ratio) + 0.15456 * Math.log10(h)) - 450
    return Math.max(2, Math.min(60, Math.round(bf * 10) / 10))
  }

  if (gender === 'female') {
    if (!hip_cm) return null
    const sum = waist_cm + hip_cm - neck_cm
    if (sum <= 0) return null
    const bf = 495 / (1.29579 - 0.35004 * Math.log10(sum) + 0.22100 * Math.log10(h)) - 450
    return Math.max(8, Math.min(60, Math.round(bf * 10) / 10))
  }

  return null  // 'other' — formula not defined, skip
}

/** BMI helper */
export function calcBmi(weight_kg: number | null, height_cm: number | null): number | null {
  if (!weight_kg || !height_cm || height_cm <= 0) return null
  const bmi = weight_kg / Math.pow(height_cm / 100, 2)
  return Math.round(bmi * 10) / 10
}

export function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return 'Undervikt'
  if (bmi < 25)   return 'Normalvikt'
  if (bmi < 30)   return 'Övervikt'
  return 'Fetma'
}
