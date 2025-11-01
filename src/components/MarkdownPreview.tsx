import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';

interface MarkdownPreviewProps {
  content: string;
}

export default function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const [copiedCodeBlocks, setCopiedCodeBlocks] = useState<Set<number>>(new Set());
  
  const handleCopyCode = async (code: string, index: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCodeBlocks(prev => new Set(prev).add(index));
      setTimeout(() => {
        setCopiedCodeBlocks(prev => {
          const newSet = new Set(prev);
          newSet.delete(index);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="w-full prose prose-invert prose-gray max-w-none markdown-preview" style={{ minHeight: 'calc(100vh - 300px)' }}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');
            const codeIndex = node?.position?.start?.line || Date.now();
            
            // Code block (not inline) - handle both with and without language
            if (!inline) {
              const language = match ? match[1] : 'text';
              
              return (
                <div className="relative group code-block-wrapper">
                  <div className="absolute top-3 right-3 z-10">
                    <button
                      onClick={() => handleCopyCode(codeString, codeIndex)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#2c3440]/90 hover:bg-[#2c3440] backdrop-blur-sm border border-gray-600/50 rounded-md text-gray-400 hover:text-gray-200 transition-all text-xs"
                      title="Copy code"
                    >
                      {copiedCodeBlocks.has(codeIndex) ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-400" />
                          <span className="text-green-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <SyntaxHighlighter
                    language={language}
                    style={oneDark}
                    PreTag="div"
                    customStyle={{
                      margin: '1rem 0',
                      borderRadius: '6px',
                      padding: '0.5rem 0.75rem',
                      paddingTop: '2.25rem',
                      paddingBottom: '0.5rem',
                      overflowX: 'hidden',
                      wordWrap: 'break-word',
                      whiteSpace: 'pre-wrap',
                      overflowWrap: 'break-word',
                      backgroundColor: 'transparent',
                      border: 'none',
                      fontSize: '0.875rem',
                      lineHeight: '1.5',
                      color: '#d1d5db',
                    }}
                    codeTagProps={{
                      style: {
                        color: '#d1d5db',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                        background: 'transparent',
                      }
                    }}
                    {...props}
                  >
                    {codeString}
                  </SyntaxHighlighter>
                </div>
              );
            }
            // Inline code
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
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
          overflow-x: hidden;
          overflow-wrap: break-word;
          word-wrap: break-word;
          white-space: pre-wrap;
          margin: 1rem 0;
        }
        .markdown-preview pre code {
          background-color: transparent;
          padding: 0;
          font-size: 0.875rem;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        .markdown-preview .code-block-wrapper {
          position: relative;
        }
        .markdown-preview .code-block-wrapper > div {
          overflow-x: hidden !important;
          word-wrap: break-word !important;
          white-space: pre-wrap !important;
          overflow-wrap: break-word !important;
        }
        .markdown-preview .code-block-wrapper pre {
          overflow-x: hidden !important;
          word-wrap: break-word !important;
          white-space: pre-wrap !important;
          overflow-wrap: break-word !important;
        }
        .markdown-preview .code-block-wrapper code {
          white-space: pre-wrap !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
        }
        .markdown-preview .code-block-wrapper .token {
          background: transparent !important;
        }
        .markdown-preview .code-block-wrapper pre[class*="language-"],
        .markdown-preview .code-block-wrapper code[class*="language-"] {
          background: transparent !important;
          color: #d1d5db !important;
        }
        .markdown-preview .code-block-wrapper > div[class*="language-"] {
          background: transparent !important;
        }
        .markdown-preview .code-block-wrapper .token.comment,
        .markdown-preview .code-block-wrapper .token.prolog,
        .markdown-preview .code-block-wrapper .token.doctype,
        .markdown-preview .code-block-wrapper .token.cdata {
          color: #9ca3af !important;
        }
        .markdown-preview .code-block-wrapper .token.string,
        .markdown-preview .code-block-wrapper .token.attr-value {
          color: #86efac !important;
        }
        .markdown-preview .code-block-wrapper .token.keyword,
        .markdown-preview .code-block-wrapper .token.operator {
          color: #60a5fa !important;
        }
        .markdown-preview .code-block-wrapper .token.property,
        .markdown-preview .code-block-wrapper .token.tag,
        .markdown-preview .code-block-wrapper .token.boolean,
        .markdown-preview .code-block-wrapper .token.number,
        .markdown-preview .code-block-wrapper .token.constant,
        .markdown-preview .code-block-wrapper .token.symbol {
          color: #f59e0b !important;
        }
        .markdown-preview .code-block-wrapper .token.function,
        .markdown-preview .code-block-wrapper .token.class-name {
          color: #a78bfa !important;
        }
        .markdown-preview .code-block-wrapper .token.variable {
          color: #f472b6 !important;
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

