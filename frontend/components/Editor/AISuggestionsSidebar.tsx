'use client'

import { memo } from 'react'
import { Check, Trash2 } from 'lucide-react'

export interface AISuggestion {
  id: string
  section: string
  originalText: string
  suggestedText: string
  improvementType?: string
  range?: { from: number; to: number }
}

interface SidebarProps {
  isOpen: boolean
  loading: boolean
  suggestions: AISuggestion[]
  onApply: (suggestion: AISuggestion) => void
  onDismiss: (id: string) => void
  onClose: () => void
}

function AISuggestionsSidebarBase({
  isOpen,
  loading,
  suggestions,
  onApply,
  onDismiss,
  onClose,
}: SidebarProps) {
  return (
    <aside
      className={`fixed right-0 top-0 z-30 h-full w-full max-w-md transform bg-white shadow-2xl transition-transform duration-300 sm:relative sm:translate-x-0 sm:shadow-none ${
        isOpen ? 'translate-x-0' : 'translate-x-full sm:hidden'
      }`}
    >
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
            Sugestões IA
          </p>
          <h3 className="text-lg font-semibold text-gray-900">Ajustes Contextuais</h3>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
          aria-label="Fechar sugestões"
        >
          ×
        </button>
      </header>

      <div className="flex h-[calc(100%-64px)] flex-col overflow-hidden">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="h-3 w-3 animate-ping rounded-full bg-blue-500"></span>
              Gerando sugestões...
            </div>
          ) : suggestions.length === 0 ? (
            <p className="text-sm text-gray-500">
              Selecione um trecho do texto e pressione o botão “IA” para receber sugestões detalhadas.
            </p>
          ) : (
            suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-gray-500 uppercase">{suggestion.section}</p>
                  {suggestion.improvementType && (
                    <span className="text-[10px] font-semibold uppercase text-gray-400">
                      {suggestion.improvementType}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-gray-600 whitespace-pre-line">{suggestion.suggestedText}</p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => onApply(suggestion)}
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    <Check className="h-3 w-3" /> Aplicar
                  </button>
                  <button
                    onClick={() => onDismiss(suggestion.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                  >
                    <Trash2 className="h-3 w-3" /> Ignorar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  )
}

export default memo(AISuggestionsSidebarBase)
