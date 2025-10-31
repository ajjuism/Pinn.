export interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = 'pinn.notes';

function readAll(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Note[];
    return [];
  } catch {
    return [];
  }
}

export function writeAll(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function getNotes(): Note[] {
  return readAll();
}

export function getNoteById(id: string): Note | null {
  return readAll().find((n) => n.id === id) || null;
}

export function saveNote(note: Note): Note {
  const all = readAll();
  const index = all.findIndex((n) => n.id === note.id);
  const next: Note = { ...note, updated_at: new Date().toISOString() };
  if (index >= 0) {
    all[index] = next;
  } else {
    all.unshift(next);
  }
  writeAll(all);
  return next;
}

export function createNote(title: string, content: string): Note {
  const now = new Date().toISOString();
  const note: Note = {
    id: crypto.randomUUID(),
    title: title || 'Untitled',
    content,
    created_at: now,
    updated_at: now,
  };
  const all = readAll();
  all.unshift(note);
  writeAll(all);
  return note;
}

export function deleteNote(id: string) {
  const all = readAll().filter((n) => n.id !== id);
  writeAll(all);
}

