'use client'

import { Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo2,
  Redo2,
} from 'lucide-react'

interface EditorMenuProps {
  editor: Editor | null
}

export default function EditorMenu({ editor }: EditorMenuProps) {
  if (!editor) return null

  const MenuItem = ({
    onClick,
    isActive,
    icon: Icon,
    title,
  }: {
    onClick: () => void
    isActive: boolean
    icon: any
    title: string
  }) => (
    <button
      onClick={onClick}
      title={title}
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
    <div className="bg-gray-50 border-b border-gray-200 p-3 flex flex-wrap items-center gap-1">
      {/* History */}
      <div className="flex items-center gap-1 border-r pr-2 mr-2">
        <MenuItem
          onClick={() => editor.commands.undo()}
          isActive={false}
          icon={Undo2}
          title="Desfazer (Ctrl+Z)"
        />
        <MenuItem
          onClick={() => editor.commands.redo()}
          isActive={false}
          icon={Redo2}
          title="Refazer (Ctrl+Shift+Z)"
        />
      </div>

      {/* Text Style */}
      <div className="flex items-center gap-1 border-r pr-2 mr-2">
        <MenuItem
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          icon={Bold}
          title="Negrito (Ctrl+B)"
        />
        <MenuItem
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          icon={Italic}
          title="Itálico (Ctrl+I)"
        />
        <MenuItem
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          icon={Underline}
          title="Sublinhado (Ctrl+U)"
        />
        <MenuItem
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          icon={Strikethrough}
          title="Tachado"
        />
        <MenuItem
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          icon={Code}
          title="Código"
        />
      </div>

      {/* Headings */}
      <div className="flex items-center gap-1 border-r pr-2 mr-2">
        <MenuItem
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          icon={Heading1}
          title="Título 1"
        />
        <MenuItem
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          icon={Heading2}
          title="Título 2"
        />
        <MenuItem
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          icon={Heading3}
          title="Título 3"
        />
      </div>

      {/* Lists */}
      <div className="flex items-center gap-1 border-r pr-2 mr-2">
        <MenuItem
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          icon={List}
          title="Lista com Marcadores"
        />
        <MenuItem
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          icon={ListOrdered}
          title="Lista Numerada"
        />
        <MenuItem
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          icon={Quote}
          title="Citação"
        />
      </div>

      {/* Alignment */}
      <div className="flex items-center gap-1 border-r pr-2 mr-2">
        <MenuItem
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          icon={AlignLeft}
          title="Alinhar à Esquerda"
        />
        <MenuItem
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          icon={AlignCenter}
          title="Centralizar"
        />
        <MenuItem
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          icon={AlignRight}
          title="Alinhar à Direita"
        />
      </div>
    </div>
  )
}
