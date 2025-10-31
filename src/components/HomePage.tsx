import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Menu as MenuIcon, FileText, Download, Trash2, GitBranch, Bookmark } from 'lucide-react';
import { getNotes as loadFromStorage, Note, writeAll } from '../lib/storage';
import { getFlows, Flow } from '../lib/flowStorage';
import ConfirmDialog from './ConfirmDialog';

interface HomePageProps {
  onNavigateToEditor: (noteId?: string) => void;
  onNavigateToFlows: () => void;
  onNavigateToFlow: (flowId: string) => void;
  onNavigateToNotes: () => void;
}

export default function HomePage({ onNavigateToEditor, onNavigateToFlows, onNavigateToFlow, onNavigateToNotes }: HomePageProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [filteredFlows, setFilteredFlows] = useState<Flow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'date'>('date');
  const [flowSortBy, setFlowSortBy] = useState<'title' | 'date'>('date');
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadNotes();
    loadFlows();
  }, []);

  useEffect(() => {
    filterAndSortNotes();
    filterAndSortFlows();
  }, [notes, flows, searchQuery, sortBy, flowSortBy]);

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
      const data = loadFromStorage();
      setNotes(data || []);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFlows = () => {
    try {
      const data = getFlows();
      setFlows(data || []);
    } catch (error) {
      console.error('Error loading flows:', error);
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

  const filterAndSortFlows = () => {
    let filtered = flows;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = flows.filter(
        (flow) =>
          flow.title.toLowerCase().includes(query) ||
          flow.tags?.some((tag) => tag.toLowerCase().includes(query)) ||
          flow.nodes.some((node) => node.data.label.toLowerCase().includes(query))
      );
    }

    filtered = [...filtered].sort((a, b) => {
      if (flowSortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setFilteredFlows(filtered);
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

  const handleExportAll = () => {
    const allNotes = loadFromStorage();
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
    writeAll([]);
    setNotes([]);
    setFilteredNotes([]);
  };

  return (
    <div className="min-h-screen bg-[#2c3440]">
      <header className="sticky top-0 z-50 bg-[#2c3440] flex items-center justify-between px-6 py-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#e8935f] rounded-lg flex items-center justify-center">
            <Bookmark className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-light text-gray-300">Pinn.</h1>
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
            onClick={onNavigateToNotes}
            className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            <FileText className="w-5 h-5" />
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

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="relative mb-16">
          <div className="absolute inset-0 bg-gradient-to-r from-[#e8935f]/5 via-transparent to-blue-500/5 rounded-2xl blur-3xl"></div>
          <div className="relative">
            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search notes and flows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#3a4450] border border-gray-600 rounded-xl pl-14 pr-6 py-4 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-[#e8935f]/50 focus:ring-2 focus:ring-[#e8935f]/20 transition-all shadow-lg"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading...</div>
        ) : (
          <div className="space-y-16">
            {/* Flows Section */}
            {filteredFlows.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-8 bg-gradient-to-b from-[#e8935f] to-transparent rounded-full"></div>
                    <h3 className="text-sm uppercase tracking-wider text-gray-400 font-semibold">
                      Recently Created Flows
                    </h3>
                  </div>
                  <button
                    onClick={() => setFlowSortBy(flowSortBy === 'title' ? 'date' : 'title')}
                    className="text-sm text-gray-500 hover:text-gray-300 transition-colors px-3 py-1 rounded-md hover:bg-[#3a4450]"
                  >
                    Sort By: {flowSortBy === 'title' ? 'Title' : 'Date'}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredFlows.slice(0, 6).map((flow) => (
                    <button
                      key={flow.id}
                      onClick={() => onNavigateToFlow(flow.id)}
                      className="group relative bg-[#3a4450] hover:bg-[#424d5a] border border-gray-600 hover:border-gray-500 rounded-xl p-5 transition-all duration-200 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-[#e8935f]/20 to-[#e8935f]/10 border border-[#e8935f]/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <GitBranch className="w-5 h-5 text-[#e8935f]" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <h4 className="text-base font-medium text-gray-200 group-hover:text-white transition-colors mb-1.5 truncate leading-tight">
                            {flow.title}
                          </h4>
                          <div className="flex items-center gap-2.5 flex-wrap text-xs text-gray-500">
                            <span className="whitespace-nowrap">{formatDate(flow.created_at)}</span>
                            <span className="px-2 py-0.5 bg-[#2c3440] rounded-md border border-gray-600 text-gray-400 whitespace-nowrap">
                              {flow.nodes.length} node{flow.nodes.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notes Section */}
            {filteredNotes.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-transparent rounded-full"></div>
                    <h3 className="text-sm uppercase tracking-wider text-gray-400 font-semibold">
                      Recently Modified Notes
                    </h3>
                  </div>
                  <button
                    onClick={() => setSortBy(sortBy === 'title' ? 'date' : 'title')}
                    className="text-sm text-gray-500 hover:text-gray-300 transition-colors px-3 py-1 rounded-md hover:bg-[#3a4450]"
                  >
                    Sort By: {sortBy === 'title' ? 'Title' : 'Date'}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredNotes.map((note) => (
                    <button
                      key={note.id}
                      onClick={() => onNavigateToEditor(note.id)}
                      className="group relative bg-[#3a4450] hover:bg-[#424d5a] border border-gray-600 hover:border-gray-500 rounded-xl p-5 transition-all duration-200 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/10 border border-blue-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <FileText className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <h4 className="text-base font-medium text-gray-200 group-hover:text-white transition-colors mb-1.5 line-clamp-2 leading-tight">
                            {note.title}
                          </h4>
                          <p className="text-xs text-gray-500 whitespace-nowrap">{formatDate(note.updated_at)}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : !searchQuery && (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#3a4450] border border-gray-600 mb-4">
                  <FileText className="w-10 h-10 text-gray-500" />
                </div>
                <p className="text-gray-400 mb-2">No notes yet</p>
                <p className="text-sm text-gray-500">Create your first note to get started</p>
              </div>
            )}

            {searchQuery && filteredNotes.length === 0 && filteredFlows.length === 0 && (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#3a4450] border border-gray-600 mb-4">
                  <Search className="w-10 h-10 text-gray-500" />
                </div>
                <p className="text-gray-400 mb-2">No notes or flows found</p>
                <p className="text-sm text-gray-500">Try a different search term</p>
              </div>
            )}
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
