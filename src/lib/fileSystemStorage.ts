/**
 * File System Storage Adapter
 * Uses the File System Access API to store notes, flows, and folders in a user-selected directory
 */

const FOLDER_PATH_KEY = 'pinn.folderPath';
const FOLDER_CONFIGURED_KEY = 'pinn.folderConfigured';
const IDB_NAME = 'pinn-storage';
const IDB_STORE = 'directoryHandle';

// Store the directory handle in memory
let directoryHandle: FileSystemDirectoryHandle | null = null;
let isRestoringHandle = false;

/**
 * Get IndexedDB database
 */
async function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
  });
}

/**
 * Store directory handle in IndexedDB
 */
async function storeHandleInIndexedDB(handle: FileSystemDirectoryHandle): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    await new Promise<void>((resolve, reject) => {
      const request = store.put(handle, 'handle');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error storing directory handle in IndexedDB:', error);
    // Don't throw - this is a non-critical operation
  }
}

/**
 * Restore directory handle from IndexedDB
 */
async function restoreHandleFromIndexedDB(): Promise<FileSystemDirectoryHandle | null> {
  try {
    console.log('restoreHandleFromIndexedDB: Starting...');
    const db = await getDB();
    const tx = db.transaction(IDB_STORE, 'readonly');
    const store = tx.objectStore(IDB_STORE);
    const handle = await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
      const request = store.get('handle');
      request.onsuccess = () => {
        console.log('restoreHandleFromIndexedDB: Handle retrieved from IndexedDB:', !!request.result);
        resolve(request.result || null);
      };
      request.onerror = () => reject(request.error);
    });

    if (!handle) {
      console.log('restoreHandleFromIndexedDB: No handle found in IndexedDB');
      return null;
    }

    console.log('restoreHandleFromIndexedDB: Handle found, checking permission...');
    // Verify permission is still granted
    let permission = await handle.queryPermission({ mode: 'readwrite' });
    console.log('restoreHandleFromIndexedDB: Permission state:', permission);
    
    if (permission === 'granted') {
      console.log('restoreHandleFromIndexedDB: Permission granted, returning handle');
      return handle;
    } else if (permission === 'prompt') {
      // Permission needs to be requested again
      // In some browsers, permission can be in 'prompt' state but still work
      // Try to request it, but don't fail immediately if it doesn't work
      try {
        permission = await handle.requestPermission({ mode: 'readwrite' });
        console.log('restoreHandleFromIndexedDB: After requestPermission, state:', permission);
        if (permission === 'granted') {
          return handle;
        }
      } catch (permError) {
        // requestPermission might fail without user gesture - that's okay
        console.log('restoreHandleFromIndexedDB: Could not request permission automatically (user gesture may be required):', permError);
      }
      
      // Even if permission is 'prompt', try to use the handle
      // Some browsers allow access even when permission state is 'prompt'
      // We'll test actual access by trying to read a file
      try {
        // Try to verify we can actually access the directory
        // by attempting to get the keys (this requires permission)
        const entries: string[] = [];
        for await (const entry of handle.keys()) {
          entries.push(entry);
          break; // Just check if we can iterate, don't need all entries
        }
        console.log('restoreHandleFromIndexedDB: Directory handle verified - can access directory (permission state: prompt, but access works)');
        return handle;
      } catch (accessError: any) {
        // If we can't access, permission was likely revoked
        console.warn('restoreHandleFromIndexedDB: Cannot access directory even though handle exists:', accessError);
        await clearHandleFromIndexedDB();
        return null;
      }
    } else {
      // Permission was denied, remove from IndexedDB
      console.warn('restoreHandleFromIndexedDB: Directory permission was denied');
      await clearHandleFromIndexedDB();
      return null;
    }
  } catch (error) {
    console.error('restoreHandleFromIndexedDB: Error restoring directory handle from IndexedDB:', error);
    return null;
  }
}

/**
 * Clear directory handle from IndexedDB
 */
async function clearHandleFromIndexedDB(): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    await new Promise<void>((resolve, reject) => {
      const request = store.delete('handle');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error clearing directory handle from IndexedDB:', error);
  }
}

export interface DirectoryHandleInfo {
  name: string;
  handle: FileSystemDirectoryHandle;
}

/**
 * Check if File System Access API is supported
 */
export function isFileSystemSupported(): boolean {
  return 'showDirectoryPicker' in window;
}

/**
 * Check if a folder has been configured
 */
export function isFolderConfigured(): boolean {
  return localStorage.getItem(FOLDER_CONFIGURED_KEY) === 'true';
}

/**
 * Verify directory access by checking if we have a handle
 */
export function hasDirectoryAccess(): boolean {
  return directoryHandle !== null;
}

