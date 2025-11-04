import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Menu as MenuIcon, Download, Trash2, ChevronLeft, Book, Settings } from 'lucide-react';
import { getFlows, Flow, deleteFlow } from '../lib/flowStorage';
import ConfirmDialog from './ConfirmDialog';
import SettingsDialog from './SettingsDialog';

interface FlowsPageProps {
  onNavigateToFlow: (flowId?: string) => void;
  onNavigateToHome: () => void;
  onNavigateToNotes: () => void;
}

export default function FlowsPage({ onNavigateToFlow, onNavigateToHome, onNavigateToNotes }: FlowsPageProps) {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [filteredFlows, setFilteredFlows] = useState<Flow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'date'>('date');
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [flowToDelete, setFlowToDelete] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadFlows();
    
    // Listen for storage refresh events (e.g., after folder restore)
    const handleStorageRefresh = () => {
      loadFlows();
    };
    
    window.addEventListener('storage-refresh', handleStorageRefresh);
    
    return () => {
      window.removeEventListener('storage-refresh', handleStorageRefresh);
    };
  }, []);

  useEffect(() => {
    filterAndSortFlows();
  }, [flows, searchQuery, sortBy]);

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

  const loadFlows = () => {
    try {
      const data = getFlows();
      setFlows(data || []);
    } catch (error) {
      console.error('Error loading flows:', error);
    } finally {
      setLoading(false);
    }
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
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
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

  const handleNewFlow = () => {
    onNavigateToFlow();
  };

  const handleDeleteFlow = (flowId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFlowToDelete(flowId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteFlow = () => {
    if (flowToDelete) {
      deleteFlow(flowToDelete);
      loadFlows();
      setFlowToDelete(null);
    }
  };

  const handleExportAll = () => {
    const allFlows = getFlows();
    const blob = new Blob([JSON.stringify(allFlows, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pinn-flows-export.json';
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
    flows.forEach((flow) => deleteFlow(flow.id));
    setFlows([]);
    setFilteredFlows([]);
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
          <h1 className="text-xl font-light text-gray-300">Flows</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleNewFlow}
            className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New Flow</span>
          </button>
          <button
            onClick={onNavigateToNotes}
            className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            <Book className="w-5 h-5" />
            <span>Notes</span>
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
                    <span>Export All Flows</span>
                  </button>
                  <div className="border-t border-gray-600 my-1" />
                  <button
                    onClick={handleClearAll}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-red-400 hover:bg-[#2c3440] hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear All Flows</span>
                  </button>
                  <div className="border-t border-gray-600 my-1" />
                  <button
                    onClick={() => {
                      setShowSettingsDialog(true);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-gray-300 hover:bg-[#2c3440] hover:text-white transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
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
            placeholder="Search flows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#3a4450] border border-gray-600 rounded-lg pl-12 pr-4 py-3 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-gray-500 transition-colors"
          />
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading flows...</div>
        ) : filteredFlows.length > 0 ? (
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
              {filteredFlows.map((flow) => (
                <div
                  key={flow.id}
                  className="group relative bg-[#3a4450] rounded-lg p-4 hover:bg-[#424d5a] transition-colors cursor-pointer"
                  onClick={() => onNavigateToFlow(flow.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg text-gray-300 group-hover:text-white transition-colors mb-2">
                        {flow.title}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                        <span>{formatDate(flow.updated_at)}</span>
                        <span>{flow.nodes.length} node{flow.nodes.length !== 1 ? 's' : ''}</span>
                        <span>{flow.edges.length} connection{flow.edges.length !== 1 ? 's' : ''}</span>
                      </div>
                      {flow.tags && flow.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {flow.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-[#2c3440] text-gray-400 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleDeleteFlow(flow.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 hover:bg-[#2c3440] rounded transition-all"
                      title="Delete flow"
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
            {searchQuery ? 'No flows found' : 'No flows yet. Create your first flow!'}
          </div>
        )}
      </main>

      <button
        onClick={handleNewFlow}
        className="fixed bottom-8 right-8 w-14 h-14 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center shadow-lg transition-colors"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setFlowToDelete(null);
        }}
        onConfirm={confirmDeleteFlow}
        title="Delete Flow"
        message="Are you sure you want to delete this flow? This cannot be undone."
        confirmText="Delete"
      />

      <ConfirmDialog
        isOpen={showClearAllConfirm}
        onClose={() => setShowClearAllConfirm(false)}
        onConfirm={confirmClearAll}
        title="Delete All Flows"
        message="Are you sure you want to delete all flows? This cannot be undone."
        confirmText="Delete All"
      />

      <SettingsDialog
        isOpen={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
      />
    </div>
  );
}

