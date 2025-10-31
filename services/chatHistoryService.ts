import { ChatSession, User } from '../types';

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

const getChatStorageKey = (): string | null => {
    const user = getCurrentUser();
    // Chat history is only saved for logged-in users in this setup
    return user ? `ai-studio-chat-sessions-${user.id}` : null;
};


export const getChatHistory = async (): Promise<ChatSession[]> => {
    const user = getCurrentUser();
    const key = getChatStorageKey();

    // TODO: Replace with API call.
    // if (user && user.token) {
    //   const response = await fetch('/api/chat/sessions', { headers: { 'Authorization': `Bearer ${user.token}` } });
    //   if (!response.ok) throw new Error("Failed to fetch chat history.");
    //   return await response.json();
    // }
    
    if (!key) return Promise.resolve([]); // No history for guests

    try {
        const sessionsJson = localStorage.getItem(key);
        return sessionsJson ? JSON.parse(sessionsJson) : [];
    } catch (e) {
        console.error("Could not parse chat history from localStorage", e);
        return [];
    }
};

export const saveChatSessions = async (sessions: ChatSession[]): Promise<void> => {
    const user = getCurrentUser();
    const key = getChatStorageKey();
    
    // TODO: Replace with API call.
    // if (user && user.token) {
    //   await fetch('/api/chat/sessions', { 
    //     method: 'POST', 
    //     headers: { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json' },
    //     body: JSON.stringify(sessions)
    //   });
    //   return;
    // }

    if (!key) return; // Don't save for guests

    try {
        localStorage.setItem(key, JSON.stringify(sessions));
    } catch (e) {
        console.error("Error saving chat history:", e);
    }
};

export const deleteSession = async (id: string): Promise<void> => {
    // TODO: Replace with API call.
    // const user = getCurrentUser();
    // if (user && user.token) {
    //   await fetch(`/api/chat/sessions/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${user.token}` } });
    // }
    console.log(`Simulating deletion of session ${id}. UI state handles the removal.`);
};

export const clearAllChatHistory = async (): Promise<void> => {
     const user = getCurrentUser();
     const key = getChatStorageKey();

    // TODO: Replace with API call.
    // if (user && user.token) {
    //     await fetch('/api/chat/sessions', { method: 'DELETE', headers: { 'Authorization': `Bearer ${user.token}` } });
    // }

    if (key) {
        localStorage.removeItem(key);
    }
    console.log("Simulating clearing all chat history.");
};