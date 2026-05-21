'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { useCallback, useState, useEffect } from 'react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link2,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Undo,
  Redo,
  Type,
  Sparkles,
} from 'lucide-react'

const lowlight = createLowlight(common)

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

// Toolbar Button Component
function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children,
  variant = 'default',
}: {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
  variant?: 'default' | 'heading' | 'list' | 'insert' | 'align'
}) {
  const variantColors = {
    default: 'hover:bg-primary/20',
    heading: 'hover:bg-orange/20',
    list: 'hover:bg-accent/20',
    insert: 'hover:bg-cyan-500/20',
    align: 'hover:bg-violet-500/20',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded transition-all duration-200 group ${
        isActive
          ? 'text-primary bg-primary/20'
          : `text-muted-foreground hover:text-foreground ${variantColors[variant]}`
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      <span className="group-hover:scale-110 transition-transform block">{children}</span>
    </button>
  )
}

// Divider
function ToolbarDivider() {
  return <div className="w-px h-6 bg-border/50 mx-1" />
}

// Toolbar Group
function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center bg-background/50 rounded p-0.5 mr-1">
      {children}
    </div>
  )
}

export function RichTextEditor({ content, onChange, placeholder = 'Start writing...' }: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState('')
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [, setForceUpdate] = useState(0)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded max-w-full',
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: false,
      }),
      Typography,
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm prose-invert max-w-none focus:outline-none min-h-[400px] px-5 py-4',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    onSelectionUpdate: () => {
      // Force re-render to update toolbar button states
      setForceUpdate(n => n + 1)
    },
    onTransaction: () => {
      // Force re-render on any transaction (including mark toggles)
      setForceUpdate(n => n + 1)
    },
  })

  const setLink = useCallback(() => {
    if (!editor) return

    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
    setLinkUrl('')
    setShowLinkInput(false)
  }, [editor, linkUrl])

  const addImage = useCallback(() => {
    if (!editor) return
    const url = window.prompt('Enter image URL')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  if (!editor) {
    return (
      <div className="border border-border rounded-[2px] overflow-hidden bg-card">
        <div className="h-12 bg-secondary/50 animate-pulse" />
        <div className="h-[400px] bg-background animate-pulse" />
      </div>
    )
  }

  const wordCount = editor.storage.characterCount?.words?.() || 
    editor.getText().split(/\s+/).filter(Boolean).length
  const charCount = editor.storage.characterCount?.characters?.() || 
    editor.getText().length

  return (
    <div className="border border-border rounded-[2px] overflow-hidden bg-card shadow-lg">
      {/* Professional Toolbar */}
      <div className="bg-gradient-to-r from-secondary via-secondary/80 to-secondary/60 border-b border-border">
        <div className="flex items-center px-2 py-1.5 gap-0.5 flex-wrap">
          {/* Undo/Redo */}
          <ToolbarGroup>
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </ToolbarButton>
          </ToolbarGroup>

          <ToolbarDivider />

          {/* Text Formatting */}
          <ToolbarGroup>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive('underline')}
              title="Underline (Ctrl+U)"
            >
              <UnderlineIcon className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive('strike')}
              title="Strikethrough"
            >
              <Strikethrough className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              isActive={editor.isActive('highlight')}
              title="Highlight"
            >
              <Highlighter className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              isActive={editor.isActive('code')}
              title="Inline Code"
            >
              <Code className="w-4 h-4" />
            </ToolbarButton>
          </ToolbarGroup>

          <ToolbarDivider />

          {/* Headings */}
          <ToolbarGroup>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              isActive={editor.isActive('heading', { level: 1 })}
              title="Heading 1"
              variant="heading"
            >
              <Heading1 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive('heading', { level: 2 })}
              title="Heading 2"
              variant="heading"
            >
              <Heading2 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              isActive={editor.isActive('heading', { level: 3 })}
              title="Heading 3"
              variant="heading"
            >
              <Heading3 className="w-4 h-4" />
            </ToolbarButton>
          </ToolbarGroup>

          <ToolbarDivider />

          {/* Lists */}
          <ToolbarGroup>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive('bulletList')}
              title="Bullet List"
              variant="list"
            >
              <List className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive('orderedList')}
              title="Numbered List"
              variant="list"
            >
              <ListOrdered className="w-4 h-4" />
            </ToolbarButton>
          </ToolbarGroup>

          <ToolbarDivider />

          {/* Alignment */}
          <ToolbarGroup>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              isActive={editor.isActive({ textAlign: 'left' })}
              title="Align Left"
              variant="align"
            >
              <AlignLeft className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              isActive={editor.isActive({ textAlign: 'center' })}
              title="Align Center"
              variant="align"
            >
              <AlignCenter className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              isActive={editor.isActive({ textAlign: 'right' })}
              title="Align Right"
              variant="align"
            >
              <AlignRight className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
              isActive={editor.isActive({ textAlign: 'justify' })}
              title="Justify"
              variant="align"
            >
              <AlignJustify className="w-4 h-4" />
            </ToolbarButton>
          </ToolbarGroup>

          <ToolbarDivider />

          {/* Insert */}
          <ToolbarGroup>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive('blockquote')}
              title="Block Quote"
              variant="insert"
            >
              <Quote className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              isActive={editor.isActive('codeBlock')}
              title="Code Block"
              variant="insert"
            >
              <span className="mono-xs text-[10px] font-bold">{'</>'}</span>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Horizontal Rule"
              variant="insert"
            >
              <Minus className="w-4 h-4" />
            </ToolbarButton>
            <div className="relative">
              <ToolbarButton
                onClick={() => setShowLinkInput(!showLinkInput)}
                isActive={editor.isActive('link')}
                title="Insert Link"
                variant="insert"
              >
                <Link2 className="w-4 h-4" />
              </ToolbarButton>
              {showLinkInput && (
                <div className="absolute top-full left-0 mt-1 p-2 bg-popover border border-border rounded shadow-lg z-50 flex gap-2">
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://"
                    className="px-2 py-1 text-xs bg-background border border-border rounded w-48 outline-none focus:border-primary"
                    onKeyDown={(e) => e.key === 'Enter' && setLink()}
                  />
                  <button
                    onClick={setLink}
                    className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded hover:bg-primary/90"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
            <ToolbarButton
              onClick={addImage}
              title="Insert Image"
              variant="insert"
            >
              <ImageIcon className="w-4 h-4" />
            </ToolbarButton>
          </ToolbarGroup>

          {/* Right side - Word count */}
          <div className="ml-auto flex items-center gap-3 text-muted-foreground/60">
            <span className="mono-xs text-[9px] hidden md:block">
              {wordCount} words
            </span>
            <span className="mono-xs text-[9px] hidden lg:block">
              {charCount} chars
            </span>
          </div>
        </div>
      </div>

      {/* Floating Bubble Menu for quick formatting */}
      {editor && (
        <BubbleMenu 
          editor={editor} 
          options={{ placement: 'top', offset: 6 }}
          className="flex items-center gap-0.5 p-1 bg-popover border border-border rounded shadow-xl"
        >
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('bold') ? 'bg-primary/20 text-primary' : 'hover:bg-secondary'
            }`}
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('italic') ? 'bg-primary/20 text-primary' : 'hover:bg-secondary'
            }`}
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('underline') ? 'bg-primary/20 text-primary' : 'hover:bg-secondary'
            }`}
          >
            <UnderlineIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('highlight') ? 'bg-primary/20 text-primary' : 'hover:bg-secondary'
            }`}
          >
            <Highlighter className="w-3.5 h-3.5" />
          </button>
        </BubbleMenu>
      )}

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-secondary/30 border-t border-border text-muted-foreground/60">
        <div className="flex items-center gap-4">
          <span className="mono-xs text-[9px] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Ready
          </span>
          <span className="mono-xs text-[9px] flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            Tiptap Editor
          </span>
        </div>
        <div className="mono-xs text-[9px]">
          Press / for commands
        </div>
      </div>

      {/* Custom Styles for Editor */}
      <style jsx global>{`
        .ProseMirror {
          min-height: 400px;
          padding: 1.25rem;
        }
        .ProseMirror:focus {
          outline: none;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          color: hsl(var(--muted-foreground) / 0.4);
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .ProseMirror h1 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          color: hsl(var(--foreground));
        }
        .ProseMirror h2 {
          font-size: 1.375rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: hsl(var(--foreground));
        }
        .ProseMirror h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: hsl(var(--foreground));
        }
        .ProseMirror p {
          margin-bottom: 0.75rem;
          line-height: 1.7;
          color: hsl(var(--foreground) / 0.9);
        }
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .ProseMirror li {
          margin-bottom: 0.25rem;
        }
        .ProseMirror blockquote {
          border-left: 3px solid hsl(var(--primary));
          padding-left: 1rem;
          margin-left: 0;
          margin-bottom: 0.75rem;
          color: hsl(var(--muted-foreground));
          font-style: italic;
        }
        .ProseMirror code {
          background-color: hsl(var(--secondary));
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.875em;
        }
        .ProseMirror pre {
          background-color: hsl(var(--secondary));
          padding: 1rem;
          border-radius: 0.25rem;
          margin-bottom: 0.75rem;
          overflow-x: auto;
        }
        .ProseMirror pre code {
          background: none;
          padding: 0;
          font-size: 0.875rem;
        }
        .ProseMirror mark {
          background-color: hsl(var(--primary) / 0.3);
          padding: 0.125rem 0;
        }
        .ProseMirror hr {
          border: none;
          border-top: 1px solid hsl(var(--border));
          margin: 1.5rem 0;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.25rem;
          margin: 0.75rem 0;
        }
        .ProseMirror a {
          color: hsl(var(--primary));
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}
