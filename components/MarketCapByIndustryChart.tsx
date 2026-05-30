'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

interface MarketCapData {
  date: string
  industry: string
  market_cap: number
}

interface Props {
  data: MarketCapData[]
  startDate: string
  endDate: string
}

export default function MarketCapByIndustryChart({ data, startDate, endDate }: Props) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    const dates = [...new Set(data.map(d => d.date))].sort()
    const filteredDates = dates.filter(date => date >= startDate && date <= endDate)

    return filteredDates.map(date => {
      const itemsForDate = data.filter(d => d.date === date)
      const row: any = { date }

      const sorted = [...itemsForDate].sort((a, b) => b.market_cap - a.market_cap)
      sorted.forEach(item => {
        row[item.industry] = Number(item.market_cap)
      })
      return row
    })
  }, [data, startDate, endDate])

  const legendPayload = useMemo(() => {
    if (!data || data.length === 0) return []
    const latestDate = [...new Set(data.map(d => d.date))].sort().reverse()[0]
    const latestData = data.filter(d => d.date === latestDate)

    return latestData
      .sort((a, b) => b.market_cap - a.market_cap)
      .slice(0, 15)
      .map((item, index) => ({
        value: item.industry,
        type: 'line' as const,
        color: `hsl(${(index * 25) % 360}, 75%, 55%)`,
      }))
  }, [data])

  // 縦軸のフォーマット修正
  const formatYAxis = (value: number) => {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}兆`
    } else if (value >= 10_000) {
      return `${(value / 10_000).toFixed(0)}万`
    }
    return value.toLocaleString()
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-4 text-sm max-w-md">
          <p className="font-bold text-lg mb-3 border-b pb-2">{label}</p>
          {payload
            .filter((p: any) => p.value != null)
            .sort((a: any, b: any) => (b.value || 0) - (a.value || 0))
            .map((entry: any, i: number) => (
              <div key={i} className="flex justify-between gap-6 py-0.5">
                <span className="font-medium">{entry.name}</span>
                <span className="font-mono text-blue-600">
                  {Number(entry.value).toLocaleString()} 百万円
                </span>
              </div>
            ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">業種別時価総額の推移</h2>
        <p className="text-sm text-gray-500 mt-1">{startDate} ～ {endDate}</p>
      </div>

      <ResponsiveContainer width="100%" height={620}>
        <LineChart data={chartData} margin={{ top: 20, right: 40, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
          <XAxis dataKey="date" />
          
          <YAxis 
            tickFormatter={formatYAxis}
            width={80}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            verticalAlign="top"
            align="center"
            payload={legendPayload}
            wrapperStyle={{
              paddingBottom: 25,
              fontSize: '13px',
              maxHeight: '200px',
              overflowY: 'auto',
            }}
          />

          {legendPayload.map((entry) => (
            <Line
              key={entry.value}
              type="monotone"
              dataKey={entry.value}
              stroke={entry.color}
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
              name={entry.value}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
