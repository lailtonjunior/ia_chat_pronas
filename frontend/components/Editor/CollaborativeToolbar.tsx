'use client'

import { Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  Zap,
} from 'lucide-react'

interface ToolbarProps {
  editor: Editor | null
  onHeading: (level: 1 | 2 | 3) => void
  onBold: () => void
  onItalic: () => void
  onBulletList: () => void
  onOrderedList: () => void
  onAIRequest?: () => void
  aiDisabled?: boolean
}

export default function CollaborativeToolbar({
  editor,
  onHeading,
  onBold,
  onItalic,
  onBulletList,
  onOrderedList,
  onAIRequest,
  aiDisabled,
}: ToolbarProps) {
  if (!editor) return null

  const ButtonBase = ({
    onClick,
    isActive,
    icon: Icon,
    label,
  }: {
    onClick: () => void
    isActive: boolean
    icon: any
    label: string
  }) => (
    <button
      onClick={onClick}
      title={label}
      className={`p-2 rounded transition-colors ${
        isActive
          ? 'bg-blue-100 text-blue-600'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon className="w-4 h-4" />
    </button>
  )

  return (
    <div className="bg-gray-50 border-b p-3 flex items-center gap-1 flex-wrap">
      {/* Undo/Redo */}
      <div className="flex items-center gap-1 border-r pr-2 mr-2">
        <ButtonBase
          onClick={() => editor.commands.undo()}
          isActive={false}
          icon={Undo2}
          label="Desfazer"
        />
        <ButtonBase
          onClick={() => editor.commands.redo()}
          isActive={false}
          icon={Redo2}
          label="Refazer"
        />
      </div>

      {/* Text Formatting */}
      <div className="flex items-center gap-1 border-r pr-2 mr-2">
        <ButtonBase
          onClick={onBold}
          isActive={editor.isActive('bold')}
          icon={Bold}
          label="Negrito"
        />
        <ButtonBase
          onClick={onItalic}
          isActive={editor.isActive('italic')}
          icon={Italic}
          label="Itálico"
        />
      </div>

      {/* Headings */}
      <div className="flex items-center gap-1 border-r pr-2 mr-2">
        <ButtonBase
          onClick={() => onHeading(1)}
          isActive={editor.isActive('heading', { level: 1 })}
          icon={Heading1}
          label="Título 1"
        />
        <ButtonBase
          onClick={() => onHeading(2)}
          isActive={editor.isActive('heading', { level: 2 })}
          icon={Heading2}
          label="Título 2"
        />
      </div>

      {/* Lists */}
      <div className="flex items-center gap-1 border-r pr-2 mr-2">
        <ButtonBase
          onClick={onBulletList}
          isActive={editor.isActive('bulletList')}
          icon={List}
          label="Lista com Marcadores"
        />
        <ButtonBase
          onClick={onOrderedList}
          isActive={editor.isActive('orderedList')}
          icon={ListOrdered}
          label="Lista Numerada"
        />
      </div>

      {/* AI Tools */}
      <div className="flex items-center gap-1 border-l pl-2 ml-2">
        <button
          title="Sugestões de IA"
          className="p-2 rounded text-yellow-600 hover:bg-yellow-100 transition-colors flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={onAIRequest}
          disabled={aiDisabled}
        >
          <Zap className="w-4 h-4" />
          <span className="text-xs">IA</span>
        </button>
      </div>
    </div>
  )
}
