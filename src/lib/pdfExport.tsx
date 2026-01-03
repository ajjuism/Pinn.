import React from 'react';
import { Document, Page, Text, View, Link, StyleSheet, pdf } from '@react-pdf/renderer';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import type { Root, Content, PhrasingContent, Text as MdastText, Heading, Paragraph, List, ListItem, Code, InlineCode, Strong, Emphasis, Delete, Link as MdastLink, Image as MdastImage, Blockquote, Table, TableRow, TableCell } from 'mdast';

// Register fonts (using default fonts for now)
// You can add custom fonts later if needed

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    lineHeight: 1.6,
    color: '#2c3e50',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1a1a1a',
  },
  titleDivider: {
    borderBottom: '1px solid #e0e0e0',
    marginBottom: 20,
  },
  heading1: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#000000',
  },
  heading2: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 14,
    marginBottom: 6,
    color: '#1a1a1a',
  },
  heading3: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 5,
    color: '#2a2a2a',
  },
  heading4: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 4,
    color: '#3a3a3a',
  },
  paragraph: {
    marginBottom: 8,
  },
  list: {
    marginBottom: 8,
    paddingLeft: 20,
  },
  listItem: {
    marginBottom: 4,
  },
  bullet: {
    marginRight: 8,
  },
  codeBlock: {
    backgroundColor: '#f8f8f8',
    padding: 10,
    marginBottom: 10,
    fontFamily: 'Courier',
    fontSize: 9,
    border: '1px solid #e0e0e0',
  },
  inlineCode: {
    backgroundColor: '#f0f0f0',
    padding: '2px 4px',
    fontFamily: 'Courier',
    fontSize: 9.5,
    color: '#3a3a3a',
  },
  blockquote: {
    borderLeft: '3px solid #d0d0d0',
    paddingLeft: 15,
    marginLeft: 0,
    marginBottom: 10,
    color: '#6e6e6e',
    fontStyle: 'italic',
  },
  table: {
    marginBottom: 10,
    border: '1px solid #d0d0d0',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e0e0e0',
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
    fontWeight: 'bold',
  },
  tableCell: {
    padding: 8,
    borderRight: '1px solid #e0e0e0',
    flex: 1,
  },
  link: {
    color: '#5078a0',
    textDecoration: 'underline',
  },
  tag: {
    color: '#3b82f6',
    fontFamily: 'Courier',
    fontSize: 10,
  },
  noteRef: {
    color: '#e89347',
    fontFamily: 'Courier',
    fontSize: 10.5,
  },
  imagePlaceholder: {
    color: '#999999',
    fontStyle: 'italic',
    fontSize: 10,
  },
  horizontalRule: {
    borderBottom: '1px solid #c0c0c0',
    marginTop: 10,
    marginBottom: 10,
  },
  strikethrough: {
    textDecoration: 'line-through',
  },
});

/**
 * Parse inline text to handle custom features (tags, note references, URLs)
 */
