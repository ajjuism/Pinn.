import { useState } from 'react';
import { Folder, Info, AlertCircle, CheckCircle2, ShieldCheck, HardDrive, Book, ArrowRight } from 'lucide-react';
import { requestDirectoryAccess, setDirectoryHandle, isFileSystemSupported, migrateFromLocalStorage } from '../lib/fileSystemStorage';

interface OnboardingDialogProps {
  onComplete: () => void;
}

export default function OnboardingDialog({ onComplete }: OnboardingDialogProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);

  const handleSelectFolder = async () => {
    if (!isFileSystemSupported()) {
      setError('Your browser does not support the File System Access API. Please use Chrome, Edge, or Opera.');
      return;
    }

    setIsSelecting(true);
    setError(null);

    try {
      const handle = await requestDirectoryAccess('Pinn');
      
      if (!handle) {
        // User cancelled
        setIsSelecting(false);
        return;
      }

      // Set the directory handle (async now)
      await setDirectoryHandle(handle, handle.name);

      // Check if there's data in localStorage to migrate
      const hasNotes = localStorage.getItem('pinn.notes');
      const hasFlows = localStorage.getItem('pinn.flows');
      
      if (hasNotes || hasFlows) {
        setIsMigrating(true);
        try {
          const result = await migrateFromLocalStorage();
          setMigrationComplete(true);
          
          // Clear localStorage after successful migration
          if (result.notesMigrated > 0 || result.flowsMigrated > 0) {
            localStorage.removeItem('pinn.notes');
            localStorage.removeItem('pinn.flows');
            localStorage.removeItem('pinn.folders');
          }
        } catch (migrationError: any) {
          console.error('Migration error:', migrationError);
          setError(`Migration failed: ${migrationError.message}. Your data is still in browser storage.`);
          setIsMigrating(false);
          return;
        }
      }

      // Wait a moment to show success message
      setTimeout(() => {
        onComplete();
      }, migrationComplete ? 1500 : 500);
    } catch (err: any) {
      console.error('Error selecting folder:', err);
      setError(err.message || 'Failed to select folder. Please try again.');
      setIsSelecting(false);
    }
  };

  if (!isFileSystemSupported()) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-[#2c3440] rounded-xl shadow-2xl w-full max-w-2xl border border-gray-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-200">Browser Not Supported</h2>
            </div>
          </div>
          <div className="px-6 py-6">
            <p className="text-gray-300 mb-4">
              The File System Access API is required for this feature. Please use one of the following browsers:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-400 mb-6">
              <li>Google Chrome (recommended)</li>
              <li>Microsoft Edge</li>
              <li>Opera</li>
            </ul>
            <p className="text-sm text-gray-500">
              Note: This feature is not available in Firefox or Safari. You can continue using browser storage by closing this dialog, but file system storage won't be available.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#2c3440] rounded-xl shadow-2xl w-full max-w-3xl border border-gray-700 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-700">
          <div>
            <span className="inline-flex items-center rounded-md bg-[#3a4450] border border-gray-700 px-2 py-0.5 text-[11px] text-gray-300 mb-2">Welcome to Pinn.</span>
            <h2 className="text-xl font-semibold text-gray-200">Choose your workspace folder</h2>
            <p className="text-sm text-gray-400 mt-1">All adds, edits, and deletes will happen inside this folder.</p>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#3a4450] border border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2 text-gray-300">
                <HardDrive className="w-4 h-4 text-[#6366F1]" />
                <span className="text-sm font-medium">Local-first</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">Notes and flows are saved as files in your folder. No cloud, fully offline.</p>
            </div>
            <div className="bg-[#3a4450] border border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2 text-gray-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium">Private by design</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">Data never leaves your device. You control the files and where they live.</p>
            </div>
            <div className="bg-[#3a4450] border border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2 text-gray-300">
                <Book className="w-4 h-4 text-[#e8935f]" />
                <span className="text-sm font-medium">Simple files</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">We use readable JSON/Markdown. You can back up or version them easily.</p>
            </div>
          </div>

          <div className="bg-[#1f2833] border border-gray-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-[#6366F1] flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-300 leading-relaxed">
                <p className="mb-2">When you press Select Folder, your browser will show a permission dialog asking you to allow this site to edit files in the folder you pick.</p>
                <div className="mt-3 rounded-lg border border-gray-700 bg-[#2c3440] px-3 py-2 text-xs text-gray-400">
                  <div className="flex items-center">
                    <span className="opacity-80">Example prompt:</span>
                    <div className="ml-2 inline-flex items-center gap-2 rounded-md bg-[#3a4450] px-3 py-1.5 border border-gray-700">
                      <span className="text-gray-300">Allow this site to edit files?</span>
                      <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-sky-500/20 text-sky-300 px-2 py-0.5 text-[11px]">
                        <span>Allow</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {isMigrating && (
            <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4 flex items-start gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400 flex-shrink-0 mt-0.5"></div>
              <p className="text-sm text-blue-400">Migrating your existing data from browser storage to the selected folder…</p>
            </div>
          )}

          {migrationComplete && (
            <div className="bg-emerald-500/10 border border-emerald-500/50 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-400">Successfully migrated your data. You're all set!</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-gray-700">
            <div className="text-xs text-gray-500">
              Recommended location: <span className="text-gray-400">Documents/Pinn</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSelectFolder}
                disabled={isSelecting || isMigrating}
                className="px-5 py-2.5 text-sm font-medium bg-[#6366F1] hover:bg-[#5b5bf5] text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#6366F1] shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                {isSelecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Selecting…</span>
                  </>
                ) : isMigrating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Migrating…</span>
                  </>
                ) : (
                  <>
                    <Folder className="w-4 h-4" />
                    <span>Select Folder</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

