import { 
  readFlowsFromFile, 
  writeFlowsToFile,
  isFolderConfigured,
  hasDirectoryAccess 
} from './fileSystemStorage';

export interface FlowNode {
  id: string;
  noteId: string;
  position: { x: number; y: number };
  data: {
    label: string;
    color?: string;
    tags?: string[];
    completed?: boolean;
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  color?: string;
}

export interface Flow {
  id: string;
  title: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  tags?: string[];
  created_at: string;
  updated_at: string;
}

// In-memory cache
let flowsCache: Flow[] | null = null;
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

// Fallback to localStorage if file system is not configured
const STORAGE_KEY = 'pinn.flows';

/**
 * Initialize flows storage - load data from file system or localStorage
 */
async function initialize(): Promise<void> {
  if (isInitialized) return;
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    try {
      const folderConfigured = isFolderConfigured();
      let hasAccess = hasDirectoryAccess();
      console.log('Flows storage initialization:', { folderConfigured, hasAccess });
      
      // If folder is configured but handle isn't available, try to restore it
      if (folderConfigured && !hasAccess) {
        console.log('Flows storage initialization: Folder configured but handle not available, attempting to restore...');
        const { initializeDirectoryHandle } = await import('./fileSystemStorage');
        await initializeDirectoryHandle();
        hasAccess = hasDirectoryAccess();
        console.log('Flows storage initialization: After handle restoration attempt, hasAccess:', hasAccess);
      }
      
      if (folderConfigured && hasAccess) {
        // Load from file system
        console.log('Loading flows from file system...');
        const loadedFlows = await readFlowsFromFile();
        
        // Only update cache if we got valid data (array, even if empty)
        if (Array.isArray(loadedFlows)) {
          flowsCache = loadedFlows;
        } else {
          console.warn('Invalid flows data loaded, keeping existing cache or empty array');
          flowsCache = flowsCache || [];
        }
        
        console.log(`Initialized flows storage: ${flowsCache.length} flows`);
      } else {
        console.log('Using localStorage fallback for flows (folder configured:', folderConfigured, ', has access:', hasAccess, ')');
        // Fallback to localStorage
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            flowsCache = Array.isArray(parsed) ? parsed as Flow[] : [];
          } else {
            flowsCache = [];
          }
        } catch {
          flowsCache = [];
        }
        console.log(`Initialized flows storage from localStorage: ${flowsCache.length} flows`);
      }
    } catch (error) {
      console.error('Error initializing flows storage:', error);
      flowsCache = [];
    }
    isInitialized = true;
  })();

  return initializationPromise;
}

/**
 * Write flows to storage (file system or localStorage) - internal async version
 */
async function writeAllAsync(flows: Flow[]): Promise<void> {
  flowsCache = flows;
  
  try {
    const folderConfigured = isFolderConfigured();
    const hasAccess = hasDirectoryAccess();
    
    console.log('Writing flows:', { count: flows.length, folderConfigured, hasAccess });
    
    if (folderConfigured) {
      // If folder is configured, we MUST use file system
      if (hasAccess) {
        console.log('Writing flows to file system...');
        await writeFlowsToFile(flows);
        console.log('Successfully wrote flows to file system');
      } else {
        // Try to restore the handle
        console.warn('Folder configured but handle not available. Attempting to restore...');
        const { initializeDirectoryHandle } = await import('./fileSystemStorage');
        await initializeDirectoryHandle();
        
        if (hasDirectoryAccess()) {
          console.log('Handle restored, writing to file system...');
          await writeFlowsToFile(flows);
          console.log('Successfully wrote flows to file system after handle restoration');
        } else {
          console.error('ERROR: Folder is configured but cannot access directory handle! Data not persisted.');
          localStorage.setItem(STORAGE_KEY, JSON.stringify(flows));
          console.warn('Wrote to localStorage as fallback - this should not happen if folder is configured!');
        }
      }
    } else {
      // No folder configured, use localStorage
      console.log('No folder configured, writing to localStorage');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(flows));
    }
  } catch (error) {
    console.error('Error writing flows:', error);
    // Try localStorage as backup
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(flows));
      console.warn('Wrote to localStorage as backup due to error');
    } catch (localError) {
      console.error('Failed to write to localStorage backup:', localError);
    }
  }
}

