'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { calculateProbability } from '@/lib/utils'
import type { Bet } from '@/types'

interface ChartPoint {
  time: number
  probability: number
  label: string
}

function buildChartData(bets: Bet[]): ChartPoint[] {
  if (bets.length === 0) {
    const now = Date.now()
    return [
      { time: now - 1000, probability: 50, label: '' },
      { time: now, probability: 50, label: '' },
    ]
  }

  const sorted = [...bets].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  const first = new Date(sorted[0].created_at).getTime()

  // Start at 50% just before the first bet
  const points: ChartPoint[] = [
    { time: first - 1, probability: 50, label: '' },
  ]

  let totalYes = 0
  let totalNo = 0

  for (const bet of sorted) {
    if (bet.side === 'yes') totalYes += bet.amount
    else totalNo += bet.amount

    const t = new Date(bet.created_at).getTime()
    points.push({
      time: t,
      probability: calculateProbability(totalYes, totalNo),
      label: new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
    })
  }

  return points
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

interface TooltipProps {
  active?: boolean
  payload?: { value: number }[]
  label?: number
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm shadow-xl">
      <p className="text-gray-400 text-xs mb-1">{label ? formatDate(label) : ''}</p>
      <p className="font-bold text-indigo-300">{payload[0].value}% Yes</p>
    </div>
  )
}

interface Props {
  bets: Bet[]
}

export default function ProbabilityChart({ bets }: Props) {
  const data = buildChartData(bets)
  const current = data[data.length - 1]?.probability ?? 50
  const first = data[0]?.probability ?? 50
  const delta = current - first
  const trending = bets.length >= 2 ? delta : 0

  return (
    <div className="bg-gray-900 rounded-xl p-5">
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Probabilité Yes</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{current}%</span>
            {bets.length >= 2 && (
              <span className={`text-sm font-medium ${trending > 0 ? 'text-green-400' : trending < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                {trending > 0 ? '+' : ''}{trending}%
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500">{bets.length} pari{bets.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="probGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="time"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatDate}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              minTickGap={60}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              ticks={[0, 25, 50, 75, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={50} stroke="#374151" strokeDasharray="4 4" />
            <Area
              type="stepAfter"
              dataKey="probability"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#probGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
