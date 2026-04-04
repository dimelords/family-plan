export const DAY_NAMES = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'] as const
export const FULL_DAY_NAMES = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'] as const
export const MEAL_NAMES: Record<string, string> = { F: 'Frukost', L: 'Lunch', M: 'Middag' }

// Fredrik's gym split — Mon/Wed/Fri/Sun (0-indexed, Mon = 0)
export const GYM_DAYS = [0, 2, 4, 6] as const
export const GYM_LABELS = ['Ben & Glutes', '', 'Rygg & Biceps', '', 'Bröst & Triceps', '', 'Axlar & Core'] as const

export const TAG_LABELS = ['SKOLA', 'GYM', 'VILA'] as const

// Default member colours used when creating a new family
export const DEFAULT_MEMBER_COLORS = ['#c8f064', '#ff9de2', '#6fd4ff', '#ffb86c', '#ff9966', '#b8a9ff']
