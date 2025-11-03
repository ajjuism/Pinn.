import { useState, useEffect } from 'react';
import HomePage from './components/HomePage';
import EditorPage from './components/EditorPage';
import FlowsPage from './components/FlowsPage';
import FlowPage from './components/FlowPage';
import NotesPage from './components/NotesPage';
import OnboardingDialog from './components/OnboardingDialog';
import { FileText } from 'lucide-react';
import { isFolderConfigured, initializeDirectoryHandle, hasDirectoryAccess } from './lib/fileSystemStorage';
import { initStorage, refreshStorage } from './lib/storage';
import { initFlowStorage, refreshFlowStorage } from './lib/flowStorage';

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'editor' | 'flows' | 'flow' | 'notes'>('home');
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  const [currentFlowId, setCurrentFlowId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                             window.innerWidth < 768;
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize storage and check for onboarding
  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('App initialization started');
        // First, restore directory handle from IndexedDB if configured
        await initializeDirectoryHandle();
        const handleAvailable = hasDirectoryAccess();
        console.log('Directory handle initialization completed, handle available:', handleAvailable);
        
        // Give a tiny delay to ensure handle is fully set
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Initialize storage (will use file system or localStorage)
        await initStorage();
        await initFlowStorage();
        console.log('Storage initialization completed');
        
        // Check if folder is configured
        const folderConfigured = isFolderConfigured();
        if (!folderConfigured) {
          console.log('No folder configured, showing onboarding');
          setShowOnboarding(true);
        } else {
          console.log('Folder is configured');
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, []);

  const handleOnboardingComplete = async () => {
    // Refresh storage to ensure it uses the file system
    await refreshStorage();
    await refreshFlowStorage();
    setShowOnboarding(false);
  };

  // Check if folder was removed (will trigger onboarding again)
  useEffect(() => {
    if (!isInitializing && !showOnboarding) {
      const folderConfigured = isFolderConfigured();
      if (!folderConfigured && !isMobile) {
        // Folder was removed, show onboarding
        setShowOnboarding(true);
      }
    }
  }, [isInitializing, showOnboarding, isMobile]);

  const navigateToHome = () => {
    setCurrentView('home');
    setCurrentNoteId(null);
    setCurrentFlowId(null);
  };

  const navigateToEditor = (noteId?: string) => {
    setCurrentNoteId(noteId || null);
    setCurrentView('editor');
    setCurrentFlowId(null);
  };

  const navigateToFlows = () => {
    setCurrentView('flows');
    setCurrentNoteId(null);
    setCurrentFlowId(null);
  };

  const navigateToNotes = () => {
    setCurrentView('notes');
    setCurrentNoteId(null);
    setCurrentFlowId(null);
  };

  const navigateToFlow = (flowId?: string) => {
    setCurrentFlowId(flowId || null);
    setCurrentView('flow');
    setCurrentNoteId(null);
  };

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#2c3440] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  // Mobile Warning Overlay - blocks all access on mobile
  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#2c3440] flex items-center justify-center px-4 py-8">
        <div className="bg-[#2c3440] rounded-xl shadow-2xl max-w-sm w-full p-6 sm:p-8 border border-gray-700/80 text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#6366F1]/10 flex items-center justify-center mx-auto mb-5 sm:mb-6 border border-[#6366F1]/20">
            <FileText className="w-7 h-7 sm:w-8 sm:h-8 text-[#6366F1]" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-200 mb-3 sm:mb-4 leading-tight">
            Desktop Experience Required
          </h2>
          <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6 leading-relaxed px-1">
            This application is optimized for desktop use. Please access it from a desktop or laptop for the best experience.
          </p>
          <div className="space-y-2 sm:space-y-2.5 pt-3 border-t border-gray-700/50">
            <div className="flex items-start gap-2 text-left">
              <span className="text-[#6366F1] mt-0.5 flex-shrink-0">•</span>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                Keyboard shortcuts for navigation
              </p>
            </div>
            <div className="flex items-start gap-2 text-left">
              <span className="text-[#6366F1] mt-0.5 flex-shrink-0">•</span>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                Precise mouse interactions
              </p>
            </div>
            <div className="flex items-start gap-2 text-left">
              <span className="text-[#6366F1] mt-0.5 flex-shrink-0">•</span>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                Larger screen for optimal viewing
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2c3440] text-gray-300">
      {showOnboarding ? (
        <OnboardingDialog onComplete={handleOnboardingComplete} />
      ) : (
        <>
          {currentView === 'home' ? (
            <HomePage onNavigateToEditor={navigateToEditor} onNavigateToFlows={navigateToFlows} onNavigateToFlow={navigateToFlow} onNavigateToNotes={navigateToNotes} />
          ) : currentView === 'editor' ? (
            <EditorPage noteId={currentNoteId} onNavigateToHome={navigateToHome} onNavigateToFlows={navigateToFlows} onNavigateToNotes={navigateToNotes} />
          ) : currentView === 'flows' ? (
            <FlowsPage onNavigateToFlow={navigateToFlow} onNavigateToHome={navigateToHome} onNavigateToNotes={navigateToNotes} />
          ) : currentView === 'notes' ? (
            <NotesPage onNavigateToEditor={navigateToEditor} onNavigateToHome={navigateToHome} onNavigateToFlows={navigateToFlows} />
          ) : (
            <FlowPage flowId={currentFlowId} onNavigateToHome={navigateToHome} onNavigateToEditor={navigateToEditor} onNavigateToFlows={navigateToFlows} onNavigateToNotes={navigateToNotes} />
          )}
        </>
      )}
    </div>
  );
}

export default App;