/**
 * Read all flows from cache (synchronous)
 */
function readAll(): Flow[] {
  if (!isInitialized) {
    // Synchronous fallback - initialize will happen async
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed as Flow[] : [];
      }
    } catch {
      // ignore
    }
    return [];
  }
  return flowsCache || [];
}

/**
 * Initialize flows storage (call this on app startup)
 */
export async function initFlowStorage(): Promise<void> {
  await initialize();
}

/**
 * Refresh flows storage from file system (useful after changing folder)
 */
export async function refreshFlowStorage(): Promise<void> {
  isInitialized = false;
  initializationPromise = null;
  await initialize();
}

// Synchronous wrapper for backward compatibility (non-blocking write)
export function writeAll(flows: Flow[]): void {
  flowsCache = flows;
  writeAllAsync(flows).catch(console.error);
}

export function getFlows(): Flow[] {
  return readAll();
}

export function getFlowById(id: string): Flow | null {
  return readAll().find((f) => f.id === id) || null;
}

export function saveFlow(flow: Flow): Flow {
  const all = readAll();
  const index = all.findIndex((f) => f.id === flow.id);
  const next: Flow = { ...flow, updated_at: new Date().toISOString() };
  if (index >= 0) {
    all[index] = next;
  } else {
    all.unshift(next);
  }
  writeAll(all); // Non-blocking async write
  return next;
}

export function createFlow(title: string): Flow {
  const now = new Date().toISOString();
  const flow: Flow = {
    id: crypto.randomUUID(),
    title: title || 'Untitled Flow',
    nodes: [],
    edges: [],
    tags: [],
    created_at: now,
    updated_at: now,
  };
  const all = readAll();
  all.unshift(flow);
  writeAll(all); // Non-blocking async write
  return flow;
}

export function deleteFlow(id: string): void {
  const all = readAll().filter((f) => f.id !== id);
  writeAll(all); // Non-blocking async write
}

export function addNoteToFlow(flowId: string, noteId: string, noteTitle: string, position?: { x: number; y: number }): Flow | null {
  const flow = getFlowById(flowId);
  if (!flow) return null;

  // Check if note already exists in flow
  const existingNode = flow.nodes.find((n) => n.noteId === noteId);
  if (existingNode) return flow;

  const newNode: FlowNode = {
    id: `node-${noteId}-${Date.now()}`,
    noteId,
    position: position || { x: Math.random() * 400, y: Math.random() * 400 },
    data: {
      label: noteTitle,
      color: '#e8935f',
    },
  };

  flow.nodes.push(newNode);
  return saveFlow(flow);
}

export function removeNodeFromFlow(flowId: string, nodeId: string): Flow | null {
  const flow = getFlowById(flowId);
  if (!flow) return null;

  flow.nodes = flow.nodes.filter((n) => n.id !== nodeId);
  flow.edges = flow.edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
  return saveFlow(flow);
}

/**
 * Check if a note is used as a node in any flow
 * Returns an array of flows that contain this note
 */
export function getFlowsContainingNote(noteId: string): Array<{ flowId: string; flowTitle: string }> {
  const allFlows = readAll();
  const flowsContainingNote: Array<{ flowId: string; flowTitle: string }> = [];
  
  for (const flow of allFlows) {
    const node = flow.nodes.find((n) => n.noteId === noteId);
    if (node) {
      flowsContainingNote.push({ flowId: flow.id, flowTitle: flow.title });
    }
  }
  
  return flowsContainingNote;
}
