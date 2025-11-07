'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface Suggestion {
  id: string
  text: string
  suggestion: string
  reason: string
  priority: 'high' | 'medium' | 'low'
}

interface SuggestionHighlightProps {
  suggestion: Suggestion
  onAccept?: (id: string) => void
  onReject?: (id: string) => void
}

export default function SuggestionHighlight({
  suggestion,
  onAccept,
  onReject,
}: SuggestionHighlightProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const priorityColors = {
    high: 'bg-red-100 border-red-300',
    medium: 'bg-yellow-100 border-yellow-300',
    low: 'bg-blue-100 border-blue-300',
  }

  const priorityIcons = {
    high: <AlertCircle className="w-4 h-4 text-red-600" />,
    medium: <AlertCircle className="w-4 h-4 text-yellow-600" />,
    low: <AlertCircle className="w-4 h-4 text-blue-600" />,
  }

  return (
    <div
      className={`border-l-4 p-4 rounded cursor-pointer transition-colors ${
        priorityColors[suggestion.priority]
      }`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-start gap-3">
        {priorityIcons[suggestion.priority]}

        <div className="flex-1">
          <p className="font-semibold text-gray-900 line-clamp-2">
            {suggestion.text}
          </p>
          {isExpanded && (
            <>
              <p className="text-sm text-gray-600 mt-2 mb-3">
                {suggestion.reason}
              </p>

              <div className="bg-white bg-opacity-50 p-3 rounded mb-3">
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  Sugestão:
                </p>
                <p className="text-sm text-green-700">{suggestion.suggestion}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onAccept?.(suggestion.id)
                  }}
                  className="flex items-center gap-1 text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4" />
                  Aceitar
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onReject?.(suggestion.id)
                  }}
                  className="flex items-center gap-1 text-sm bg-gray-300 text-gray-900 px-3 py-1 rounded hover:bg-gray-400"
                >
                  <XCircle className="w-4 h-4" />
                  Ignorar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