function parseInlineText(text: string): Array<{ text: string; type: 'text' | 'tag' | 'noteRef' | 'url'; url?: string; noteId?: string; noteTitle?: string }> {
  // Replace rupee symbol for reliable rendering
  text = text.replace(/₹/g, 'Rs. ');
  
  const parts: Array<{ text: string; type: 'text' | 'tag' | 'noteRef' | 'url'; url?: string; noteId?: string; noteTitle?: string }> = [];
  let lastIndex = 0;

  // Combined pattern: note refs, tags, URLs
  // Note: Order matters - note refs first, then tags, then URLs
  const pattern = /(\[\[note:([^\]]+)\|([^\]]+)\]\]|#[\w_]+|https?:\/\/[^\s<>"{}|\\^`\[\]()]+)/g;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push({
        text: text.substring(lastIndex, match.index),
        type: 'text',
      });
    }

    // Process the match
    if (match[1] && match[2] && match[3]) {
      // Note reference: [[note:id|title]]
      parts.push({
        text: ` Note referred: ${match[3]} `,
        type: 'noteRef',
        noteId: match[2],
        noteTitle: match[3],
      });
    } else if (match[0].startsWith('#')) {
      // Tag
      parts.push({
        text: match[0],
        type: 'tag',
      });
    } else if (match[0].startsWith('http')) {
      // URL
      parts.push({
        text: match[0],
        type: 'url',
        url: match[0],
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
        if (lastIndex < text.length) {
    parts.push({
            text: text.substring(lastIndex),
      type: 'text',
    });
  }

  return parts.length > 0 ? parts : [{ text, type: 'text' }];
}

/**
 * Render inline content (text with formatting)
 */
function renderInlineContent(node: PhrasingContent, key: number = 0): React.ReactElement {
  if (node.type === 'text') {
    const textNode = node as MdastText;
    const parts = parseInlineText(textNode.value);
    
    return (
      <Text key={key}>
        {parts.map((part, idx) => {
          if (part.type === 'tag') {
            return (
              <Text key={idx} style={styles.tag}>
                {part.text}
              </Text>
            );
          } else if (part.type === 'noteRef') {
            return (
              <Text key={idx} style={styles.noteRef}>
                {part.text}
              </Text>
            );
          } else if (part.type === 'url') {
            return (
              <Link key={idx} src={part.url} style={styles.link}>
                {part.text}
              </Link>
            );
    } else {
            return <Text key={idx}>{part.text}</Text>;
          }
        })}
      </Text>
    );
  }

  if (node.type === 'strong') {
    const strongNode = node as Strong;
    return (
      <Text key={key} style={{ fontWeight: 'bold' }}>
        {strongNode.children.map((child, idx) => renderInlineContent(child, idx))}
      </Text>
    );
  }

  if (node.type === 'emphasis') {
    const emphasisNode = node as Emphasis;
    return (
      <Text key={key} style={{ fontStyle: 'italic' }}>
        {emphasisNode.children.map((child, idx) => renderInlineContent(child, idx))}
      </Text>
    );
  }

  if (node.type === 'delete') {
    const deleteNode = node as Delete;
    return (
      <Text key={key} style={styles.strikethrough}>
        {deleteNode.children.map((child, idx) => renderInlineContent(child, idx))}
      </Text>
    );
  }

  if (node.type === 'inlineCode') {
    const codeNode = node as InlineCode;
    return (
      <Text key={key} style={styles.inlineCode}>
        {codeNode.value}
      </Text>
    );
  }

  if (node.type === 'link') {
    const linkNode = node as MdastLink;
    return (
      <Link key={key} src={linkNode.url} style={styles.link}>
        {linkNode.children.map((child, idx) => renderInlineContent(child, idx))}
      </Link>
    );
  }

  if (node.type === 'image') {
    const imageNode = node as MdastImage;
    return (
      <Text key={key} style={styles.imagePlaceholder}>
        [Image: {imageNode.alt || 'image'}]
      </Text>
    );
  }

  // Fallback for unknown types
  return <Text key={key} />;
}

/**
 * Render a markdown node to PDF components
 */
function renderNode(node: Content | Root, key: number = 0): React.ReactElement | null {
  if (node.type === 'heading') {
    const heading = node as Heading;
    const level = heading.depth;
    const headingStyle = level === 1 ? styles.heading1 : 
                         level === 2 ? styles.heading2 : 
                         level === 3 ? styles.heading3 : 
                         styles.heading4;
    
    return (
      <View key={key} style={headingStyle}>
        <Text style={headingStyle}>
          {heading.children.map((child, idx) => renderInlineContent(child, idx))}
        </Text>
      </View>
    );
  }

  if (node.type === 'paragraph') {
    const paragraph = node as Paragraph;
    return (
      <View key={key} style={styles.paragraph}>
        <Text>
          {paragraph.children.map((child, idx) => renderInlineContent(child, idx))}
        </Text>
      </View>
    );
  }

  if (node.type === 'list') {
    const list = node as List;
    return (
      <View key={key} style={styles.list}>
        {list.children.map((item, idx) => {
          const listItem = item as ListItem;
          // Check if this is a task list item (GFM extension)
          const isTaskList = listItem.checked !== null && listItem.checked !== undefined;
          const marker = isTaskList 
            ? (listItem.checked ? '☑' : '☐')
            : (list.ordered ? `${idx + 1}.` : '•');
          
          return (
            <View key={idx} style={styles.listItem}>
              <View style={{ flexDirection: 'row' }}>
                <Text style={styles.bullet}>{marker}</Text>
                <View style={{ flex: 1 }}>
                  {listItem.children.map((child, childIdx) => renderNode(child, childIdx))}
                </View>
              </View>
            </View>
          );
        })}
      </View>
    );
  }

  if (node.type === 'code') {
    const code = node as Code;
    // Replace rupee symbol for reliable rendering
    const codeText = code.value.replace(/₹/g, 'Rs. ');
    return (
      <View key={key} style={styles.codeBlock}>
        <Text style={{ fontFamily: 'Courier', fontSize: 9 }}>
          {codeText}
        </Text>
      </View>
    );
  }

  if (node.type === 'blockquote') {
    const blockquote = node as Blockquote;
    return (
      <View key={key} style={styles.blockquote}>
        {blockquote.children.map((child, idx) => renderNode(child, idx))}
      </View>
    );
  }

  if (node.type === 'thematicBreak') {
    return (
      <View key={key} style={styles.horizontalRule} />
    );
  }

  if (node.type === 'table') {
    const table = node as Table;
    const rows = table.children;
    // Skip separator row (second row if it's all dashes/colons)
    const filteredRows = rows.filter((row, idx) => {
      if (idx === 1) {
        const rowText = row.children.map((cell: TableCell) => {
          const cellText = cell.children
            .map((child: any) => {
              if (child.type === 'text') return child.value;
              if (child.type === 'paragraph') {
                return child.children
                  .map((c: any) => (c.type === 'text' ? c.value : ''))
                  .join('');
              }
              return '';
            })
            .join('');
          return cellText.trim();
        }).join('');
        // If it's all dashes/colons/spaces, it's a separator row
        return !/^[\s:|-]+$/.test(rowText);
      }
      return true;
    });
    
    const isHeaderRow = (rowIdx: number) => rowIdx === 0 && filteredRows.length > 1;
    
    return (
      <View key={key} style={styles.table}>
        {filteredRows.map((row, rowIdx) => {
          const tableRow = row as TableRow;
          const isHeader = isHeaderRow(rowIdx);
          
          return (
            <View 
              key={rowIdx} 
              style={isHeader ? [styles.tableRow, styles.tableHeader] : styles.tableRow}
            >
              {tableRow.children.map((cell, cellIdx) => {
                const tableCell = cell as TableCell;
                return (
                  <View key={cellIdx} style={styles.tableCell}>
                    <Text style={isHeader ? { fontWeight: 'bold' } : undefined}>
                      {tableCell.children.map((child: any, childIdx: number) => {
                        // Table cells can contain paragraphs or phrasing content
                        if (child.type === 'paragraph') {
                          const para = child as Paragraph;
                          return para.children.map((inline, inlineIdx) => 
                            renderInlineContent(inline, inlineIdx)
                          );
                        }
                        // Direct phrasing content
                        return renderInlineContent(child as PhrasingContent, childIdx);
                      })}
                    </Text>
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>
    );
  }

  return null;
}

/**
 * Create PDF document component
 */
function PDFDocument({ title, content }: { title: string; content: string }) {
  // Parse markdown
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm);
  
  const tree = processor.parse(content) as Root;
  
  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View>
          <Text style={styles.title}>{title || 'Untitled'}</Text>
          <View style={styles.titleDivider} />
          {tree.children.map((node, idx) => renderNode(node, idx))}
        </View>
      </Page>
    </Document>
  );
}

/**
 * Exports a document (title + markdown content) to PDF
 */
export async function exportToPDF(title: string, content: string, filename?: string): Promise<void> {
  try {
    const doc = <PDFDocument title={title} content={content} />;
    const blob = await pdf(doc).toBlob();
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedName = filename || title.replace(/[^a-z0-9]/gi, '_') || 'Untitled';
    link.download = `${sanitizedName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
