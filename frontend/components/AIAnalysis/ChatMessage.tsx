'use client'

import { memo } from 'react'

export type ChatRole = 'user' | 'assistant'

export interface ChatMessageData {
  id: string
  role: ChatRole
  content: string
  timestamp: string
}

interface ChatMessageProps {
  message: ChatMessageData
}

function formatTime(timestamp: string) {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp))
  } catch {
    return timestamp
  }
}

function ChatMessageBase({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-gray-100 text-gray-900 rounded-bl-none'
        }`}
      >
        <p className="whitespace-pre-line">{message.content}</p>
        <span
          className={`mt-1 block text-[11px] ${
            isUser ? 'text-blue-100' : 'text-gray-500'
          }`}
        >
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  )
}

export default memo(ChatMessageBase)
