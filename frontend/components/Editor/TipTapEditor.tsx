'use client'

import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { useCallback, useEffect } from 'react'
import CollaborativeToolbar from './CollaborativeToolbar'

interface EditorProps {
  initialContent: string
  onChange: (content: string) => void
  onAIRequest?: (payload: { text: string; section: string; range: { from: number; to: number } }) => void
  aiDisabled?: boolean
  onEditorReady?: (editor: Editor) => void
}

export default function TipTapEditor({ initialContent, onChange, onAIRequest, aiDisabled, onEditorReady }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: initialContent,
    immediatelyRender: false,
    onCreate: ({ editor }) => {
      editor.commands.setContent(initialContent)
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  const handleHeading = useCallback(
    (level: 1 | 2 | 3) => {
      editor?.commands.toggleHeading({ level })
    },
    [editor]
  )

  const handleBold = useCallback(() => {
    editor?.commands.toggleBold()
  }, [editor])

  const handleItalic = useCallback(() => {
    editor?.commands.toggleItalic()
  }, [editor])

  const handleBulletList = useCallback(() => {
    editor?.commands.toggleBulletList()
  }, [editor])

  const handleOrderedList = useCallback(() => {
    editor?.commands.toggleOrderedList()
  }, [editor])

  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor)
    }
  }, [editor, onEditorReady])

  if (!editor) {
    return <div className="animate-pulse h-96 bg-gray-200 rounded-lg"></div>
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      <CollaborativeToolbar
        editor={editor}
        onHeading={handleHeading}
        onBold={handleBold}
        onItalic={handleItalic}
        onBulletList={handleBulletList}
        onOrderedList={handleOrderedList}
        onAIRequest={() => {
          if (!editor || !onAIRequest) return
          const selection = editor.state.doc.textBetween(
            editor.state.selection.from,
            editor.state.selection.to
          )

          if (!selection.trim()) {
            onAIRequest({ text: '', section: 'Conteúdo atual', range: { from: editor.state.selection.from, to: editor.state.selection.to } })
            return
          }

          onAIRequest({
            text: selection,
            section: 'Trecho selecionado',
            range: { from: editor.state.selection.from, to: editor.state.selection.to },
          })
        }}
        aiDisabled={aiDisabled}
      />
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-6 focus:outline-none min-h-96"
      />
    </div>
  )
}
