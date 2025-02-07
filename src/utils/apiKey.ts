const API_KEY_STORAGE_KEY = 'gemini_api_key';

export const saveApiKey = (apiKey: string) => {
  localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
};

export const getApiKey = () => {
  return localStorage.getItem(API_KEY_STORAGE_KEY);
};

export const removeApiKey = () => {
  localStorage.removeItem(API_KEY_STORAGE_KEY);
};