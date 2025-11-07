/**
 * Cliente WebSocket nativo para comunicação em tempo real - CORRIGIDO
 */

let socket: WebSocket | null = null
let reconnectInterval: NodeJS.Timeout | null = null
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 5

interface WebSocketMessage {
  type: string
  [key: string]: any
}

export function initializeWebSocket(
  projectId: string,
  userId: string,
  token: string
): WebSocket {
  const rawBase =
    process.env.NEXT_PUBLIC_WS_URL ??
    process.env.NEXT_PUBLIC_API_URL?.replace(/^http/, 'ws')

  if (!rawBase) {
    throw new Error('WebSocket base URL não configurada. Defina NEXT_PUBLIC_WS_URL ou NEXT_PUBLIC_API_URL.')
  }

  const normalizedBase = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase
  const wsUrl = `${normalizedBase}/ws/${projectId}/${userId}?token=${token}`

  socket = new WebSocket(wsUrl)

  socket.onopen = () => {
    console.log('✅ WebSocket conectado')
    reconnectAttempts = 0
    
    if (reconnectInterval) {
      clearInterval(reconnectInterval)
      reconnectInterval = null
    }
  }

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      handleMessage(data)
    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error)
    }
  }

  socket.onclose = () => {
    console.log('❌ WebSocket desconectado')
    socket = null

    // Tentar reconectar
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++
      console.log(`🔄 Tentando reconectar (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`)
      
      setTimeout(() => {
        initializeWebSocket(projectId, userId, token)
      }, 2000 * reconnectAttempts)
    }
  }

  socket.onerror = (error) => {
    console.error('❌ Erro WebSocket:', error)
  }

  return socket
}

export function getWebSocket(): WebSocket | null {
  return socket
}

export function disconnectWebSocket() {
  if (socket) {
    socket.close()
    socket = null
  }

  if (reconnectInterval) {
    clearInterval(reconnectInterval)
    reconnectInterval = null
  }
}

export function sendMessage(message: WebSocketMessage) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message))
  } else {
    console.error('❌ WebSocket não está conectado')
  }
}

// Handlers para diferentes tipos de mensagens
const messageHandlers: Record<string, (data: any) => void> = {}

function handleMessage(data: WebSocketMessage) {
  const handler = messageHandlers[data.type]
  if (handler) {
    handler(data)
  }
}

export function onMessage(type: string, handler: (data: any) => void) {
  messageHandlers[type] = handler
}

export function offMessage(type: string) {
  delete messageHandlers[type]
}

// Helpers específicos
export function sendEdit(changes: any) {
  sendMessage({
    type: 'edit',
    changes,
    timestamp: new Date().toISOString(),
  })
}

export function sendCursorPosition(position: number) {
  sendMessage({
    type: 'cursor',
    position,
    timestamp: new Date().toISOString(),
  })
}

export function sendChatMessage(message: string) {
  sendMessage({
    type: 'chat',
    message,
    timestamp: new Date().toISOString(),
  })
}

export function requestAIAnalysis(content: string) {
  sendMessage({
    type: 'ai_request',
    content,
    timestamp: new Date().toISOString(),
  })
}
