import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Menu as MenuIcon, Download, Trash2, ChevronLeft, GitBranch } from 'lucide-react';
import { getNotes, Note, deleteNote, writeAll } from '../lib/storage';
import { getFlowsContainingNote } from '../lib/flowStorage';
import ConfirmDialog from './ConfirmDialog';

interface NotesPageProps {
  onNavigateToEditor: (noteId?: string) => void;
  onNavigateToHome: () => void;
  onNavigateToFlows: () => void;
}

export default function NotesPage({ onNavigateToEditor, onNavigateToHome, onNavigateToFlows }: NotesPageProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'date'>('date');
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [flowsUsingNote, setFlowsUsingNote] = useState<Array<{ flowId: string; flowTitle: string }>>([]);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    filterAndSortNotes();
  }, [notes, searchQuery, sortBy]);

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

  const loadNotes = () => {
    try {
      const data = getNotes();
      setNotes(data || []);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortNotes = () => {
    let filtered = notes;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = notes.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query)
      );
    }

    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    setFilteredNotes(filtered);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const handleNewNote = () => {
    onNavigateToEditor();
  };

  const handleDeleteNote = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const flows = getFlowsContainingNote(noteId);
    setFlowsUsingNote(flows);
    setNoteToDelete(noteId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteNote = () => {
    if (noteToDelete) {
      deleteNote(noteToDelete);
      loadNotes();
      setNoteToDelete(null);
      setFlowsUsingNote([]);
    }
  };

  const handleExportAll = () => {
    const allNotes = getNotes();
    const blob = new Blob([JSON.stringify(allNotes, null, 2)], { type: 'application/json' });
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

  const handleClearAll = () => {
    setShowClearAllConfirm(true);
    setMenuOpen(false);
  };

  const confirmClearAll = () => {
    notes.forEach((note) => deleteNote(note.id));
    setNotes([]);
    setFilteredNotes([]);
  };

  const getPreview = (content: string, maxLength: number = 100) => {
    if (!content) return 'No content';
    
    // Convert markdown to plain text more intelligently
    let text = content;
    
    // Handle markdown tables - extract text from table rows
    text = text.replace(/\|(.+)\|/g, (match, content) => {
      // Skip separator rows (like |-----: |-----: |)
      if (content.match(/^[\s-:]+$/)) return '';
      // Extract cell contents and join with spaces
      const cells = content.split('|').map(c => c.trim()).filter(c => c && !c.match(/^[-:]+$/));
      return cells.join(' ');
    });
    
    // Remove markdown headers
    text = text.replace(/^#{1,6}\s+(.+)$/gm, '$1');
    
    // Remove markdown links but keep the text
    text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
    
    // Remove markdown images but keep alt text
    text = text.replace(/!\[([^\]]*)\]\([^\)]+\)/g, '$1');
    
    // Remove markdown code blocks
    text = text.replace(/```[\s\S]*?```/g, '');
    
    // Remove inline code
    text = text.replace(/`([^`]+)`/g, '$1');
    
    // Remove markdown lists markers
    text = text.replace(/^[\s]*[-*+]\s+/gm, '');
    text = text.replace(/^[\s]*\d+\.\s+/gm, '');
    
    // Remove markdown bold/italic markers
    text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
    text = text.replace(/\*([^*]+)\*/g, '$1');
    text = text.replace(/__([^_]+)__/g, '$1');
    text = text.replace(/_([^_]+)_/g, '$1');
    
    // Remove markdown strikethrough
    text = text.replace(/~~([^~]+)~~/g, '$1');
    
    // Remove markdown blockquotes
    text = text.replace(/^>\s+/gm, '');
    
    // Remove horizontal rules
    text = text.replace(/^[-*_]{3,}$/gm, '');
    
    // Remove remaining markdown special characters (but keep pipes and colons for content)
    text = text.replace(/[#`\[\]()]/g, '');
    
    // Clean up extra whitespace
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.replace(/\s+/g, ' ');
    text = text.trim();
    
    if (!text || text.length === 0) return 'No content';
    
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="min-h-screen bg-[#2c3440]">
      <header className="sticky top-0 z-50 bg-[#2c3440] flex items-center justify-between px-6 py-4 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <button
            onClick={onNavigateToHome}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            title="Back to Home"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
          <h1 className="text-xl font-light text-gray-300">Notes</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleNewNote}
            className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New Note</span>
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
                  <button
                    onClick={handleExportAll}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-gray-300 hover:bg-[#2c3440] hover:text-white transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export All Notes</span>
                  </button>
                  <div className="border-t border-gray-600 my-1" />
                  <button
                    onClick={handleClearAll}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-red-400 hover:bg-[#2c3440] hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear All Notes</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="relative mb-12">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#3a4450] border border-gray-600 rounded-lg pl-12 pr-4 py-3 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-gray-500 transition-colors"
          />
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading notes...</div>
        ) : filteredNotes.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm uppercase tracking-wider text-gray-500">
                Recently Modified
              </h3>
              <button
                onClick={() => setSortBy(sortBy === 'title' ? 'date' : 'title')}
                className="text-sm text-gray-500 hover:text-gray-400 transition-colors"
              >
                Sort By: {sortBy === 'title' ? 'Title' : 'Date'}
              </button>
            </div>

            <div className="space-y-6">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="group relative bg-[#3a4450] rounded-lg p-4 hover:bg-[#424d5a] transition-colors cursor-pointer"
                  onClick={() => onNavigateToEditor(note.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg text-gray-300 group-hover:text-white transition-colors mb-2">
                        {note.title}
                      </h4>
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                        {getPreview(note.content)}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{formatDate(note.updated_at)}</span>
                        <span>{note.content.length} characters</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 hover:bg-[#2c3440] rounded transition-all"
                      title="Delete note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500 py-12">
            {searchQuery ? 'No notes found' : 'No notes yet. Create your first note!'}
          </div>
        )}
      </main>

      <button
        onClick={handleNewNote}
        className="fixed bottom-8 right-8 w-14 h-14 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center shadow-lg transition-colors"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setNoteToDelete(null);
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

      <ConfirmDialog
        isOpen={showClearAllConfirm}
        onClose={() => setShowClearAllConfirm(false)}
        onConfirm={confirmClearAll}
        title="Delete All Notes"
        message="Are you sure you want to delete all notes? This cannot be undone."
        confirmText="Delete All"
      />
    </div>
  );
}

