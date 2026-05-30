'use client'

import { useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

interface RankingData {
  date: string
  rank: number
  code?: string
  name?: string
  company?: string
  market_cap: number
}

interface Props {
  data: RankingData[]
  startDate: string
  endDate: string
}

export default function MarketCapRankingChart({ data, startDate, endDate }: Props) {
  const [topN, setTopN] = useState<number>(10)

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    // 最新月のデータを使用（startDate/endDateは表示用に保持）
    const latestDate = [...new Set(data.map(d => d.date))].sort().reverse()[0]

    return data
      .filter(item => item.date === latestDate && item.rank <= topN)
      .sort((a, b) => a.rank - b.rank) // 順位順
  }, [data, topN])

  // 1円単位 → 兆円変換
  const formatYAxis = (value: number) => {
    const trillion = value / 1_000_000_000_000
    return `${trillion.toFixed(1)}兆`
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-4 text-sm">
          <p className="font-bold">#{item.rank} {item.name || item.company}</p>
          <p className="text-blue-600 mt-1">
            時価総額: <span className="font-mono">
              {(Number(item.market_cap) / 1_000_000_000_000).toFixed(2)} 兆円
            </span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">時価総額ランキング</h2>
          <p className="text-sm text-gray-500 mt-1">
            集計期間: {startDate} ～ {endDate}（最新月表示）
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">表示:</span>
          <select
            value={topN}
            onChange={(e) => setTopN(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={10}>Top 10</option>
            <option value={50}>Top 50</option>
            <option value={100}>Top 100</option>
          </select>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={520}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 20, right: 60, bottom: 20, left: 180 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

          <XAxis 
            type="number"
            tickFormatter={formatYAxis}
          />

          <YAxis 
            type="category"
            dataKey="name"
            width={160}
            tick={{ fontSize: 13 }}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend 
            verticalAlign="top" 
            align="center"
            wrapperStyle={{ paddingBottom: 15 }}
          />

          <Bar
            dataKey="market_cap"
            fill="#2563eb"
            radius={[0, 6, 6, 0]}
            name="時価総額"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
