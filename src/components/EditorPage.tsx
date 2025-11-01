import { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Menu as MenuIcon,
  Bold,
  Italic,
  Strikethrough,
  Minus,
  Quote,
  List,
  ListOrdered,
  CheckSquare,
  Table,
  Image,
  Link,
  Code,
  Code2,
  Download,
  Trash2,
  GitBranch,
  X,
  ChevronLeft,
  Book,
} from 'lucide-react';
import { getNoteById, saveNote, createNote, deleteNote, getNotes } from '../lib/storage';
import { getFlows, createFlow, addNoteToFlow, Flow, getFlowsContainingNote } from '../lib/flowStorage';
import MarkdownEditor from './MarkdownEditor';
import MarkdownPreview from './MarkdownPreview';
import ConfirmDialog from './ConfirmDialog';

interface EditorPageProps {
  noteId: string | null;
  onNavigateToHome: () => void;
  onNavigateToFlows: () => void;
  onNavigateToNotes: () => void;
}

export default function EditorPage({ noteId, onNavigateToHome, onNavigateToFlows, onNavigateToNotes }: EditorPageProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editorMode, setEditorMode] = useState<'markdown' | 'preview'>(noteId ? 'preview' : 'markdown');
  const [saving, setSaving] = useState(false);
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(noteId);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showFlowModal, setShowFlowModal] = useState(false);
  const [flows, setFlows] = useState<Pick<Flow, 'id' | 'title'>[]>([]);
  const [newFlowName, setNewFlowName] = useState('');
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [noteFlowInfo, setNoteFlowInfo] = useState<{ flowId: string; flowTitle: string }[]>([]);
  const [showFlowTooltip, setShowFlowTooltip] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [flowsUsingNote, setFlowsUsingNote] = useState<Array<{ flowId: string; flowTitle: string }>>([]);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const flowButtonRef = useRef<HTMLButtonElement | null>(null);

  // isEditMode is true when in markdown mode (not preview)
  const isEditMode = editorMode === 'markdown';

  useEffect(() => {
    if (noteId) {
      loadNote(noteId);
      // When opening an existing note, default to preview mode
      setEditorMode('preview');
    } else {
      setTitle('');
      setContent('');
      // When creating a new note, default to edit mode
      setEditorMode('markdown');
    }
    loadFlows();
  }, [noteId]);

  useEffect(() => {
    checkNoteInFlow();
  }, [currentNoteId, flows]);

  const loadFlows = () => {
    try {
      const data = getFlows();
      setFlows((data || []).map((f) => ({ id: f.id, title: f.title })));
    } catch (error) {
      console.error('Error loading flows:', error);
    }
  };

  const checkNoteInFlow = () => {
    if (!currentNoteId) {
      setNoteFlowInfo([]);
      return;
    }
    try {
      const allFlows = getFlows();
      const flowsContainingNote: { flowId: string; flowTitle: string }[] = [];
      
      for (const flow of allFlows) {
        const node = flow.nodes.find((n) => n.noteId === currentNoteId);
        if (node) {
          flowsContainingNote.push({ flowId: flow.id, flowTitle: flow.title });
        }
      }
      
      setNoteFlowInfo(flowsContainingNote);
    } catch (error) {
      console.error('Error checking note in flow:', error);
      setNoteFlowInfo([]);
    }
  };

  const loadNote = (id: string) => {
    try {
      const data = getNoteById(id);
      if (data) {
        setTitle(data.title);
        setContent(data.content);
        setCurrentNoteId(data.id);
      }
    } catch (error) {
      console.error('Error loading note:', error);
    }
  };

  const wrapSelection = (prefix: string, suffix: string = prefix) => {
    const textarea = editorRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const before = content.slice(0, start);
    const selected = content.slice(start, end);
    const after = content.slice(end);
    const next = `${before}${prefix}${selected || 'text'}${suffix}${after}`;
    setContent(next);
    // Restore selection roughly around inserted text
    const cursorPos = start + prefix.length + (selected ? selected.length : 4);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPos, cursorPos);
    });
  };

  const applyToSelectedLines = (linePrefix: string) => {
    const textarea = editorRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const before = content.slice(0, start);
    const selected = content.slice(start, end);
    const after = content.slice(end);
    const selection = selected || '';
    const lines = selection.split(/\n/);
    const transformed = lines.map((l) => `${linePrefix}${l.replace(/^\s*/, '')}`).join('\n');
    const next = `${before}${transformed}${after}`;
    setContent(next);
    requestAnimationFrame(() => {
      textarea.focus();
    });
  };

  const insertAtCursor = (text: string) => {
    const textarea = editorRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const before = content.slice(0, start);
    const after = content.slice(end);
    const next = `${before}${text}${after}`;
    setContent(next);
    const cursorPos = start + text.length;
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPos, cursorPos);
    });
  };

  useEffect(() => {
    if (!isEditMode) return;
    setSaving(true);
    const t = setTimeout(() => {
      try {
        if (currentNoteId) {
          const updated = saveNote({
            id: currentNoteId,
            title: title || 'Untitled',
            content,
            created_at: getNoteById(currentNoteId)?.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          setCurrentNoteId(updated.id);
        } else {
          const created = createNote(title || 'Untitled', content);
          setCurrentNoteId(created.id);
        }
      } catch (e) {
        console.error('Autosave error:', e);
      } finally {
        setSaving(false);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [title, content, isEditMode, currentNoteId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  // Handle keyboard shortcuts in markdown editor
  useEffect(() => {
    const textarea = editorRef.current;
    if (!textarea || editorMode !== 'markdown') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Only handle shortcuts when modifier is pressed
      if (!modKey) return;

      // Prevent default browser behavior for shortcuts
      if ((e.key === 'b' || e.key === 'B') && modKey && !e.shiftKey) {
        e.preventDefault();
        wrapSelection('**');
      } else if ((e.key === 'i' || e.key === 'I') && modKey && !e.shiftKey) {
        e.preventDefault();
        wrapSelection('*');
      } else if ((e.key === 'k' || e.key === 'K') && modKey && !e.shiftKey) {
        e.preventDefault();
        const start = textarea.selectionStart ?? 0;
        const end = textarea.selectionEnd ?? 0;
        const before = content.slice(0, start);
        const selected = content.slice(start, end);
        const after = content.slice(end);
        const linkText = selected || 'link text';
        const linkMarkdown = `[${linkText}](https://)`;
        const next = `${before}${linkMarkdown}${after}`;
        setContent(next);
        // Select the URL part (https://) for easy editing
        const urlStart = start + linkText.length + 3; // After '[link text]('
        const urlEnd = urlStart + 8; // Length of 'https://'
        requestAnimationFrame(() => {
          if (textarea) {
            textarea.focus();
            textarea.setSelectionRange(urlStart, urlEnd);
          }
        });
      } else if (e.key === '`' && modKey && !e.shiftKey) {
        e.preventDefault();
        wrapSelection('`');
      } else if (e.key === '`' && modKey && e.shiftKey) {
        e.preventDefault();
        wrapSelection('\n```\n', '\n```\n');
      } else if ((e.key === 'x' || e.key === 'X') && modKey && e.shiftKey) {
        e.preventDefault();
        wrapSelection('~~');
      }
    };

    textarea.addEventListener('keydown', handleKeyDown);

    return () => {
      textarea.removeEventListener('keydown', handleKeyDown);
    };
  }, [editorMode, content]);

  const handleExportNote = () => {
    if (!currentNoteId) return;
    const note = getNoteById(currentNoteId);
    if (!note) return;

    const blob = new Blob([JSON.stringify(note, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/[^a-z0-9]/gi, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setMenuOpen(false);
  };

  const handleExportAll = () => {
    const notes = getNotes();
    const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pinn-notes-export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setMenuOpen(false);
  };

  const handleDeleteNote = () => {
    if (!currentNoteId) return;
    const flows = getFlowsContainingNote(currentNoteId);
    setFlowsUsingNote(flows);
    setShowDeleteConfirm(true);
    setMenuOpen(false);
  };

  const confirmDeleteNote = () => {
    if (currentNoteId) {
      deleteNote(currentNoteId);
      onNavigateToHome();
    }
    setFlowsUsingNote([]);
  };

  const handleAddToFlowClick = () => {
    if (currentNoteId) {
      setShowFlowModal(true);
    }
  };

  const handleFlowSelection = () => {
    if (!currentNoteId) return;

    if (selectedFlowId) {
      // Add to existing flow
      addNoteToFlow(selectedFlowId, currentNoteId, title || 'Untitled');
    } else if (newFlowName.trim()) {
      // Create new flow and add note
      const newFlow = createFlow(newFlowName.trim());
      addNoteToFlow(newFlow.id, currentNoteId, title || 'Untitled');
      // Navigate to flows page and then to the new flow
      onNavigateToFlows();
      // Note: The flow will be opened from the flows listing page
    }

    setShowFlowModal(false);
    setSelectedFlowId(null);
    setNewFlowName('');
    // Refresh flow info after adding
    setTimeout(() => {
      checkNoteInFlow();
      setShowFlowTooltip(true);
      setTimeout(() => setShowFlowTooltip(false), 3000);
    }, 100);
  };

  return (
    <div className="h-screen bg-[#2c3440] flex flex-col overflow-hidden">
      <header className="flex-shrink-0 bg-[#2c3440] flex items-center justify-between px-6 py-4 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <button
            onClick={onNavigateToNotes}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            title="Back to Notes"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onNavigateToHome}
            className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New Note</span>
          </button>
          <button
            onClick={onNavigateToNotes}
            className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            <Book className="w-5 h-5" />
            <span>Notes</span>
          </button>
          <button
            onClick={onNavigateToFlows}
            className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            <GitBranch className="w-5 h-5" />
            <span>Flow</span>
          </button>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              <MenuIcon className="w-5 h-5" />
              <span>Menu</span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[#3a4450] border border-gray-600 rounded-lg shadow-lg z-50">
                <div className="py-1">
                  {currentNoteId && (
                    <>
                      <button
                        onClick={handleExportNote}
                        className="w-full flex items-center gap-2 px-4 py-2 text-left text-gray-300 hover:bg-[#2c3440] hover:text-white transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export Note</span>
                      </button>
                      <button
                        onClick={handleDeleteNote}
                        className="w-full flex items-center gap-2 px-4 py-2 text-left text-red-400 hover:bg-[#2c3440] hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Note</span>
                      </button>
                      <div className="border-t border-gray-600 my-1" />
                    </>
                  )}
                  <button
                    onClick={handleExportAll}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-gray-300 hover:bg-[#2c3440] hover:text-white transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export All Notes</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 max-w-6xl w-full mx-auto px-6 pt-8 pb-4 bg-[#2c3440]">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full bg-transparent text-4xl font-light text-gray-300 placeholder-gray-600 focus:outline-none mb-4"
          />

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-[#3a4450] rounded-lg p-1">
                <button
                  onClick={() => setEditorMode('markdown')}
                  className={`px-4 py-2 rounded-md text-sm transition-colors ${
                    editorMode === 'markdown'
                      ? 'bg-[#2c3440] text-white'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Write
                </button>
                <button
                  onClick={() => setEditorMode('preview')}
                  className={`px-4 py-2 rounded-md text-sm transition-colors ${
                    editorMode === 'preview'
                      ? 'bg-[#2c3440] text-white'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Preview
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {currentNoteId && (
                <>
                  <div className="relative">
                    <button
                      ref={flowButtonRef}
                      onClick={handleAddToFlowClick}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-300 hover:bg-[#3a4450] rounded transition-colors"
                      onMouseEnter={() => noteFlowInfo.length > 0 && setShowFlowTooltip(true)}
                      onMouseLeave={() => setShowFlowTooltip(false)}
                    >
                      Add to flow
                    </button>
                    {showFlowTooltip && noteFlowInfo.length > 0 && (
                      <div className="absolute top-full left-0 mt-2 px-3 py-2.5 bg-[#3a4450] border border-gray-600 rounded-lg shadow-lg z-50 min-w-[200px]">
                        <div className="text-sm text-gray-300">
                          {noteFlowInfo.length === 1 ? (
                            <>
                              Note added to <span className="font-semibold text-[#e8935f]">{noteFlowInfo[0].flowTitle}</span>
                            </>
                          ) : (
                            <div>
                              <div className="mb-1.5">Note added to {noteFlowInfo.length} flows:</div>
                              <div className="space-y-1">
                                {noteFlowInfo.map((flow) => (
                                  <div key={flow.flowId} className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#e8935f]"></span>
                                    <span className="font-semibold text-[#e8935f]">{flow.flowTitle}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="absolute -top-1 left-4 w-2 h-2 bg-[#3a4450] border-l border-t border-gray-600 transform rotate-45"></div>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">{saving ? 'Saving…' : 'Saved'}</div>
                  <button
                    onClick={handleDeleteNote}
                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-[#3a4450] rounded transition-colors"
                    title="Delete note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
              {!currentNoteId && (
                <div className="text-sm text-gray-500">{saving ? 'Saving…' : 'Saved'}</div>
              )}
            </div>
          </div>

          {isEditMode && editorMode === 'markdown' && (
            <div className="flex items-center gap-1 pb-6 border-b border-gray-700 flex-wrap">
              <button onClick={() => wrapSelection('**')} className="p-2 text-gray-400 hover:text-white hover:bg-[#3a4450] rounded transition-colors">
                <Bold className="w-5 h-5" />
              </button>
              <button onClick={() => wrapSelection('*')} className="p-2 text-gray-400 hover:text-white hover:bg-[#3a4450] rounded transition-colors">
                <Italic className="w-5 h-5" />
              </button>
              <button onClick={() => wrapSelection('~~')} className="p-2 text-gray-400 hover:text-white hover:bg-[#3a4450] rounded transition-colors">
                <Strikethrough className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-gray-700 mx-2" />
              <button onClick={() => insertAtCursor('\n\n---\n\n')} className="p-2 text-gray-400 hover:text-white hover:bg-[#3a4450] rounded transition-colors">
                <Minus className="w-5 h-5" />
              </button>
              <button onClick={() => applyToSelectedLines('> ')} className="p-2 text-gray-400 hover:text-white hover:bg-[#3a4450] rounded transition-colors">
                <Quote className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-gray-700 mx-2" />
              <button onClick={() => applyToSelectedLines('- ')} className="p-2 text-gray-400 hover:text-white hover:bg-[#3a4450] rounded transition-colors">
                <List className="w-5 h-5" />
              </button>
              <button onClick={() => applyToSelectedLines('1. ')} className="p-2 text-gray-400 hover:text-white hover:bg-[#3a4450] rounded transition-colors">
                <ListOrdered className="w-5 h-5" />
              </button>
              <button onClick={() => applyToSelectedLines('- [ ] ')} className="p-2 text-gray-400 hover:text-white hover:bg-[#3a4450] rounded transition-colors">
                <CheckSquare className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-gray-700 mx-2" />
              <button onClick={() => insertAtCursor(`\n\n| Column 1 | Column 2 | Column 3 |\n|---------:|:--------:|:---------|\n| value    | value    | value    |\n\n`)} className="p-2 text-gray-400 hover:text-white hover:bg-[#3a4450] rounded transition-colors">
                <Table className="w-5 h-5" />
              </button>
              <button onClick={() => insertAtCursor('![alt text](https://)')} className="p-2 text-gray-400 hover:text-white hover:bg-[#3a4450] rounded transition-colors">
                <Image className="w-5 h-5" />
              </button>
              <button onClick={() => insertAtCursor('[link text](https://)')} className="p-2 text-gray-400 hover:text-white hover:bg-[#3a4450] rounded transition-colors">
                <Link className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-gray-700 mx-2" />
              <button onClick={() => wrapSelection('`')} className="p-2 text-gray-400 hover:text-white hover:bg-[#3a4450] rounded transition-colors">
                <Code className="w-5 h-5" />
              </button>
              <button onClick={() => wrapSelection('\n```\n', '\n```\n')} className="p-2 text-gray-400 hover:text-white hover:bg-[#3a4450] rounded transition-colors">
                <Code2 className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        <div 
          className="flex-1 overflow-y-auto content-scroll-container"
          style={{ 
            scrollbarWidth: 'none', /* Firefox */
            msOverflowStyle: 'none', /* IE and Edge */
          }}
        >
          <div className="max-w-6xl mx-auto px-6 py-4">
            {editorMode === 'markdown' ? (
              <MarkdownEditor
                ref={editorRef}
                content={content}
                onChange={setContent}
                readOnly={false}
              />
            ) : (
              <MarkdownPreview content={content} />
            )}
          </div>
          <style>{`
            .content-scroll-container::-webkit-scrollbar {
              display: none; /* Chrome, Safari, Opera */
            }
          `}</style>
        </div>
      </div>

      {showFlowModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#2c3440] rounded-xl shadow-2xl w-full max-w-md border border-gray-700 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-light text-gray-200">Add to Flow</h2>
              <button
                onClick={() => {
                  setShowFlowModal(false);
                  setSelectedFlowId(null);
                  setNewFlowName('');
                }}
                className="text-gray-400 hover:text-white hover:bg-[#3a4450] rounded-lg p-1.5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              </div>
            </div>

            <div className="px-6 py-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Select existing flow</label>
                <div className="max-h-48 overflow-y-auto border border-gray-700 rounded-lg bg-[#1f2833]">
                  {flows.length > 0 ? (
                    flows.map((flow) => (
                      <button
                        key={flow.id}
                        onClick={() => {
                          setSelectedFlowId(flow.id);
                          setNewFlowName('');
                        }}
                        className={`w-full text-left px-4 py-3 transition-all duration-200 ${
                          selectedFlowId === flow.id
                            ? 'bg-[#e8935f] text-white shadow-md'
                            : 'text-gray-300 hover:bg-[#3a4450] hover:text-white'
                        } ${flows.indexOf(flow) !== flows.length - 1 ? 'border-b border-gray-700' : ''}`}
                      >
                        <span className="font-medium">{flow.title}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center text-sm text-gray-500">
                      <p>No flows yet</p>
                      <p className="text-xs mt-1 text-gray-600">Create one below</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 py-1 bg-[#2c3440] text-xs font-medium text-gray-500 uppercase tracking-wider">OR</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Create new flow</label>
                <input
                  type="text"
                  value={newFlowName}
                  onChange={(e) => {
                    setNewFlowName(e.target.value);
                    setSelectedFlowId(null);
                  }}
                  placeholder="Enter flow name..."
                  className="w-full bg-[#1f2833] border border-gray-700 rounded-lg px-4 py-3 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#e8935f] focus:border-transparent transition-all"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-700">
                <button
                  onClick={() => {
                    setShowFlowModal(false);
                    setSelectedFlowId(null);
                    setNewFlowName('');
                  }}
                  className="px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-[#3a4450] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFlowSelection}
                  disabled={!selectedFlowId && !newFlowName.trim()}
                  className="px-5 py-2.5 text-sm font-medium bg-[#e8935f] hover:bg-[#d8834f] text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#e8935f] shadow-lg hover:shadow-xl"
                >
                  {selectedFlowId ? 'Add to Flow' : 'Create Flow'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setFlowsUsingNote([]);
        }}
        onConfirm={confirmDeleteNote}
        title="Delete Note"
        message={
          flowsUsingNote.length > 0
            ? `This note is used in ${flowsUsingNote.length} flow${flowsUsingNote.length > 1 ? 's' : ''}: ${flowsUsingNote.map(f => f.flowTitle).join(', ')}. Deleting it will remove it from these flows. Are you sure you want to delete this note? This cannot be undone.`
            : "Are you sure you want to delete this note? This cannot be undone."
        }
        confirmText="Delete"
      />
    </div>
  );
}
