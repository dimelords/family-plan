import { useState } from 'react'
import { getMonday, weekDays, todayDayIndex } from '../lib/dates'

export function useWeek() {
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()))
  const [selectedDay, setSelectedDay] = useState<number>(todayDayIndex)

  const days = weekDays(weekStart)

  function changeWeek(dir: 1 | -1) {
    setWeekStart(prev => {
      const d = new Date(prev)
      d.setDate(d.getDate() + dir * 7)
      return d
    })
  }

  function goToDate(date: Date) {
    setWeekStart(getMonday(date))
    setSelectedDay((date.getDay() + 6) % 7)
  }

  function goToMonth(date: Date) {
    setWeekStart(getMonday(date))
  }

  return { weekStart, days, selectedDay, setSelectedDay, changeWeek, goToDate, goToMonth }
}
