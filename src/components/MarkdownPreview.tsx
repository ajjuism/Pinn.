import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownPreviewProps {
  content: string;
}

export default function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <div className="w-full prose prose-invert prose-gray max-w-none markdown-preview" style={{ minHeight: 'calc(100vh - 300px)' }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content || ''}
      </ReactMarkdown>
      {!content && (
        <div className="text-gray-600 italic">Start writing your note...</div>
      )}
      <style>{`
        .markdown-preview {
          color: rgb(209, 213, 219);
          line-height: 1.625;
        }
        .markdown-preview h1 {
          font-size: 2.25rem;
          font-weight: 700;
          color: rgb(229, 231, 235);
          margin-bottom: 1rem;
          margin-top: 0.5rem;
        }
        .markdown-preview h2 {
          font-size: 1.875rem;
          font-weight: 700;
          color: rgb(229, 231, 235);
          margin-bottom: 0.75rem;
          margin-top: 0.5rem;
        }
        .markdown-preview h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: rgb(209, 213, 219);
          margin-bottom: 0.75rem;
          margin-top: 0.5rem;
        }
        .markdown-preview h4 {
          font-size: 1.25rem;
          font-weight: 600;
          color: rgb(209, 213, 219);
          margin-bottom: 0.5rem;
          margin-top: 0.5rem;
        }
        .markdown-preview h5 {
          font-size: 1.125rem;
          font-weight: 600;
          color: rgb(209, 213, 219);
          margin-bottom: 0.5rem;
          margin-top: 0.5rem;
        }
        .markdown-preview h6 {
          font-size: 1rem;
          font-weight: 600;
          color: rgb(209, 213, 219);
          margin-bottom: 0.5rem;
          margin-top: 0.5rem;
        }
        .markdown-preview p {
          color: rgb(209, 213, 219);
          margin-bottom: 1rem;
          line-height: 1.625;
        }
        .markdown-preview a {
          color: rgb(96, 165, 250);
          text-decoration: underline;
        }
        .markdown-preview a:hover {
          color: rgb(147, 197, 253);
        }
        .markdown-preview ul, .markdown-preview ol {
          color: rgb(209, 213, 219);
          margin-bottom: 1rem;
          padding-left: 1.5rem;
        }
        .markdown-preview ul {
          list-style-type: disc;
        }
        .markdown-preview ol {
          list-style-type: decimal;
        }
        .markdown-preview li {
          color: rgb(209, 213, 219);
          margin-bottom: 0.5rem;
        }
        .markdown-preview blockquote {
          border-left: 4px solid rgb(75, 85, 99);
          padding-left: 1rem;
          font-style: italic;
          color: rgb(156, 163, 175);
          margin: 1rem 0;
        }
        .markdown-preview code {
          background-color: rgb(58, 68, 80);
          color: rgb(209, 213, 219);
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        }
        .markdown-preview pre {
          background-color: rgb(58, 68, 80);
          color: rgb(209, 213, 219);
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1rem 0;
        }
        .markdown-preview pre code {
          background-color: transparent;
          padding: 0;
          font-size: 0.875rem;
        }
        .markdown-preview table {
          min-width: 100%;
          border-collapse: collapse;
          border: 1px solid rgb(75, 85, 99);
          margin: 1rem 0;
        }
        .markdown-preview thead {
          background-color: rgb(58, 68, 80);
        }
        .markdown-preview tr {
          border-bottom: 1px solid rgb(75, 85, 99);
        }
        .markdown-preview th, .markdown-preview td {
          border: 1px solid rgb(75, 85, 99);
          padding: 0.5rem 1rem;
          color: rgb(209, 213, 219);
        }
        .markdown-preview th {
          text-align: left;
          color: rgb(209, 213, 219);
          font-weight: 600;
        }
        .markdown-preview hr {
          border-color: rgb(75, 85, 99);
          margin: 2rem 0;
          border-top: 1px solid rgb(75, 85, 99);
          border-bottom: none;
          border-left: none;
          border-right: none;
        }
        .markdown-preview strong {
          font-weight: 700;
          color: rgb(229, 231, 235);
        }
        .markdown-preview em {
          font-style: italic;
        }
        .markdown-preview del {
          text-decoration: line-through;
          color: rgb(156, 163, 175);
        }
        .markdown-preview img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }
        .markdown-preview input[type="checkbox"] {
          margin-right: 0.5rem;
        }
        .markdown-preview task-list-item {
          list-style-type: none;
        }
      `}</style>
    </div>
  );
}

