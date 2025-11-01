const GEMINI_API_KEY_STORAGE_KEY = 'pinn.gemini_api_key';

export function getGeminiApiKey(): string | null {
  try {
    return localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveGeminiApiKey(apiKey: string): void {
  try {
    localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, apiKey);
  } catch (error) {
    console.error('Error saving Gemini API key:', error);
  }
}

export function deleteGeminiApiKey(): void {
  try {
    localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
  } catch (error) {
    console.error('Error deleting Gemini API key:', error);
  }
}

