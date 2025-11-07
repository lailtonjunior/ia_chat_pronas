'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Loader2, MessageCircle, Send } from 'lucide-react'
import { toast } from 'sonner'
import { initializeApiClient } from '@/lib/api'
import ChatMessage, {
  ChatMessageData,
} from '@/components/AIAnalysis/ChatMessage'

interface ChatInterfaceProps {
  projectId: string
}

export default function ChatInterface({ projectId }: ChatInterfaceProps) {
  const { data: session, status } = useSession()
  const [messages, setMessages] = useState<ChatMessageData[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isAssistantTyping, setIsAssistantTyping] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollToLatestMessage()
  }, [messages, isAssistantTyping])

  useEffect(() => {
    // reset conversation when project changes
    setMessages([])
    setErrorMessage(null)
    setIsAssistantTyping(false)
    setInput('')
  }, [projectId])

  const scrollToLatestMessage = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const updateMessagesArray = (message: ChatMessageData) => {
    setMessages((prev) => [...prev, message])
  }

  const showTypingIndicator = () => setIsAssistantTyping(true)
  const hideTypingIndicator = () => setIsAssistantTyping(false)

  const handleChatError = (error: unknown) => {
    console.error('Erro no chat IA:', error)
    const detail =
      (error as any)?.response?.data?.detail ??
      (error as Error)?.message ??
      'Não foi possível enviar a mensagem.'
    setErrorMessage(detail)
    toast.error(detail)
  }

  const receiveAIResponse = (payload: any) => {
    const assistantMessage: ChatMessageData = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-assistant`,
      role: 'assistant',
      content: payload?.message || 'A IA não retornou uma resposta.',
      timestamp: new Date().toISOString(),
    }
    updateMessagesArray(assistantMessage)
    hideTypingIndicator()
  }

  const buildHistoryPayload = (history: ChatMessageData[]) =>
    history.map(({ role, content, timestamp }) => ({ role, content, timestamp }))

  const sendMessageToAI = async () => {
    if (!projectId) {
      toast.error('Projeto não identificado.')
      return
    }

    const trimmed = input.trim()
    if (!trimmed) return

    if (!session?.accessToken) {
      toast.error('Faça login para conversar com a IA.')
      return
    }

    setErrorMessage(null)

    const userMessage: ChatMessageData = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-user`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    }

    const conversationSnapshot = [...messages, userMessage]
    updateMessagesArray(userMessage)
    setInput('')
    showTypingIndicator()
    setIsSending(true)

    try {
      const apiClient = initializeApiClient(session.accessToken)
      const { data } = await apiClient.post('/api/ai/chat', {
        project_id: projectId,
        message: trimmed,
        conversation_history: buildHistoryPayload(conversationSnapshot),
      })

      receiveAIResponse(data)
    } catch (error) {
      handleChatError(error)
      hideTypingIndicator()
    } finally {
      setIsSending(false)
    }
  }

  const renderUserMessage = (message: ChatMessageData) => (
    <ChatMessage key={message.id} message={message} />
  )

  const renderAIMessage = (message: ChatMessageData) => (
    <ChatMessage key={message.id} message={message} />
  )

  const showEmptyState = useMemo(() => messages.length === 0, [messages.length])

  if (status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Carregando chat...
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center text-gray-600">
        Faça login para conversar com a IA sobre o projeto.
      </div>
    )
  }

  return (
    <div className="flex h-[34rem] flex-col rounded-2xl border border-gray-200 bg-white">
      <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-4">
        <div className="rounded-full bg-blue-100 p-2 text-blue-600">
          <MessageCircle className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Chat com IA</p>
          <p className="text-xs text-gray-500">
            Pergunte sobre este projeto, receba orientações e insights.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-5 space-y-4">
        {showEmptyState && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-6 text-center text-sm text-gray-500">
            Inicie a conversa descrevendo dúvidas ou pedindo recomendações para o
            projeto.
          </div>
        )}

        {messages.map((message) =>
          message.role === 'user'
            ? renderUserMessage(message)
            : renderAIMessage(message)
        )}

        {isAssistantTyping && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            IA digitando...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {errorMessage && (
        <div className="mx-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="border-t border-gray-100 px-4 py-3">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                sendMessageToAI()
              }
            }}
            placeholder="Digite sua pergunta..."
            className="flex-1 resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200"
            rows={2}
            disabled={isSending}
          />
          <button
            onClick={sendMessageToAI}
            disabled={isSending || !input.trim()}
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            aria-label="Enviar"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
