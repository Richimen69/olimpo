const HISTORY_KEY = 'toyota_knowledge_history';
const MAX_HISTORY = 12; 

export interface HistoryItem {
  id: string;
  name: string;
  icon: string;
  url: string;
}

export const saveToHistory = (item: HistoryItem) => {
  try {
    const existing = localStorage.getItem(HISTORY_KEY);
    let history: HistoryItem[] = existing ? JSON.parse(existing) : [];

    // 1. Si la carpeta ya estaba en el historial, la quitamos de su posición vieja
    history = history.filter(h => h.id !== item.id);

    // 2. La agregamos al principio de la lista (es lo más reciente)
    history.unshift(item);

    // 3. Si nos pasamos del límite, borramos la más vieja (la última)
    if (history.length > MAX_HISTORY) {
      history.pop();
    }

    // 4. Guardamos en el navegador
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.error("Error guardando el historial", e);
  }
};

export const getHistory = (): HistoryItem[] => {
  try {
    const existing = localStorage.getItem(HISTORY_KEY);
    return existing ? JSON.parse(existing) : [];
  } catch (e) {
    return [];
  }
};