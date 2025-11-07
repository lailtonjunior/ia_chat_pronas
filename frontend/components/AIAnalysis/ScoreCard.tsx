'use client'

import { AlertCircle } from 'lucide-react'

interface ScoreCardProps {
  score: number
  title?: string
  description?: string
  showTrend?: boolean
  trendDirection?: 'up' | 'down' | 'stable'
  trendPercent?: number
}

export default function ScoreCard({
  score,
  title = 'Conformidade',
  description,
  showTrend = false,
  trendDirection = 'up',
  trendPercent = 0,
}: ScoreCardProps) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'bg-green-100 text-green-900 border-green-300'
    if (s >= 60) return 'bg-yellow-100 text-yellow-900 border-yellow-300'
    return 'bg-red-100 text-red-900 border-red-300'
  }

  const getProgressColor = (s: number) => {
    if (s >= 80) return 'bg-green-600'
    if (s >= 60) return 'bg-yellow-600'
    return 'bg-red-600'
  }

  const getTrendIcon = () => {
    if (trendDirection === 'up') return '📈'
    if (trendDirection === 'down') return '📉'
    return '➡️'
  }

  return (
    <div
      className={`rounded-lg p-6 border-2 ${getScoreColor(score)}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-semibold opacity-75">{title}</p>
          {description && (
            <p className="text-xs opacity-60 mt-1">{description}</p>
          )}
        </div>
        {showTrend && (
          <div className="text-2xl">{getTrendIcon()}</div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-4">
        <div className="text-4xl font-bold">{score}</div>
        <div className="text-lg opacity-75">%</div>
        {showTrend && trendPercent !== 0 && (
          <div className={`text-sm font-semibold ${
            trendDirection === 'up' ? 'text-green-700' : 'text-red-700'
          }`}>
            {trendDirection === 'up' ? '+' : '-'}{Math.abs(trendPercent)}%
          </div>
        )}
      </div>

      <div className="w-full h-3 bg-white bg-opacity-30 rounded-full overflow-hidden">
        <div
          className={`h-full ${getProgressColor(score)} rounded-full transition-all`}
          style={{ width: `${score}%` }}
        ></div>
      </div>

      {score < 60 && (
        <div className="mt-4 flex items-gap-2 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Este projeto necessita de atenção urgente</span>
        </div>
      )}
    </div>
  )
}
