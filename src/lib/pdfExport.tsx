import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createRoot } from 'react-dom/client';

/**
 * Exports a document (title + markdown content) to PDF
 */
export async function exportToPDF(title: string, content: string, filename?: string): Promise<void> {
  // Create a temporary container for PDF rendering
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '210mm'; // A4 width
  container.style.padding = '40mm 30mm'; // Margins for A4
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#1a1a1a';
  container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  container.style.lineHeight = '1.6';
  container.style.fontSize = '14px';
  container.id = 'pdf-export-container';
  document.body.appendChild(container);

  // Create a root for React rendering
  const root = createRoot(container);
  
  // Render the document content
  root.render(
    <div style={{
      maxWidth: '100%',
      color: '#1a1a1a',
    }}>
      {/* Title */}
      <h1 style={{
        fontSize: '36px',
        fontWeight: '700',
        color: '#000000',
        marginBottom: '24px',
        marginTop: '0',
        lineHeight: '1.2',
        borderBottom: '2px solid #e5e7eb',
        paddingBottom: '16px',
      }}>
        {title || 'Untitled'}
      </h1>

      {/* Content - rendered markdown */}
      <div className="pdf-content" style={{
        color: '#1a1a1a',
        lineHeight: '1.7',
      }}>
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#000000',
                marginTop: '32px',
                marginBottom: '16px',
                lineHeight: '1.3',
              }}>{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1a1a1a',
                marginTop: '28px',
                marginBottom: '14px',
                lineHeight: '1.3',
              }}>{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1a1a1a',
                marginTop: '24px',
                marginBottom: '12px',
                lineHeight: '1.3',
              }}>{children}</h3>
            ),
            h4: ({ children }) => (
              <h4 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1a1a1a',
                marginTop: '20px',
                marginBottom: '10px',
                lineHeight: '1.3',
              }}>{children}</h4>
            ),
            h5: ({ children }) => (
              <h5 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1a1a1a',
                marginTop: '18px',
                marginBottom: '8px',
                lineHeight: '1.3',
              }}>{children}</h5>
            ),
            h6: ({ children }) => (
              <h6 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#1a1a1a',
                marginTop: '16px',
                marginBottom: '8px',
                lineHeight: '1.3',
              }}>{children}</h6>
            ),
            p: ({ children }) => (
              <p style={{
                marginBottom: '16px',
                marginTop: '0',
                lineHeight: '1.7',
                color: '#1a1a1a',
              }}>{children}</p>
            ),
            ul: ({ children }) => (
              <ul style={{
                marginBottom: '16px',
                marginTop: '0',
                paddingLeft: '24px',
                listStyleType: 'disc',
              }}>{children}</ul>
            ),
            ol: ({ children }) => (
              <ol style={{
                marginBottom: '16px',
                marginTop: '0',
                paddingLeft: '24px',
                listStyleType: 'decimal',
              }}>{children}</ol>
            ),
            li: ({ children }) => (
              <li style={{
                marginBottom: '8px',
                lineHeight: '1.6',
                color: '#1a1a1a',
              }}>{children}</li>
            ),
            blockquote: ({ children }) => (
              <blockquote style={{
                borderLeft: '4px solid #d1d5db',
                paddingLeft: '16px',
                marginLeft: '0',
                marginRight: '0',
                marginTop: '16px',
                marginBottom: '16px',
                fontStyle: 'italic',
                color: '#4b5563',
              }}>{children}</blockquote>
            ),
            code: ({ inline, children, className }) => {
              if (inline) {
                return (
                  <code style={{
                    backgroundColor: '#f3f4f6',
                    color: '#1f2937',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    border: '1px solid #e5e7eb',
                  }}>{children}</code>
                );
              }
              // Block code - will be wrapped in pre
              return <>{children}</>;
            },
            pre: ({ children }) => {
              // Extract code content
              const codeContent = typeof children === 'string' 
                ? children 
                : (children as any)?.props?.children || String(children);
              
              return (
                <pre style={{
                  backgroundColor: '#f3f4f6',
                  color: '#1f2937',
                  padding: '16px',
                  borderRadius: '6px',
                  marginTop: '16px',
                  marginBottom: '16px',
                  border: '1px solid #e5e7eb',
                  fontSize: '13px',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'break-word',
                  lineHeight: '1.5',
                }}>{codeContent}</pre>
              );
            },
            table: ({ children }) => (
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: '16px',
                marginBottom: '16px',
                border: '1px solid #e5e7eb',
              }}>{children}</table>
            ),
            thead: ({ children }) => (
              <thead style={{
                backgroundColor: '#f9fafb',
              }}>{children}</thead>
            ),
            tbody: ({ children }) => <tbody>{children}</tbody>,
            tr: ({ children }) => (
              <tr style={{
                borderBottom: '1px solid #e5e7eb',
              }}>{children}</tr>
            ),
            th: ({ children }) => (
              <th style={{
                padding: '12px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#1a1a1a',
                border: '1px solid #e5e7eb',
              }}>{children}</th>
            ),
            td: ({ children }) => (
              <td style={{
                padding: '12px',
                color: '#1a1a1a',
                border: '1px solid #e5e7eb',
              }}>{children}</td>
            ),
            hr: () => (
              <hr style={{
                border: 'none',
                borderTop: '1px solid #e5e7eb',
                marginTop: '32px',
                marginBottom: '32px',
              }} />
            ),
            strong: ({ children }) => (
              <strong style={{
                fontWeight: '700',
                color: '#000000',
              }}>{children}</strong>
            ),
            em: ({ children }) => (
              <em style={{
                fontStyle: 'italic',
              }}>{children}</em>
            ),
            a: ({ href, children }) => (
              <a href={href} style={{
                color: '#2563eb',
                textDecoration: 'underline',
              }}>{children}</a>
            ),
            img: ({ src, alt }) => (
              <img 
                src={src || ''} 
                alt={alt || ''} 
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  marginTop: '16px',
                  marginBottom: '16px',
                  borderRadius: '6px',
                }}
              />
            ),
          }}
        >
          {content || ''}
        </ReactMarkdown>
      </div>
    </div>
  );

  // Wait for rendering to complete
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    // Capture the container as canvas
    const canvas = await html2canvas(container, {
      scale: 2, // Higher quality
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });

    // Calculate PDF dimensions (A4)
    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = 297; // A4 height in mm
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / pdfWidth;
    const imgHeightMM = imgHeight / ratio;

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // If content fits on one page
    if (imgHeightMM <= pdfHeight) {
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, imgHeightMM);
    } else {
      // Multi-page PDF
      let heightLeft = imgHeightMM;
      let position = 0;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, pdfWidth, imgHeightMM);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeightMM;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, pdfWidth, imgHeightMM);
        heightLeft -= pdfHeight;
      }
    }

    // Save PDF
    const sanitizedName = filename || title.replace(/[^a-z0-9]/gi, '_') || 'Untitled';
    pdf.save(`${sanitizedName}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    // Cleanup
    root.unmount();
    document.body.removeChild(container);
  }
}

