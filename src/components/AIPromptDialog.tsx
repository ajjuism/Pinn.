import { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Loader2, Send } from 'lucide-react';
import { getGeminiApiKey } from '../lib/geminiStorage';

interface AIPromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (text: string, isReplace: boolean, startPos?: number, endPos?: number) => void;
  selectedText?: string;
  selectionStart?: number;
  selectionEnd?: number;
  onOpenSettings?: () => void;
}

export default function AIPromptDialog({ 
  isOpen, 
  onClose, 
  onGenerate,
  selectedText,
  selectionStart,
  selectionEnd,
  onOpenSettings
}: AIPromptDialogProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasSelection = selectedText && selectedText.trim().length > 0;

  useEffect(() => {
    if (isOpen) {
      setPrompt('');
      setError(null);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const tryGenerateWithModel = async (apiKey: string, fullPrompt: string, modelName: string): Promise<string> => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: fullPrompt
            }]
          }]
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from API');
    }

    return data.candidates[0].content.parts[0].text;
  };

  const listAvailableModels = async (apiKey: string): Promise<string[]> => {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      if (data.models && Array.isArray(data.models)) {
        return data.models
          .filter((model: any) => 
            model.name && 
            model.supportedGenerationMethods?.includes('generateContent')
          )
          .map((model: any) => model.name.replace('models/', ''))
          .sort((a: string, b: string) => {
            // Prefer flash models (faster) and newer versions
            const aIsFlash = a.includes('flash');
            const bIsFlash = b.includes('flash');
            if (aIsFlash && !bIsFlash) return -1;
            if (!aIsFlash && bIsFlash) return 1;
            return b.localeCompare(a); // Newer versions first
          });
      }
      return [];
    } catch {
      return [];
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      setError('Please set your Gemini API key in Settings first');
      if (onOpenSettings) {
        setTimeout(() => {
          onClose();
          onOpenSettings();
        }, 2000);
      }
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Construct the prompt for Gemini
      let fullPrompt = prompt;
      if (hasSelection && selectedText) {
        fullPrompt = `The following text is selected from a document:\n\n"${selectedText}"\n\n${prompt}\n\nPlease analyze and provide a response that should replace this selected text. Only provide the replacement content without additional explanations.`;
      } else {
        fullPrompt = `${prompt}\n\nPlease provide your response in markdown format.`;
      }

      // First, try to list available models
      const availableModels = await listAvailableModels(apiKey);
      
      // Fallback list of common model names to try
      const fallbackModels = [
        'gemini-2.0-flash-exp',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-pro',
      ];

      // Use available models if found, otherwise use fallback list
      const modelsToTry = availableModels.length > 0 ? availableModels : fallbackModels;

      let generatedText: string | null = null;
      let lastError: Error | null = null;

      // Try each model until one works
      for (const modelName of modelsToTry) {
        try {
          generatedText = await tryGenerateWithModel(apiKey, fullPrompt, modelName);
          break; // Success, exit loop
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          // Continue to next model
        }
      }

      if (!generatedText) {
        throw lastError || new Error('No available models found. Please check your API key and try again.');
      }

      if (hasSelection && selectionStart !== undefined && selectionEnd !== undefined) {
        onGenerate(generatedText, true, selectionStart, selectionEnd);
      } else {
        onGenerate(generatedText, false);
      }

      onClose();
    } catch (err) {
      console.error('Error generating content:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate content. Please check your API key and try again.';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[#2c3440] rounded-xl shadow-2xl w-full max-w-2xl border border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#6366F1]/20 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#6366F1]" />
              </div>
              <h2 className="text-xl font-semibold text-gray-200">AI Assistant</h2>
            </div>
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="text-gray-400 hover:text-white hover:bg-[#3a4450] rounded-lg p-1.5 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-6 py-6 space-y-4">
          {hasSelection && selectedText && (
            <div className="bg-[#1f2833] border border-gray-700 rounded-lg p-4">
              <div className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Selected Text</div>
              <div className="text-sm text-gray-300 bg-[#2c3440] rounded p-3 max-h-32 overflow-y-auto font-mono">
                {selectedText.length > 200 ? `${selectedText.substring(0, 200)}...` : selectedText}
              </div>
              <div className="text-xs text-gray-500 mt-2">The AI will analyze and replace this selection.</div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              {hasSelection ? 'What would you like the AI to do with the selected text?' : 'What would you like to generate?'}
            </label>
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={hasSelection ? "e.g., Improve this section, rewrite it more clearly, expand on this idea..." : "e.g., Write a blog post about React hooks, Create a summary of best practices..."}
              className="w-full bg-[#1f2833] border border-gray-700 rounded-lg px-4 py-3 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent transition-all resize-none"
              rows={6}
              disabled={isGenerating}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-sm text-red-400">{error}</p>
              {error.includes('API key') && onOpenSettings && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenSettings();
                  }}
                  className="mt-2 text-xs text-[#6366F1] hover:underline"
                >
                  Open Settings →
                </button>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-700">
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-[#3a4450] rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="px-5 py-2.5 text-sm font-medium bg-[#6366F1] hover:bg-[#5b5bf5] text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#6366F1] shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Generate
                </>
              )}
            </button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            Press <kbd className="px-2 py-1 bg-[#1f2833] border border-gray-700 rounded">⌘</kbd> + <kbd className="px-2 py-1 bg-[#1f2833] border border-gray-700 rounded">Enter</kbd> to generate
          </div>
        </div>
      </div>
    </div>
  );
}

