/**
 * Thin wrapper around chrome.storage.local.
 * Falls back to an in-memory store if chrome.storage isn't available
 * (e.g. if newtab.html is opened directly as a plain file for preview),
 * so the page never throws — it just won't persist in that case.
 */
const Store = (() => {
  const hasChromeStorage = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
  const memoryFallback = {};

  function get(key, fallback) {
    return new Promise((resolve) => {
      if (hasChromeStorage) {
        chrome.storage.local.get([key], (result) => {
          resolve(result[key] !== undefined ? result[key] : fallback);
        });
      } else {
        resolve(key in memoryFallback ? memoryFallback[key] : fallback);
      }
    });
  }

  function set(key, value) {
    return new Promise((resolve) => {
      if (hasChromeStorage) {
        chrome.storage.local.set({ [key]: value }, () => resolve());
      } else {
        memoryFallback[key] = value;
        resolve();
      }
    });
  }

  return { get, set };
})();
