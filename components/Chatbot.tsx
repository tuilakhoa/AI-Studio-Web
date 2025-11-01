import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { ChatMessage, ChatSession, User } from '../types';
import Spinner from './Spinner';
import { summarizeConversationForTitle } from '../services/geminiService';
import { getChatHistory, saveChatSessions, deleteSession as deleteSessionApi, clearAllChatHistory as clearAllHistoryApi } from '../services/chatHistoryService';


interface ChatbotProps {
  requireAuth: () => boolean;
  currentUser: User | null;
}

// --- Sub-components moved outside the main component to prevent re-creation on re-render ---

const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isUser = message.role === 'user';
    return (
        <div className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && (
                 <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                 </div>
            )}
            <div 
                className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${isUser ? 'bg-purple-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}
                style={{ whiteSpace: 'pre-wrap' }}
            >
                {message.text}
            </div>
        </div>
    );
};

interface HistoryViewComponentProps {
    setView: (view: 'chat' | 'history') => void;
    handleClearAll: () => void;
    sessions: ChatSession[];
    handleSelectSession: (id: string) => void;
    handleDeleteSession: (id: string) => void;
    handleNewChat: () => void;
}

const HistoryViewComponent: React.FC<HistoryViewComponentProps> = ({ setView, handleClearAll, sessions, handleSelectSession, handleDeleteSession, handleNewChat }) => (
    <div className="flex flex-col h-full">
        <header className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-2">
                <button onClick={() => setView('chat')} className="text-gray-400 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h3 className="font-bold text-white text-lg">Lịch sử Chat</h3>
            </div>
            {sessions.length > 0 && 
                <button onClick={handleClearAll} className="text-xs text-red-400 hover:text-red-300">Xóa tất cả</button>
            }
        </header>
        <div className="flex-grow p-2 overflow-y-auto space-y-2">
            {sessions.length === 0 ? (
                <div className="text-center text-gray-400 pt-10 px-4">
                  <p>Lịch sử trò chuyện của bạn sẽ xuất hiện ở đây sau khi bạn đăng nhập.</p>
                </div>
            ) : (
                sessions.sort((a,b) => b.timestamp - a.timestamp).map(session => (
                    <div key={session.id} className="group flex items-center justify-between p-3 rounded-lg hover:bg-white/10 cursor-pointer" onClick={() => handleSelectSession(session.id)}>
                        <div className="flex-grow overflow-hidden">
                            <p className="font-semibold text-white truncate">{session.title}</p>
                            <p className="text-xs text-gray-400 truncate">{session.messages.slice(-1)[0]?.text}</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }} className="p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 flex-shrink-0 ml-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                ))
            )}
        </div>
         <div className="p-4 border-t border-white/10 flex-shrink-0">
            <button onClick={handleNewChat} className="w-full py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700">Trò chuyện mới</button>
        </div>
    </div>
);

interface ChatViewComponentProps {
    handleViewHistory: () => void;
    activeSession: ChatSession | null;
    handleNewChat: () => void;
    handleSendMessage: (e: React.FormEvent) => Promise<void>;
    messagesEndRef: React.RefObject<HTMLDivElement>;
    isLoading: boolean;
    error: string | null;
    input: string;
    setInput: (input: string) => void;
}

const ChatViewComponent: React.FC<ChatViewComponentProps> = ({ handleViewHistory, activeSession, handleNewChat, handleSendMessage, messagesEndRef, isLoading, error, input, setInput }) => (
    <div className="flex flex-col h-full">
        <header className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-2">
                <button onClick={handleViewHistory} className="text-gray-400 hover:text-white" title="Xem lịch sử">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </button>
                <h3 className="font-bold text-white text-lg truncate">{activeSession?.title || "Trò chuyện mới"}</h3>
            </div>
             <button onClick={handleNewChat} className="text-gray-400 hover:text-white" title="Trò chuyện mới">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
             </button>
        </header>
        <div className="flex-grow p-4 overflow-y-auto space-y-4">
            {(activeSession?.messages || [{ role: 'model', text: 'Xin chào! Tôi là trợ lý AI của bạn. Tôi có thể giúp gì cho bạn hôm nay?' }]).map((msg, index) => <ChatBubble key={index} message={msg} />)}
            {isLoading && (
                <div className="flex items-end gap-2 justify-start">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    </div>
                    <div className="max-w-xs md:max-w-md px-4 py-3 rounded-2xl bg-gray-700 text-gray-200 rounded-bl-none flex items-center">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce ml-1.5" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce ml-1.5" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                </div>
            )}
            {error && <div className="text-center p-2 bg-red-900/50 text-red-300 rounded-lg">{error}</div>}
            <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 flex-shrink-0">
             <div className="flex items-center gap-2 bg-gray-900 rounded-lg p-1">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Hỏi bất cứ điều gì..." className="flex-grow bg-transparent p-2 text-gray-200 focus:outline-none" disabled={isLoading} />
                <button type="submit" disabled={isLoading || !input.trim()} className="w-10 h-10 flex items-center justify-center bg-purple-600 text-white rounded-md disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" transform="rotate(90 12 12)"/></svg>
                </button>
            </div>
        </form>
    </div>
);


