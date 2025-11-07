'use client'

interface LoadingStateProps {
  message?: string
  fullHeight?: boolean
}

export default function LoadingState({
  message = 'Carregando...',
  fullHeight = false,
}: LoadingStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center ${
        fullHeight ? 'min-h-screen' : 'py-12'
      }`}
    >
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-600">{message}</p>
    </div>
  )
}
