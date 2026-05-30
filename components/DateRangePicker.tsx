'use client'

import { useState, useCallback } from 'react'

interface DateRangePickerProps {
  onDateRangeChange: (startDate: string, endDate: string) => void
  availableDates: string[]
}

export default function DateRangePicker({
  onDateRangeChange,
  availableDates,
}: DateRangePickerProps) {
  const [startDate, setStartDate] = useState<string>(
    availableDates.length > 0 ? availableDates[0] : ''
  )
  const [endDate, setEndDate] = useState<string>(
    availableDates.length > 0 ? availableDates[availableDates.length - 1] : ''
  )

  const handleStartDateChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newStart = e.target.value
      setStartDate(newStart)
      onDateRangeChange(newStart, endDate)
    },
    [endDate, onDateRangeChange]
  )

  const handleEndDateChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newEnd = e.target.value
      setEndDate(newEnd)
      onDateRangeChange(startDate, newEnd)
    },
    [startDate, onDateRangeChange]
  )

  const handleReset = useCallback(() => {
    const newStart = availableDates[0]
    const newEnd = availableDates[availableDates.length - 1]
    setStartDate(newStart)
    setEndDate(newEnd)
    onDateRangeChange(newStart, newEnd)
  }, [availableDates, onDateRangeChange])

  return (
    <div className="controls-container">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1">
          <label htmlFor="start-date" className="block text-sm font-semibold text-gray-700 mb-2">
            開始日:
          </label>
          <select
            id="start-date"
            value={startDate}
            onChange={handleStartDateChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-jpx-primary focus:border-jpx-primary"
          >
            {availableDates.map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label htmlFor="end-date" className="block text-sm font-semibold text-gray-700 mb-2">
            終了日:
          </label>
          <select
            id="end-date"
            value={endDate}
            onChange={handleEndDateChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-jpx-primary focus:border-jpx-primary"
          >
            {availableDates.map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleReset}
          className="px-4 py-2 bg-jpx-primary text-white rounded-md hover:bg-opacity-90 transition-colors font-semibold"
        >
          リセット
        </button>
      </div>
    </div>
  )
}
