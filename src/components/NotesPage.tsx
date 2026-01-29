import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import {
  Plus,
  Search,
  Trash2,
  Grid,
  List as ListIcon,
  MoreVertical,
  Calendar,
  FolderOpen,
  Folder,
  Upload,
  Download,
  MoreHorizontal,
  Network,
  Book,
} from 'lucide-react';
import { getNotes, deleteNote, getAllFolders, createNote } from '../lib/storage';
import { useDebounce } from '../hooks/useDebounce';
import { formatDate } from '../utils/date';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Toggle } from './ui/toggle';
import ConfirmDialog from './ConfirmDialog';
import GraphViewDialog from './GraphViewDialog';

export default function NotesPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/notes' });

  const [notes, setNotes] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showGraphView, setShowGraphView] = useState(false);
  const [searchQuery, setSearchQuery] = useState((search as { search?: string })?.search || '');
  const [sortBy] = useState<'title' | 'date'>(
    (search as { sort?: 'title' | 'date' })?.sort || 'date'
  );
  const [selectedFolder, setSelectedFolder] = useState<string>(
    (search as { folder?: string })?.folder || 'All'
  );
  const [folders, setFolders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadNotes = () => {
    try {
      const data = getNotes();
      setNotes(data || []);
      setFolders(['All', 'Unfiled', ...getAllFolders()]);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
    const handleStorageRefresh = () => loadNotes();
    window.addEventListener('storage-refresh', handleStorageRefresh);
    return () => window.removeEventListener('storage-refresh', handleStorageRefresh);
  }, []);

  const debouncedSearchQuery = useDebounce(searchQuery);

  const filteredNotes = useMemo(() => {
    let filtered = notes;

    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = notes.filter(
        note =>
          note.title.toLowerCase().includes(query) || note.content?.toLowerCase().includes(query)
      );
    }

    if (selectedFolder && selectedFolder !== 'All') {
      if (selectedFolder === 'Unfiled') {
        filtered = filtered.filter(n => !n.folder || !n.folder.trim());
      } else {
        filtered = filtered.filter(n => (n.folder || '').trim() === selectedFolder);
      }
    }

    return [...filtered].sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [notes, debouncedSearchQuery, selectedFolder, sortBy]);

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNoteToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (noteToDelete) {
      await deleteNote(noteToDelete);
      loadNotes();
      setNoteToDelete(null);
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    let importedCount = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const text = await file.text();
        if (file.type === 'application/json' || file.name.endsWith('.json')) {
          try {
            const jsonData = JSON.parse(text);
            if (Array.isArray(jsonData)) {
              jsonData.forEach(note => {
                if (note.title || note.content) {
                  createNote(note.title || 'Untitled', note.content || '');
                  importedCount++;
                }
              });
            } else if (jsonData.title || jsonData.content) {
              createNote(jsonData.title || 'Untitled', jsonData.content || '');
              importedCount++;
            }
          } catch (e) {
            console.error('Invalid JSON file', e);
          }
        } else {
          const title = file.name.replace(/\.[^/.]+$/, '');
          createNote(title, text);
          importedCount++;
        }
      } catch (error) {
        console.error('Error reading file:', error);
      }
    }
    if (importedCount > 0) {
      loadNotes();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExportAll = () => {
    const allNotes = getNotes();
    const blob = new Blob([JSON.stringify(allNotes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pinn-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sortedFolders = folders.filter(f => f !== 'All' && f !== 'Unfiled').sort((a, b) => a.localeCompare(b));

  return (
    <div className="h-full bg-theme-bg-primary flex flex-col overflow-hidden">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
        accept=".json,.md,.txt"
      />
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Sidebar */}
        <aside className="bg-theme-bg-primary border-r border-theme-border w-[280px] min-w-[200px] flex-shrink-0 h-full flex flex-col">
          <div className="flex-shrink-0 p-4 space-y-2 bg-theme-bg-primary">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-theme-bg-secondary border border-theme-border rounded-lg pl-9 pr-3 py-2 text-sm text-theme-text-primary placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors"
              />
            </div>

            {/* All Notes */}
            <div className="mb-2">
              <button
                onClick={() => setSelectedFolder('All')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedFolder === 'All'
                    ? 'bg-theme-bg-secondary text-theme-text-primary'
                    : 'text-theme-text-secondary hover:bg-theme-bg-secondary hover:text-theme-text-primary'
                }`}
              >
                <Book className="w-4 h-4" />
                <span className="flex-1 text-left">All Notes</span>
                <span className="text-xs text-gray-600">{notes.length}</span>
              </button>
            </div>

            {/* Unfiled */}
            <div className="mb-2">
              <button
                onClick={() => setSelectedFolder('Unfiled')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedFolder === 'Unfiled'
                    ? 'bg-theme-bg-secondary text-white'
                    : 'text-theme-text-secondary hover:bg-theme-bg-secondary hover:text-theme-text-primary'
                }`}
              >
                <Folder className="w-4 h-4" />
                <span className="flex-1 text-left">Unfiled</span>
              </button>
            </div>

            {/* Folders Header */}
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Folders
              </span>
            </div>
          </div>

          {/* Scrollable Folders List */}
          <div
             className="flex-1 overflow-y-auto px-4 pb-4"
             style={{
               scrollbarWidth: 'none',
               msOverflowStyle: 'none',
             }}
          >
             <div className="space-y-1">
                {sortedFolders.length === 0 && (
                  <div className="px-3 pb-2 text-xs text-gray-500">No folders yet</div>
                )}
                {sortedFolders.map(folder => (
                  <button
                    key={folder}
                    onClick={() => setSelectedFolder(folder)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedFolder === folder
                        ? 'bg-theme-bg-secondary text-white'
                        : 'text-theme-text-secondary hover:bg-theme-bg-secondary hover:text-theme-text-primary'
                    }`}
                  >
                    {selectedFolder === folder ? (
                      <FolderOpen className="w-4 h-4" />
                    ) : (
                      <Folder className="w-4 h-4" />
                    )}
                    <span className="flex-1 text-left truncate">{folder}</span>
                  </button>
                ))}
             </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 h-full flex flex-col">
          {/* Toolbar */}
          <div className="flex-shrink-0 bg-theme-bg-primary border-b border-theme-border px-6 py-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center max-w-7xl mx-auto w-full">
               <div className="flex items-center gap-2">
                 <h3 className="text-sm uppercase tracking-wider text-gray-500">
                    {selectedFolder === 'All' ? 'All Notes' : selectedFolder === 'Unfiled' ? 'Unfiled Notes' : selectedFolder}
                 </h3>
                 <span className="text-muted-foreground text-sm">({filteredNotes.length})</span>
               </div>

               <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                 <div className="flex items-center border rounded-md bg-background border-theme-border">
                    <Toggle
                      pressed={viewMode === 'grid'}
                      onPressedChange={() => setViewMode('grid')}
                      className="rounded-r-none border-r border-theme-border text-gray-400 data-[state=on]:bg-theme-bg-secondary data-[state=on]:text-theme-text-primary"
                      aria-label="Grid view"
                    >
                      <Grid className="h-4 w-4" />
                    </Toggle>
                    <Toggle
                      pressed={viewMode === 'list'}
                      onPressedChange={() => setViewMode('list')}
                      className="rounded-l-none text-gray-400 data-[state=on]:bg-theme-bg-secondary data-[state=on]:text-theme-text-primary"
                      aria-label="List view"
                    >
                      <ListIcon className="h-4 w-4" />
                    </Toggle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowGraphView(true)}
                      className="rounded-l-none border-l border-theme-border text-gray-400 hover:text-theme-text-primary hover:bg-theme-bg-secondary"
                      title="Graph View"
                    >
                      <Network className="h-4 w-4" />
                    </Button>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="border-theme-border bg-transparent hover:bg-theme-bg-secondary">
                        <MoreHorizontal className="h-4 w-4 text-theme-text-secondary" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-theme-bg-secondary border-theme-border">
                      <DropdownMenuItem onClick={handleImportClick} className="focus:bg-theme-bg-tertiary focus:text-theme-text-primary">
                        <Upload className="mr-2 h-4 w-4" /> Import Notes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportAll} className="focus:bg-theme-bg-tertiary focus:text-theme-text-primary">
                        <Download className="mr-2 h-4 w-4" /> Export All
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button onClick={() => navigate({ to: '/note/new' })}>
                    <Plus className="mr-2 h-4 w-4" /> New Note
                  </Button>
               </div>
            </div>
          </div>

          {/* Content List */}
          <div className="flex-1 overflow-y-auto px-6 py-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="max-w-7xl mx-auto pb-20">
              {loading ? (
                <div className="py-20 text-center text-muted-foreground">Loading notes...</div>
              ) : filteredNotes.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground">
                  {searchQuery
                    ? 'No notes found matching your search.'
                    : 'No notes here yet.'}
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredNotes.map(note => (
                    <Card
                      key={note.id}
                      className="group cursor-pointer hover:shadow-md transition-all border-theme-border bg-theme-bg-secondary hover:border-theme-accent/50"
                      onClick={() => navigate({ to: '/note/$noteId', params: { noteId: note.id } })}
                    >
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start gap-2">
                          <CardTitle className="text-base font-semibold leading-tight line-clamp-2 text-theme-text-primary">
                            {note.title || 'Untitled'}
                          </CardTitle>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-theme-bg-tertiary"
                              >
                                <MoreVertical className="h-3 w-3 text-theme-text-secondary" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-theme-bg-secondary border-theme-border">
                              <DropdownMenuItem
                                className="text-red-400 focus:text-red-400 focus:bg-theme-bg-tertiary"
                                onClick={e => handleDeleteClick(e, note.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <p className="text-sm text-muted-foreground line-clamp-3 h-[4.5em]">
                          {note.content?.replace(/[#*`]/g, '') || 'No content'}
                        </p>
                      </CardContent>
                      <CardFooter className="p-4 pt-0 text-xs text-muted-foreground flex justify-between items-center">
                        <span className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          {formatDate(note.updated_at)}
                        </span>
                        {note.folder && (
                          <span className="bg-theme-bg-primary px-2 py-0.5 rounded text-[10px] font-medium border border-theme-border">
                            {note.folder}
                          </span>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredNotes.map(note => (
                    <div
                      key={note.id}
                      className="group flex items-center justify-between p-3 rounded-lg border border-theme-border bg-theme-bg-secondary hover:bg-theme-bg-tertiary transition-colors cursor-pointer"
                      onClick={() => navigate({ to: '/note/$noteId', params: { noteId: note.id } })}
                    >
                      <div className="flex-1 min-w-0 grid gap-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate text-theme-text-primary">{note.title || 'Untitled'}</h3>
                          {note.folder && (
                            <span className="bg-theme-bg-primary px-2 py-0.5 rounded text-[10px] text-muted-foreground border border-theme-border">
                              {note.folder}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{formatDate(note.updated_at)}</span>
                          <span className="truncate max-w-[300px] opacity-70">
                            {note.content?.slice(0, 50).replace(/\n/g, ' ')}...
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-theme-bg-primary hover:text-red-400"
                        onClick={e => handleDeleteClick(e, note.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <button
        onClick={() => navigate({ to: '/note/new' })}
        className="fixed bottom-8 right-8 w-14 h-14 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center shadow-lg transition-colors z-20"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Note"
        message="Are you sure you want to delete this note? This cannot be undone."
        confirmText="Delete"
      />

      <GraphViewDialog
        isOpen={showGraphView}
        onClose={() => setShowGraphView(false)}
        onNavigateToNote={noteId => navigate({ to: '/note/$noteId', params: { noteId } })}
      />
    </div>
  );
}
