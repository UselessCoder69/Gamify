// This declaration file expands the global Window interface to include the
// `aistudio` object injected by the hosting environment. This prevents
// TypeScript errors when accessing `window.aistudio`.

interface Window {
  aistudio?: {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  };
}
