import { HistoryItem, User } from '../types';

const MAX_HISTORY_ITEMS = 50;

// Helper to get current user from localStorage
const getCurrentUser = (): User | null => {
    try {
        const userJson = localStorage.getItem('ai-studio-user');
        return userJson ? JSON.parse(userJson) : null;
    } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        return null;
    }
};

const getHistoryStorageKey = (): string => {
    const user = getCurrentUser();
    return user ? `ai-studio-history-${user.id}` : 'ai-studio-history-guest';
};

export const getHistory = async (): Promise<HistoryItem[]> => {
    const user = getCurrentUser();
    // TODO: API call here. Replace localStorage logic.
    // if (user) {
    //   const response = await fetch('/api/history', { headers: { 'Authorization': `Bearer ${user.token}` } });
    //   if (!response.ok) throw new Error("Failed to fetch history.");
    //   return await response.json();
    // }
    
    try {
        const key = getHistoryStorageKey();
        const historyJson = localStorage.getItem(key);
        if (historyJson) {
            const history = JSON.parse(historyJson) as HistoryItem[];
            return history.sort((a, b) => b.timestamp - a.timestamp);
        }
    } catch (e) {
        console.error("Could not parse history from localStorage", e);
        localStorage.removeItem(getHistoryStorageKey());
    }
    return Promise.resolve([]);
};

export const addToHistory = async (
    imageUrl: string, 
    type: HistoryItem['type'], 
    prompt?: string, 
    details?: string,
    inputImages?: { url: string; label: string }[]
): Promise<HistoryItem> => {
    const autoSave = localStorage.getItem('ai-studio-autosave');
    if (autoSave === 'false') {
        // Still return an unsaved item so app logic doesn't break
        return Promise.resolve({ id: 'unsaved', imageUrl, type, timestamp: Date.now() });
    }

    const newItem: HistoryItem = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        imageUrl,
        type,
        timestamp: Date.now(),
        isFavorite: false,
        prompt,
        details,
        inputImages,
    };

    const user = getCurrentUser();
    // TODO: API call here.
    // if (user) {
    //   const response = await fetch('/api/history', { 
    //     method: 'POST', 
    //     headers: { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json' },
    //     body: JSON.stringify(newItem)
    //   });
    //   if (!response.ok) throw new Error("Failed to save history item.");
    //   return await response.json();
    // }

    const currentHistory = await getHistory();
    let newHistory = [newItem, ...currentHistory];

    if (newHistory.length > MAX_HISTORY_ITEMS) {
        newHistory = newHistory.slice(0, MAX_HISTORY_ITEMS);
    }
    
    try {
        const key = getHistoryStorageKey();
        localStorage.setItem(key, JSON.stringify(newHistory));
    } catch (e: any) {
        if (e.name === 'QuotaExceededError') {
            console.error("Storage quota exceeded. Pruning history.");
            try {
                const prunedHistory = newHistory.slice(0, Math.floor(MAX_HISTORY_ITEMS / 2));
                localStorage.setItem(getHistoryStorageKey(), JSON.stringify(prunedHistory));
            } catch (pruneError) {
                console.error("Could not save even pruned history.", pruneError);
            }
        } else {
            console.error("Error saving history:", e);
        }
    }
    
    return Promise.resolve(newItem);
};

export const toggleFavorite = async (id: string): Promise<HistoryItem | null> => {
    // TODO: API call here: fetch(`/api/history/${id}/favorite`, { method: 'POST', ... })
    const currentHistory = await getHistory();
    let updatedItem: HistoryItem | null = null;
    const newHistory = currentHistory.map(item => {
        if (item.id === id) {
            updatedItem = { ...item, isFavorite: !item.isFavorite };
            return updatedItem;
        }
        return item;
    });

    if (updatedItem) {
        localStorage.setItem(getHistoryStorageKey(), JSON.stringify(newHistory));
    }
    
    return Promise.resolve(updatedItem);
};

export const removeFromHistory = async (id: string): Promise<boolean> => {
    // TODO: API call here: fetch(`/api/history/${id}`, { method: 'DELETE', ... })
    const currentHistory = await getHistory();
    const newHistory = currentHistory.filter(item => item.id !== id);

    if (newHistory.length < currentHistory.length) {
        localStorage.setItem(getHistoryStorageKey(), JSON.stringify(newHistory));
        return Promise.resolve(true);
    }
    
    return Promise.resolve(false);
};

export const clearHistory = async (): Promise<boolean> => {
    // TODO: API call here: fetch('/api/history', { method: 'DELETE', ... })
    localStorage.removeItem(getHistoryStorageKey());
    return Promise.resolve(true);
};

export const exportHistory = async (): Promise<void> => {
    try {
        const history = await getHistory();
        const historyJson = JSON.stringify(history, null, 2);
        const blob = new Blob([historyJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-studio-history-${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error("Failed to export history", e);
        alert("Không thể xuất lịch sử.");
    }
};