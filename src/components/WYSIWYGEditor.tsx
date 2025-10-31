import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import TurndownService from 'turndown';
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Minus,
} from 'lucide-react';

interface WYSIWYGEditorProps {
  content: string;
  onChange?: (markdown: string) => void;
  readOnly?: boolean;
}

// Convert markdown to HTML for TipTap
const markdownToHTML = (markdown: string): string => {
  if (!markdown || markdown.trim() === '') return '';
  return marked(markdown, { breaks: true }) as string;
};

// Convert HTML from TipTap to markdown
const htmlToMarkdown = (html: string): string => {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
  });
  return turndownService.turndown(html);
};

export default function WYSIWYGEditor({ content, onChange, readOnly = false }: WYSIWYGEditorProps) {
  const lastInternalContentRef = useRef<string>(content);
  const isEditable = !readOnly && onChange !== undefined;
  const [, setUpdateTrigger] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit,
      ...(isEditable
        ? [
            Placeholder.configure({
              placeholder: 'Start writing your note...',
            }),
          ]
        : []),
    ],
    content: markdownToHTML(content),
    editable: isEditable,
    editorProps: {
      attributes: {
        class: 'w-full min-h-[500px] bg-transparent text-gray-300 focus:outline-none resize-none font-mono text-sm leading-relaxed',
        style: 'line-height: 1.8;',
        'data-placeholder': 'Start writing your note...',
      },
    },
    onUpdate: ({ editor }) => {
      if (!isEditable || !onChange) return;
      const html = editor.getHTML();
      const markdown = htmlToMarkdown(html);
      lastInternalContentRef.current = markdown;
      onChange(markdown);
      setUpdateTrigger((prev) => prev + 1);
    },
    onSelectionUpdate: () => {
      setUpdateTrigger((prev) => prev + 1);
    },
  });

  // Update editable state when readOnly changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditable);
    }
  }, [editor, isEditable]);

  // Update editor content when markdown content changes from outside (e.g., switching modes)
  useEffect(() => {
    if (editor && content !== undefined) {
      // Only update if the content changed externally (not from our internal onUpdate)
      if (lastInternalContentRef.current !== content) {
        editor.commands.setContent(markdownToHTML(content));
        lastInternalContentRef.current = content;
      }
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="prose prose-invert prose-gray max-w-none min-h-[500px] text-gray-300 px-4 py-2">
        <p>Loading editor...</p>
      </div>
    );
  }

  if (!isEditable) {
    return (
      <div className="w-full">
        <EditorContent editor={editor} />
        <style>{`
          .ProseMirror {
            outline: none;
          }
          .ProseMirror h1 {
            font-size: 2.25rem;
            font-weight: 700;
            color: rgb(229, 231, 235);
            margin-bottom: 1rem;
            margin-top: 0.5rem;
          }
          .ProseMirror h2 {
            font-size: 1.875rem;
            font-weight: 700;
            color: rgb(229, 231, 235);
            margin-bottom: 0.75rem;
            margin-top: 0.5rem;
          }
          .ProseMirror h3 {
            font-size: 1.5rem;
            font-weight: 600;
            color: rgb(209, 213, 219);
            margin-bottom: 0.75rem;
            margin-top: 0.5rem;
          }
          .ProseMirror h4 {
            font-size: 1.25rem;
            font-weight: 600;
            color: rgb(209, 213, 219);
            margin-bottom: 0.5rem;
            margin-top: 0.5rem;
          }
          .ProseMirror h5 {
            font-size: 1.125rem;
            font-weight: 600;
            color: rgb(209, 213, 219);
            margin-bottom: 0.5rem;
            margin-top: 0.5rem;
          }
          .ProseMirror h6 {
            font-size: 1rem;
            font-weight: 600;
            color: rgb(209, 213, 219);
            margin-bottom: 0.5rem;
            margin-top: 0.5rem;
          }
          .ProseMirror p {
            color: rgb(209, 213, 219);
            margin-bottom: 1rem;
            line-height: 1.625;
          }
          .ProseMirror a {
            color: rgb(96, 165, 250);
            text-decoration: underline;
          }
          .ProseMirror a:hover {
            color: rgb(147, 197, 253);
          }
          .ProseMirror ul, .ProseMirror ol {
            color: rgb(209, 213, 219);
            margin-bottom: 1rem;
            padding-left: 1.5rem;
          }
          .ProseMirror ul {
            list-style-type: disc;
          }
          .ProseMirror ol {
            list-style-type: decimal;
          }
          .ProseMirror li {
            color: rgb(209, 213, 219);
            margin-bottom: 0.5rem;
          }
          .ProseMirror blockquote {
            border-left: 4px solid rgb(75, 85, 99);
            padding-left: 1rem;
            font-style: italic;
            color: rgb(156, 163, 175);
            margin: 1rem 0;
          }
          .ProseMirror code {
            background-color: rgb(58, 68, 80);
            color: rgb(209, 213, 219);
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.875rem;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          }
          .ProseMirror pre {
            background-color: rgb(58, 68, 80);
            color: rgb(209, 213, 219);
            padding: 1rem;
            border-radius: 0.5rem;
            overflow-x: auto;
            margin: 1rem 0;
          }
          .ProseMirror pre code {
            background-color: transparent;
            padding: 0;
          }
          .ProseMirror table {
            min-width: 100%;
            border-collapse: collapse;
            border: 1px solid rgb(75, 85, 99);
            margin: 1rem 0;
          }
          .ProseMirror thead {
            background-color: rgb(58, 68, 80);
          }
          .ProseMirror tr {
            border-bottom: 1px solid rgb(75, 85, 99);
          }
          .ProseMirror th, .ProseMirror td {
            border: 1px solid rgb(75, 85, 99);
            padding: 0.5rem 1rem;
            color: rgb(209, 213, 219);
          }
          .ProseMirror th {
            text-align: left;
            color: rgb(209, 213, 219);
          }
          .ProseMirror hr {
            border-color: rgb(75, 85, 99);
            margin: 2rem 0;
          }
          .ProseMirror strong {
            font-weight: 700;
            color: rgb(229, 231, 235);
          }
          .ProseMirror em {
            font-style: italic;
          }
          .ProseMirror del {
            text-decoration: line-through;
            color: rgb(156, 163, 175);
          }
          .ProseMirror img {
            max-width: 100%;
            height: auto;
            border-radius: 0.5rem;
            margin: 1rem 0;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1 mb-6 pb-6 border-b border-gray-700 flex-wrap">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive('bold')
              ? 'bg-[#3a4450] text-white'
              : 'text-gray-400 hover:text-white hover:bg-[#3a4450]'
          }`}
        >
          <Bold className="w-5 h-5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive('italic')
              ? 'bg-[#3a4450] text-white'
              : 'text-gray-400 hover:text-white hover:bg-[#3a4450]'
          }`}
        >
          <Italic className="w-5 h-5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive('strike')
              ? 'bg-[#3a4450] text-white'
              : 'text-gray-400 hover:text-white hover:bg-[#3a4450]'
          }`}
        >
          <Strikethrough className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-gray-700 mx-2" />
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive('heading', { level: 1 })
              ? 'bg-[#3a4450] text-white'
              : 'text-gray-400 hover:text-white hover:bg-[#3a4450]'
          }`}
        >
          <Heading1 className="w-5 h-5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-[#3a4450] text-white'
              : 'text-gray-400 hover:text-white hover:bg-[#3a4450]'
          }`}
        >
          <Heading2 className="w-5 h-5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-[#3a4450] text-white'
              : 'text-gray-400 hover:text-white hover:bg-[#3a4450]'
          }`}
        >
          <Heading3 className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-gray-700 mx-2" />
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive('bulletList')
              ? 'bg-[#3a4450] text-white'
              : 'text-gray-400 hover:text-white hover:bg-[#3a4450]'
          }`}
        >
          <List className="w-5 h-5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive('orderedList')
              ? 'bg-[#3a4450] text-white'
              : 'text-gray-400 hover:text-white hover:bg-[#3a4450]'
          }`}
        >
          <ListOrdered className="w-5 h-5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive('blockquote')
              ? 'bg-[#3a4450] text-white'
              : 'text-gray-400 hover:text-white hover:bg-[#3a4450]'
          }`}
        >
          <Quote className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-gray-700 mx-2" />
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!editor.can().chain().focus().toggleCode().run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive('code')
              ? 'bg-[#3a4450] text-white'
              : 'text-gray-400 hover:text-white hover:bg-[#3a4450]'
          }`}
        >
          <Code className="w-5 h-5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive('codeBlock')
              ? 'bg-[#3a4450] text-white'
              : 'text-gray-400 hover:text-white hover:bg-[#3a4450]'
          }`}
        >
          <Code2 className="w-5 h-5" />
        </button>
        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-2 text-gray-400 hover:text-white hover:bg-[#3a4450] rounded transition-colors"
        >
          <Minus className="w-5 h-5" />
        </button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
      <style>{`
        .ProseMirror {
          outline: none;
        }
        ${isEditable ? `
          /* Edit mode - make it look like markdown editor */
          .ProseMirror {
            color: rgb(209, 213, 219);
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
            font-size: 0.875rem;
            line-height: 1.8;
          }
          .ProseMirror p.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            color: rgb(107, 114, 128);
            pointer-events: none;
            float: left;
            height: 0;
          }
          .ProseMirror p[data-placeholder]:empty::before {
            content: attr(data-placeholder);
            color: rgb(107, 114, 128);
            pointer-events: none;
            float: left;
            height: 0;
          }
          .ProseMirror h1,
          .ProseMirror h2,
          .ProseMirror h3,
          .ProseMirror h4,
          .ProseMirror h5,
          .ProseMirror h6 {
            color: rgb(209, 213, 219);
            font-size: inherit;
            font-weight: normal;
            margin: 0;
            line-height: 1.8;
          }
          .ProseMirror p {
            color: rgb(209, 213, 219);
            margin: 0;
            line-height: 1.8;
          }
          .ProseMirror a {
            color: rgb(209, 213, 219);
            text-decoration: underline;
          }
          .ProseMirror ul, .ProseMirror ol {
            color: rgb(209, 213, 219);
            margin: 0;
            padding-left: 1.5rem;
            line-height: 1.8;
          }
          .ProseMirror li {
            color: rgb(209, 213, 219);
            margin: 0;
            line-height: 1.8;
          }
          .ProseMirror blockquote {
            color: rgb(209, 213, 219);
            border-left: none;
            padding-left: 0;
            font-style: normal;
            margin: 0;
            line-height: 1.8;
          }
          .ProseMirror code {
            background-color: transparent;
            color: rgb(209, 213, 219);
            padding: 0;
            border-radius: 0;
            font-size: inherit;
            font-family: inherit;
          }
          .ProseMirror pre {
            background-color: transparent;
            color: rgb(209, 213, 219);
            padding: 0;
            border-radius: 0;
            margin: 0;
            line-height: 1.8;
          }
          .ProseMirror pre code {
            background-color: transparent;
            padding: 0;
            font-size: inherit;
            font-family: inherit;
          }
          .ProseMirror table {
            color: rgb(209, 213, 219);
            border: none;
            margin: 0;
          }
          .ProseMirror thead {
            background-color: transparent;
          }
          .ProseMirror tr {
            border-bottom: none;
          }
          .ProseMirror th, .ProseMirror td {
            border: none;
            padding: 0;
            color: rgb(209, 213, 219);
          }
          .ProseMirror hr {
            border-color: transparent;
            margin: 0;
          }
          .ProseMirror strong {
            font-weight: normal;
            color: rgb(209, 213, 219);
          }
          .ProseMirror em {
            font-style: normal;
          }
          .ProseMirror del {
            text-decoration: none;
            color: rgb(209, 213, 219);
          }
          .ProseMirror img {
            color: rgb(209, 213, 219);
          }
        ` : `
          /* Preview mode - show formatted styles */
          .ProseMirror h1 {
            font-size: 2.25rem;
            font-weight: 700;
            color: rgb(229, 231, 235);
            margin-bottom: 1rem;
            margin-top: 0.5rem;
          }
          .ProseMirror h2 {
            font-size: 1.875rem;
            font-weight: 700;
            color: rgb(229, 231, 235);
            margin-bottom: 0.75rem;
            margin-top: 0.5rem;
          }
          .ProseMirror h3 {
            font-size: 1.5rem;
            font-weight: 600;
            color: rgb(209, 213, 219);
            margin-bottom: 0.75rem;
            margin-top: 0.5rem;
          }
          .ProseMirror h4 {
            font-size: 1.25rem;
            font-weight: 600;
            color: rgb(209, 213, 219);
            margin-bottom: 0.5rem;
            margin-top: 0.5rem;
          }
          .ProseMirror h5 {
            font-size: 1.125rem;
            font-weight: 600;
            color: rgb(209, 213, 219);
            margin-bottom: 0.5rem;
            margin-top: 0.5rem;
          }
          .ProseMirror h6 {
            font-size: 1rem;
            font-weight: 600;
            color: rgb(209, 213, 219);
            margin-bottom: 0.5rem;
            margin-top: 0.5rem;
          }
          .ProseMirror p {
            color: rgb(209, 213, 219);
            margin-bottom: 1rem;
            line-height: 1.625;
          }
          .ProseMirror a {
            color: rgb(96, 165, 250);
            text-decoration: underline;
          }
          .ProseMirror a:hover {
            color: rgb(147, 197, 253);
          }
          .ProseMirror ul, .ProseMirror ol {
            color: rgb(209, 213, 219);
            margin-bottom: 1rem;
            padding-left: 1.5rem;
          }
          .ProseMirror ul {
            list-style-type: disc;
          }
          .ProseMirror ol {
            list-style-type: decimal;
          }
          .ProseMirror li {
            color: rgb(209, 213, 219);
            margin-bottom: 0.5rem;
          }
          .ProseMirror blockquote {
            border-left: 4px solid rgb(75, 85, 99);
            padding-left: 1rem;
            font-style: italic;
            color: rgb(156, 163, 175);
            margin: 1rem 0;
          }
          .ProseMirror code {
            background-color: rgb(58, 68, 80);
            color: rgb(209, 213, 219);
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.875rem;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          }
          .ProseMirror pre {
            background-color: rgb(58, 68, 80);
            color: rgb(209, 213, 219);
            padding: 1rem;
            border-radius: 0.5rem;
            overflow-x: auto;
            margin: 1rem 0;
          }
          .ProseMirror pre code {
            background-color: transparent;
            padding: 0;
          }
          .ProseMirror table {
            min-width: 100%;
            border-collapse: collapse;
            border: 1px solid rgb(75, 85, 99);
            margin: 1rem 0;
          }
          .ProseMirror thead {
            background-color: rgb(58, 68, 80);
          }
          .ProseMirror tr {
            border-bottom: 1px solid rgb(75, 85, 99);
          }
          .ProseMirror th, .ProseMirror td {
            border: 1px solid rgb(75, 85, 99);
            padding: 0.5rem 1rem;
            color: rgb(209, 213, 219);
          }
          .ProseMirror th {
            text-align: left;
            color: rgb(209, 213, 219);
          }
          .ProseMirror hr {
            border-color: rgb(75, 85, 99);
            margin: 2rem 0;
          }
          .ProseMirror strong {
            font-weight: 700;
            color: rgb(229, 231, 235);
          }
          .ProseMirror em {
            font-style: italic;
          }
          .ProseMirror del {
            text-decoration: line-through;
            color: rgb(156, 163, 175);
          }
          .ProseMirror img {
            max-width: 100%;
            height: auto;
            border-radius: 0.5rem;
            margin: 1rem 0;
          }
        `}
      `}</style>
    </div>
  );
}