const Chatbot: React.FC<ChatbotProps> = ({ requireAuth, currentUser }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [view, setView] = useState<'history' | 'chat'>('chat');
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const activeSession = useMemo(() => {
        return sessions.find(s => s.id === activeSessionId) || null;
    }, [sessions, activeSessionId]);

    // Load chat history when user logs in or out
    useEffect(() => {
        const loadHistory = async () => {
            if (currentUser) {
                const userSessions = await getChatHistory();
                setSessions(userSessions);
            } else {
                setSessions([]);
                setActiveSessionId(null);
            }
        };
        loadHistory();
    }, [currentUser]);

    const updateSessions = useCallback((updater: React.SetStateAction<ChatSession[]>) => {
        setSessions(prev => {
            const newSessions = typeof updater === 'function' ? updater(prev) : updater;
            if (currentUser) {
                saveChatSessions(newSessions);
            }
            return newSessions;
        });
    }, [currentUser]);


    useEffect(() => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const history = activeSession ? activeSession.messages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
        })) : [];

        chatRef.current = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: 'You are a helpful and friendly AI assistant for an application called AI Studio, which helps users generate and edit images and videos. Your answers should be concise and helpful, in Vietnamese.',
            },
            history,
        });
    }, [activeSessionId, sessions]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeSession?.messages, isLoading]);
    
    const handleNewChat = () => {
        setActiveSessionId(null);
        setView('chat');
    };
    
    const handleViewHistory = () => {
        if(requireAuth()) {
            setView('history');
        }
    }

    const handleSelectSession = (id: string) => {
        setActiveSessionId(id);
        setView('chat');
    };
    
    const handleDeleteSession = async (id: string) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa cuộc trò chuyện này?")) {
            await deleteSessionApi(id);
            const newSessions = sessions.filter(s => s.id !== id);
            updateSessions(newSessions);
            if (activeSessionId === id) {
                setActiveSessionId(null);
                setView('history');
            }
        }
    };
    
    const handleClearAll = async () => {
         if (window.confirm("Bạn có chắc chắn muốn xóa TOÀN BỘ lịch sử trò chuyện?")) {
            await clearAllHistoryApi();
            updateSessions([]);
            setActiveSessionId(null);
            setView('chat');
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !chatRef.current) return;

        if (!currentUser && !requireAuth()) {
            return; // If auth is required and fails, stop here
        }

        const userMessage: ChatMessage = { role: 'user', text: input };
        const currentInput = input;
        setInput('');
        setIsLoading(true);
        setError(null);
        
        let currentSessionId = activeSessionId;
        let isNewSession = false;

        if (!currentSessionId) {
            isNewSession = true;
            const newSession: ChatSession = {
                id: Date.now().toString(),
                title: 'Cuộc trò chuyện mới...',
                messages: [userMessage],
                timestamp: Date.now(),
            };
            currentSessionId = newSession.id;
            setActiveSessionId(currentSessionId);
            updateSessions(prev => [newSession, ...prev]);
        } else {
            updateSessions(prev => prev.map(s => 
                s.id === currentSessionId ? { ...s, messages: [...s.messages, userMessage], timestamp: Date.now() } : s
            ));
        }
        
        try {
            const stream = await chatRef.current.sendMessageStream({ message: currentInput });
            
            let modelResponse = '';
            updateSessions(prev => prev.map(s => 
                s.id === currentSessionId ? { ...s, messages: [...s.messages, { role: 'model', text: '' }] } : s
            ));
            
            for await (const chunk of stream) {
                modelResponse += chunk.text;
                 updateSessions(prev => prev.map(s => {
                    if (s.id === currentSessionId) {
                        const newMessages = [...s.messages];
                        newMessages[newMessages.length - 1] = { role: 'model', text: modelResponse };
                        return { ...s, messages: newMessages };
                    }
                    return s;
                }));
            }

            if (isNewSession) {
                const finalMessages = sessions.find(s => s.id === currentSessionId)?.messages || [userMessage, { role: 'model', text: modelResponse }];
                const newTitle = await summarizeConversationForTitle(finalMessages);
                 updateSessions(prev => prev.map(s => 
                    s.id === currentSessionId ? { ...s, title: newTitle } : s
                ));
            }

        } catch (err: any) {
            console.error("Lỗi khi gửi tin nhắn:", err);
            setError("Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.");
            // Rollback the user message on error
             updateSessions(prev => prev.map(s => {
                if (s.id === currentSessionId) {
                    const revertedMessages = s.messages.filter(m => m.text !== currentInput);
                    return { ...s, messages: revertedMessages };
                }
                return s;
            }));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-2xl z-40 transform transition-transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-purple-400"
                aria-label="Mở Trợ lý AI"
            >
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                )}
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-6 w-[calc(100vw-3rem)] max-w-sm h-[70vh] max-h-[600px] bg-gray-800/80 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl z-50 flex flex-col animate-fade-in">
                    {view === 'history' ? (
                        <HistoryViewComponent
                            setView={setView}
                            handleClearAll={handleClearAll}
                            sessions={sessions}
                            handleSelectSession={handleSelectSession}
                            handleDeleteSession={handleDeleteSession}
                            handleNewChat={handleNewChat}
                        />
                    ) : (
                        <ChatViewComponent
                            handleViewHistory={handleViewHistory}
                            activeSession={activeSession}
                            handleNewChat={handleNewChat}
                            handleSendMessage={handleSendMessage}
                            messagesEndRef={messagesEndRef}
                            isLoading={isLoading}
                            error={error}
                            input={input}
                            setInput={setInput}
                        />
                    )}
                </div>
            )}
        </>
    );
};

export default Chatbot;