/**
 * Request user to select or create a directory
 * @param defaultName - Suggested default directory name
 */
export async function requestDirectoryAccess(defaultName: string = 'Pinn'): Promise<FileSystemDirectoryHandle | null> {
  try {
    if (!isFileSystemSupported()) {
      throw new Error('File System Access API is not supported in this browser');
    }

    // Request directory access
    const handle = await window.showDirectoryPicker({
      mode: 'readwrite',
    });

    // Store the handle name for display purposes
    localStorage.setItem(FOLDER_PATH_KEY, handle.name);

    // Store directory handle reference
    directoryHandle = handle;

    // Store in IndexedDB for persistence across page reloads
    await storeHandleInIndexedDB(handle);

    return handle;
  } catch (error: any) {
    // User cancelled or error occurred
    if (error.name === 'AbortError') {
      return null;
    }
    console.error('Error requesting directory access:', error);
    throw error;
  }
}

/**
 * Set the directory handle (used after onboarding)
 */
export async function setDirectoryHandle(handle: FileSystemDirectoryHandle, pathName?: string): Promise<void> {
  directoryHandle = handle;
  localStorage.setItem(FOLDER_CONFIGURED_KEY, 'true');
  if (pathName) {
    localStorage.setItem(FOLDER_PATH_KEY, pathName);
  } else {
    localStorage.setItem(FOLDER_PATH_KEY, handle.name);
  }
  // Store in IndexedDB for persistence across page reloads
  await storeHandleInIndexedDB(handle);
}

/**
 * Get the current directory handle
 */
export function getDirectoryHandle(): FileSystemDirectoryHandle | null {
  return directoryHandle;
}

/**
 * Get the stored folder path name (for display)
 */
export function getFolderPath(): string | null {
  return localStorage.getItem(FOLDER_PATH_KEY);
}

/**
 * Clear the directory handle and path
 */
export async function clearDirectoryHandle(): Promise<void> {
  directoryHandle = null;
  localStorage.removeItem(FOLDER_CONFIGURED_KEY);
  localStorage.removeItem(FOLDER_PATH_KEY);
  await clearHandleFromIndexedDB();
}

/**
 * Initialize and restore directory handle from IndexedDB
 * Call this on app startup before other storage operations
 */
export async function initializeDirectoryHandle(): Promise<void> {
  // Only restore if folder is configured
  if (!isFolderConfigured()) {
    console.log('initializeDirectoryHandle: No folder configured, skipping');
    return;
  }

  // If handle is already set, don't restore
  if (directoryHandle) {
    console.log('initializeDirectoryHandle: Handle already exists, skipping');
    return;
  }

  // If already restoring, wait for it to complete
  if (isRestoringHandle) {
    console.log('initializeDirectoryHandle: Already restoring, waiting...');
    // Wait for restoration to complete by polling
    let attempts = 0;
    while (isRestoringHandle && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    if (directoryHandle) {
      console.log('initializeDirectoryHandle: Handle restored by other operation');
      return;
    }
  }

  isRestoringHandle = true;
  console.log('initializeDirectoryHandle: Starting handle restoration...');
  
  try {
    const handle = await restoreHandleFromIndexedDB();
    if (handle) {
      directoryHandle = handle;
      console.log('initializeDirectoryHandle: Directory handle restored from IndexedDB, access available:', hasDirectoryAccess());
    } else {
      console.warn('initializeDirectoryHandle: Failed to restore directory handle - permission may need to be re-granted');
      // If handle couldn't be restored, clear the configured flag so onboarding shows
      localStorage.removeItem(FOLDER_CONFIGURED_KEY);
    }
  } catch (error) {
    console.error('initializeDirectoryHandle: Error initializing directory handle:', error);
    // Clear configured flag on error so user can re-select
    localStorage.removeItem(FOLDER_CONFIGURED_KEY);
  } finally {
    isRestoringHandle = false;
    console.log('initializeDirectoryHandle: Completed, handle available:', hasDirectoryAccess());
  }
}

/**
 * Ensure we have directory access before operations
 */
async function ensureDirectoryAccess(): Promise<FileSystemDirectoryHandle> {
  if (!directoryHandle) {
    throw new Error('No directory selected. Please select a folder in settings.');
  }
  return directoryHandle;
}

/**
 * Read a JSON file from the directory
 */
async function readJSONFile(filename: string): Promise<any> {
  try {
    const handle = await ensureDirectoryAccess();
    console.log(`Reading file ${filename} from directory...`);
    const fileHandle = await handle.getFileHandle(filename, { create: false });
    const file = await fileHandle.getFile();
    const text = await file.text();
    if (!text.trim()) {
      console.log(`File ${filename} exists but is empty`);
      return null;
    }
    const parsed = JSON.parse(text);
    console.log(`Successfully read and parsed ${filename}`);
    return parsed;
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      console.log(`File ${filename} not found in directory`);
      return null;
    }
    console.error(`Error reading file ${filename}:`, error);
    throw error;
  }
}

