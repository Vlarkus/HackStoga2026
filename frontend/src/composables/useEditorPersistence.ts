const STORAGE_KEY = 'main-editor-content';

export function useEditorPersistence() {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let pendingHtml: string | null = null;

  function load(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function save(html: string): void {
    pendingHtml = html;
    if (timerId !== null) clearTimeout(timerId);
    timerId = setTimeout(() => {
      timerId = null;
      const toWrite = pendingHtml;
      pendingHtml = null;
      if (toWrite === null) return;
      try {
        localStorage.setItem(STORAGE_KEY, toWrite);
      } catch {
        // Silently ignore SecurityError / QuotaExceededError
      }
    }, 500);
  }

  function flush(): void {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    if (pendingHtml !== null) {
      try {
        localStorage.setItem(STORAGE_KEY, pendingHtml);
      } catch {
        // Silently ignore
      }
      pendingHtml = null;
    }
  }

  return { load, save, flush };
}