/**
 * Write a JSON file to the directory
 */
async function writeJSONFile(filename: string, data: any): Promise<void> {
  try {
    const handle = await ensureDirectoryAccess();
    console.log(`Writing file ${filename} to directory...`);
    const fileHandle = await handle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    const jsonString = JSON.stringify(data, null, 2);
    await writable.write(jsonString);
    await writable.close();
    console.log(`Successfully wrote ${filename} (${jsonString.length} bytes)`);
  } catch (error) {
    console.error(`Error writing file ${filename}:`, error);
    throw error;
  }
}

/**
 * Delete a file from the directory
 */
async function deleteFile(filename: string): Promise<void> {
  try {
    const handle = await ensureDirectoryAccess();
    await handle.removeEntry(filename, { recursive: false });
  } catch (error: any) {
    if (error.name !== 'NotFoundError') {
      console.error(`Error deleting file ${filename}:`, error);
      throw error;
    }
  }
}

// Storage operations for notes
export async function readNotesFromFile(): Promise<any[]> {
  try {
    const data = await readJSONFile('notes.json');
    if (data === null) {
      console.log('notes.json not found or empty, returning empty array');
      return [];
    }
    if (!Array.isArray(data)) {
      console.warn('notes.json contains invalid data (not an array), returning empty array');
      return [];
    }
    console.log(`Loaded ${data.length} notes from notes.json`);
    return data;
  } catch (error) {
    console.error('Error reading notes.json:', error);
    return [];
  }
}

export async function writeNotesToFile(notes: any[]): Promise<void> {
  await writeJSONFile('notes.json', notes);
}

export async function readFoldersFromFile(): Promise<string[]> {
  try {
    const data = await readJSONFile('folders.json');
    if (data === null) {
      console.log('folders.json not found or empty, returning empty array');
      return [];
    }
    if (!Array.isArray(data)) {
      console.warn('folders.json contains invalid data (not an array), returning empty array');
      return [];
    }
    const folders = data.filter((x) => typeof x === 'string').map((x) => x.trim()).filter(Boolean);
    console.log(`Loaded ${folders.length} folders from folders.json`);
    return folders;
  } catch (error) {
    console.error('Error reading folders.json:', error);
    return [];
  }
}

export async function writeFoldersToFile(folders: string[]): Promise<void> {
  const unique = Array.from(new Set(folders.map((f) => (f || '').trim()).filter(Boolean)));
  await writeJSONFile('folders.json', unique);
}

// Storage operations for flows
export async function readFlowsFromFile(): Promise<any[]> {
  try {
    const data = await readJSONFile('flows.json');
    if (data === null) {
      console.log('flows.json not found or empty, returning empty array');
      return [];
    }
    if (!Array.isArray(data)) {
      console.warn('flows.json contains invalid data (not an array), returning empty array');
      return [];
    }
    console.log(`Loaded ${data.length} flows from flows.json`);
    return data;
  } catch (error) {
    console.error('Error reading flows.json:', error);
    return [];
  }
}

export async function writeFlowsToFile(flows: any[]): Promise<void> {
  await writeJSONFile('flows.json', flows);
}

/**
 * Migrate data from localStorage to file system
 */
export async function migrateFromLocalStorage(): Promise<{ notesMigrated: number; flowsMigrated: number }> {
  const handle = await ensureDirectoryAccess();
  
  let notesMigrated = 0;
  let flowsMigrated = 0;

  try {
    // Migrate notes
    const notesData = localStorage.getItem('pinn.notes');
    if (notesData) {
      const notes = JSON.parse(notesData);
      if (Array.isArray(notes) && notes.length > 0) {
        await writeNotesToFile(notes);
        notesMigrated = notes.length;
      }
    }

    // Migrate flows
    const flowsData = localStorage.getItem('pinn.flows');
    if (flowsData) {
      const flows = JSON.parse(flowsData);
      if (Array.isArray(flows) && flows.length > 0) {
        await writeFlowsToFile(flows);
        flowsMigrated = flows.length;
      }
    }

    // Migrate folders
    const foldersData = localStorage.getItem('pinn.folders');
    if (foldersData) {
      const folders = JSON.parse(foldersData);
      if (Array.isArray(folders) && folders.length > 0) {
        await writeFoldersToFile(folders);
      }
    }
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }

  return { notesMigrated, flowsMigrated };
}

