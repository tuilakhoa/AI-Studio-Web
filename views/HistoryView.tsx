import React, { useState, useEffect, useMemo } from 'react';
import { getHistory, removeFromHistory, clearHistory, toggleFavorite } from '../services/historyService';
import { HistoryItem, User, View } from '../types';
import Spinner from '../components/Spinner';

const FILTERS: { label: string; type: HistoryItem['type'] | 'all' }[] = [
    { label: 'Tất cả', type: 'all' },
    { label: 'Headshot', type: 'headshot' },
    { label: 'Cảnh', type: 'scene' },
    { label: 'Tự do', type: 'freestyle' },
    { label: 'Video', type: 'video' },
    { label: 'Khôi phục', type: 'restore' },
    { label: 'Sáng tạo', type: 'blender' },
];

interface HistoryViewProps {
  requireAuth: () => boolean;
  currentUser: User | null;
  onPromptSelect: (prompt: string) => void;
}

const HistoryDetailModal: React.FC<{ 
    item: HistoryItem, 
    onClose: () => void,
    onDelete: (id: string) => void,
    onShare: (item: HistoryItem) => void,
    onPublish: (item: HistoryItem) => void,
    onUsePrompt: (prompt: string) => void,
    shareFeedback: string | undefined,
    publishFeedback: string | undefined,
}> = ({ item, onClose, onDelete, onShare, onPublish, onUsePrompt, shareFeedback, publishFeedback }) => {
    const [copied, setCopied] = useState(false);

    const handleCopyPrompt = () => {
        if (!item.prompt || copied) return;
        navigator.clipboard.writeText(item.prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleUsePrompt = () => {
        if (item.prompt) {
            onUsePrompt(item.prompt);
            onClose();
        }
    };
    
    const handleDelete = () => {
        if(window.confirm("Bạn có chắc muốn xóa mục này khỏi lịch sử?")) {
            onDelete(item.id);
            onClose();
        }
    }

    const ActionButton: React.FC<{ onClick?: () => void, children: React.ReactNode, disabled?: boolean, title?: string, className?: string }> = 
    ({ onClick, children, disabled = false, title, className = '' }) => (
        <button 
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg text-xs font-semibold transition-colors
                        ${disabled 
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                            : 'bg-gray-700 hover:bg-purple-600 text-gray-300 hover:text-white'}
                        ${className}`}
        >
            {children}
        </button>
    );

    return (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-gray-900 border border-purple-500/30 rounded-2xl shadow-2xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col text-white relative"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex-shrink-0 p-4 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Chi tiết Sáng tạo</h2>
                    <button 
                      onClick={onClose}
                      className="text-gray-500 hover:text-white transition-colors z-10"
                      aria-label="Đóng"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-6 flex-grow overflow-hidden">
                    {/* Left: Result Image */}
                    <div className="lg:col-span-3 bg-black/50 rounded-lg flex items-center justify-center overflow-hidden">
                        {item.type === 'video' ? (
                            <video src={item.imageUrl} controls autoPlay loop className="max-w-full max-h-full object-contain" />
                        ) : (
                            <img src={item.imageUrl} alt="Generated result" className="max-w-full max-h-full object-contain" />
                        )}
                    </div>
                    {/* Right: Details */}
                    <div className="lg:col-span-2 flex flex-col gap-4 overflow-y-auto">
                        <div className="bg-gray-800/50 p-3 rounded-lg border border-white/10">
                             <h3 className="text-sm font-semibold text-gray-400 mb-2">Hành động nhanh</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <ActionButton onClick={handleUsePrompt} disabled={!item.prompt} title="Sử dụng lời nhắc này trong trình tạo Tự do">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h5a1 1 0 01.954 1.285A10 10 0 112.285 8.954.999.999 0 013 8h5V3a1 1 0 011.046-.691l.001-.001.001-.001a.999.999 0 01.252-.023zM12 13a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1z" clipRule="evenodd" /></svg>
                                    <span>Dùng Lời nhắc</span>
                                </ActionButton>
                                <ActionButton onClick={handleCopyPrompt} disabled={!item.prompt} title="Sao chép lời nhắc">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" /><path d="M4 3a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H4z" /></svg>
                                    <span>{copied ? 'Đã sao chép!' : 'Sao chép'}</span>
                                </ActionButton>
                            </div>
                        </div>

                         {item.prompt && (
                             <div className="bg-gray-800/50 p-3 rounded-lg border border-white/10">
                                <h3 className="text-sm font-semibold text-gray-400 mb-2">Lời nhắc</h3>
                                <p className="text-sm text-gray-300 whitespace-pre-wrap">{item.prompt}</p>
                            </div>
                        )}
                        {item.inputImages && item.inputImages.length > 0 && (
                            <div className="bg-gray-800/50 p-3 rounded-lg border border-white/10">
                                <h3 className="text-sm font-semibold text-gray-400 mb-2">Ảnh gốc</h3>
                                <div className="flex flex-wrap gap-2">
                                    {item.inputImages.map((img, index) => (
                                        <div key={index} className="text-center">
                                            <img src={img.url} alt={img.label} className="w-20 h-20 object-cover rounded-md bg-black" />
                                            <p className="text-xs text-gray-500 mt-1">{img.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="bg-gray-800/50 p-3 rounded-lg border border-white/10">
                           <h3 className="text-sm font-semibold text-gray-400 mb-2">Thông tin</h3>
                           <div className="text-sm text-gray-300 space-y-1">
                             <p><strong>Loại:</strong> <span className="capitalize bg-purple-600/50 px-2 py-0.5 rounded text-purple-300">{item.type}</span></p>
                             {item.details && <p><strong>Chi tiết:</strong> {item.details}</p>}
                             <p><strong>Thời gian:</strong> {new Date(item.timestamp).toLocaleString()}</p>
                           </div>
                        </div>
                         <div className="mt-auto pt-4 flex flex-col gap-2">
                            <div className="grid grid-cols-3 gap-2">
                                <a href={item.imageUrl} download={`ai-creation-${item.id}.${item.type === 'video' ? 'mp4' : 'png'}`} className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg text-xs font-semibold transition-colors bg-blue-600 hover:bg-blue-700 text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                    <span>Tải xuống</span>
                                </a>
                                <ActionButton onClick={() => onShare(item)} disabled={!!shareFeedback} title="Chia sẻ">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" /></svg>
                                    <span>{shareFeedback || 'Chia sẻ'}</span>
                                </ActionButton>
                                 <ActionButton onClick={() => onPublish(item)} disabled={!!publishFeedback || item.type === 'video'} title={item.type === 'video' ? 'Không thể đăng video' : 'Đăng lên Triển lãm'}>
                                    {publishFeedback === 'Đang đăng...' ? <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : 
                                    (publishFeedback === 'Đã đăng!') ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> :
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.414l-1.293 1.293a1 1 0 01-1.414-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L13 9.414V13H5.5z" /><path d="M9 13h2v5a1 1 0 11-2 0v-5z" /></svg>}
                                     <span>{publishFeedback || 'Đăng'}</span>
                                </ActionButton>
                            </div>
                            <button onClick={handleDelete} className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-sm font-semibold transition-colors bg-red-900/50 hover:bg-red-900/80 text-red-400 hover:text-red-300">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                Xóa khỏi Lịch sử
                            </button>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const HistoryView: React.FC<HistoryViewProps> = ({ requireAuth, currentUser, onPromptSelect }) => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [shareFeedback, setShareFeedback] = useState<{ [key: string]: string }>({});
    const [publishFeedback, setPublishFeedback] = useState<{ [key: string]: string }>({});
    const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
    const [filter, setFilter] = useState<HistoryItem['type'] | 'all'>('all');
    const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

    useEffect(() => {
        const checkAuthAndFetch = async () => {
            if (requireAuth()) {
                setIsLoading(true);
                const historyData = await getHistory();
                setHistory(historyData);
                setIsLoading(false);
            } else {
                setIsLoading(false);
                setHistory([]);
            }
        };
        checkAuthAndFetch();
    }, [requireAuth, currentUser]);
    
    const groupedAndFilteredHistory = useMemo(() => {
        const filtered = history
            .filter(item => !showFavoritesOnly || item.isFavorite)
            .filter(item => filter === 'all' || item.type === filter)
            .sort((a, b) => b.timestamp - a.timestamp);

        const groups: { [key: string]: HistoryItem[] } = {};

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const isSameDay = (d1: Date, d2: Date) => 
            d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();

        filtered.forEach(item => {
            const itemDate = new Date(item.timestamp);
            let key = 'Cũ hơn';
            if (isSameDay(itemDate, today)) {
                key = 'Hôm nay';
            } else if (isSameDay(itemDate, yesterday)) {
                key = 'Hôm qua';
            }
            
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
        });
        
        return groups;
    }, [history, showFavoritesOnly, filter]);

    const handleRemoveItem = async (id: string) => {
        const success = await removeFromHistory(id);
        if (success) {
            setHistory(prev => prev.filter(item => item.id !== id));
        }
    };

    const handleClearAll = async () => {
        if (window.confirm("Bạn có chắc chắn muốn xóa tất cả lịch sử không? Hành động này không thể hoàn tác.")) {
            const success = await clearHistory();
            if(success) {
                setHistory([]);
            }
        }
    };
    
    const handleToggleFavorite = async (id: string) => {
        setHistory(prev => prev.map(item => item.id === id ? { ...item, isFavorite: !item.isFavorite } : item));
        await toggleFavorite(id);
    };
    
    const handleShare = async (item: HistoryItem) => {
        setShareFeedback(prev => ({ ...prev, [item.id]: '...' }));
        try {
            const response = await fetch(item.imageUrl);
            const blob = await response.blob();
            const file = new File([blob], `ai-creation.${item.type === 'video' ? 'mp4' : 'png'}`, { type: blob.type });

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'AI Creation',
                    text: `Check out this ${item.type} I made with AI Studio!`,
                    files: [file],
                });
                setShareFeedback(prev => ({ ...prev, [item.id]: 'Đã chia sẻ!' }));
            } else if (item.type !== 'video' && navigator.clipboard?.write) {
                await navigator.clipboard.write([ new ClipboardItem({ [blob.type]: blob }) ]);
                setShareFeedback(prev => ({ ...prev, [item.id]: 'Đã sao chép!' }));
            } else {
                 throw new Error('Không hỗ trợ.');
            }
        } catch (err) {
            console.error('Lỗi khi chia sẻ:', err);
            setShareFeedback(prev => ({ ...prev, [item.id]: 'Lỗi' }));
        } finally {
            setTimeout(() => setShareFeedback(prev => {
                const newState = {...prev};
                delete newState[item.id];
                return newState;
            }), 3000);
        }
    };

    const handlePublish = (item: HistoryItem) => {
      if (publishFeedback[item.id]) return;

      setPublishFeedback(prev => ({ ...prev, [item.id]: 'Đang đăng...' }));
      console.log("Đang đăng lên triển lãm:", item.id);
      
      setTimeout(() => {
        setPublishFeedback(prev => ({ ...prev, [item.id]: 'Đã đăng!' }));
        setTimeout(() => {
            setPublishFeedback(prev => {
              const newState = { ...prev };
              delete newState[item.id];
              return newState;
            });
        }, 3000);
      }, 1500);
    };
    
    const getTypeLabel = (type: HistoryItem['type']) => {
        switch(type) {
            case 'headshot': return 'Headshot';
            case 'scene': return 'Cảnh';
            case 'video': return 'Video';
            case 'restore': return 'Khôi phục';
            case 'freestyle': return 'Tự do';
            case 'blender': return 'Ghép ảnh';
            default: return type.charAt(0).toUpperCase() + type.slice(1);
        }
    }

    const getTypeColor = (type: HistoryItem['type']) => {
        switch(type) {
            case 'headshot': return 'bg-purple-600';
            case 'scene': return 'bg-cyan-600';
            case 'video': return 'bg-green-600';
            case 'restore': return 'bg-orange-600';
            case 'freestyle': return 'bg-teal-600';
            case 'blender': return 'bg-rose-600';
            default: return 'bg-gray-600';
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner />
            </div>
        );
    }
    
    if (!currentUser) {
        return (
            <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl animate-fade-in">
                <p className="text-gray-400 text-lg">Bạn cần đăng nhập.</p>
                <p className="text-gray-500 mt-2">Đăng nhập hoặc đăng ký để xem lịch sử sáng tạo của bạn.</p>
            </div>
        );
    }

    return (
        <>
        {selectedItem && <HistoryDetailModal 
            item={selectedItem} 
            onClose={() => setSelectedItem(null)} 
            onDelete={handleRemoveItem}
            onShare={handleShare}
            onPublish={handlePublish}
            onUsePrompt={onPromptSelect}
            shareFeedback={shareFeedback[selectedItem.id]}
            publishFeedback={publishFeedback[selectedItem.id]}
        />}
        <div className="w-full animate-fade-in">
             <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <h2 className="text-3xl font-bold text-gray-100">Lịch sử Sáng tạo</h2>
                 {history.length > 0 && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                            className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${showFavoritesOnly ? 'bg-yellow-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            Yêu thích
                        </button>
                        <button onClick={handleClearAll} className="px-3 py-1.5 bg-red-800 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-sm">
                            Xóa tất cả
                        </button>
                    </div>
                )}
            </div>
            
            {history.length > 0 && (
                <div className="mb-6 flex flex-wrap items-center gap-2">
                    {FILTERS.map(f => (
                         <button
                            key={f.type}
                            onClick={() => setFilter(f.type)}
                            className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full transition-colors ${filter === f.type ? 'bg-purple-600 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}
                        >{f.label}</button>
                    ))}
                </div>
            )}
            
            {history.length === 0 ? (
                <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl">
                    <p className="text-gray-400 text-lg">Lịch sử của bạn trống.</p>
                    <p className="text-gray-500 mt-2">Bắt đầu tạo để xem các tác phẩm của bạn ở đây.</p>
                </div>
            ) : (
                Object.keys(groupedAndFilteredHistory).length === 0 ? (
                    <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl">
                        <p className="text-gray-400 text-lg">Không tìm thấy kết quả phù hợp.</p>
                        <p className="text-gray-500 mt-2">Hãy thử thay đổi bộ lọc hoặc bỏ đánh dấu yêu thích.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {Object.entries(groupedAndFilteredHistory).map(([groupTitle, items]) => (
                             <section key={groupTitle}>
                                <h3 className="text-xl font-bold text-gray-300 mb-4 pb-2 border-b border-white/10">{groupTitle}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {(items as HistoryItem[]).map(item => {
                                        const publishStatus = publishFeedback[item.id];
                                        return (
                                        <div key={item.id} className="group bg-gray-900 rounded-lg shadow-lg border border-white/10 flex flex-col transition-transform duration-300 hover:scale-105 hover:shadow-purple-500/20">
                                           <div className="relative cursor-pointer" onClick={() => setSelectedItem(item)}>
                                                <button onClick={(e) => { e.stopPropagation(); handleToggleFavorite(item.id); }} className={`absolute top-2 right-2 z-10 p-1.5 rounded-full transition-all duration-200 ${item.isFavorite ? 'bg-yellow-400 text-white scale-110' : 'bg-black/50 text-gray-300 hover:bg-yellow-400 opacity-0 group-hover:opacity-100'}`} title="Yêu thích">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                                </button>
                                               {item.type === 'video' ? (
                                                    <video src={item.imageUrl} loop muted playsInline className="w-full h-56 object-cover rounded-t-lg" onMouseOver={e => e.currentTarget.play()} onMouseOut={e => e.currentTarget.pause()} />
                                               ) : (
                                                    <img src={item.imageUrl} alt={`Generated ${item.type}`} className="w-full h-56 object-cover rounded-t-lg"/>
                                               )}
                                            </div>
                                            <div className="p-4 flex-grow flex flex-col">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={`px-2 py-1 text-xs font-bold rounded-full text-white ${getTypeColor(item.type)}`}>
                                                        {getTypeLabel(item.type)}
                                                    </span>
                                                    <p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleTimeString()}</p>
                                                </div>
                                                <p className="text-sm text-gray-300 flex-grow mb-3 line-clamp-3 cursor-pointer" title={item.prompt} onClick={() => setSelectedItem(item)}>{item.prompt || item.details || 'Không có lời nhắc'}</p>
                                                <div className="flex gap-1.5 justify-end mt-auto pt-2 border-t border-white/10">
                                                    <button onClick={(e) => { e.stopPropagation(); handlePublish(item);}} disabled={!!publishStatus || item.type === 'video'} className="p-2 bg-teal-600 hover:bg-teal-700 rounded-full text-white w-8 h-8 flex items-center justify-center disabled:bg-gray-600 disabled:cursor-not-allowed" title={item.type === 'video' ? "Không thể đăng video" : "Đăng lên Triển lãm"}>
                                                        {publishStatus === 'Đang đăng...' ? <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : (publishStatus === 'Đã đăng!') ? <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>}
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleShare(item);}} disabled={!!shareFeedback[item.id]} className="p-2 bg-indigo-600 hover:bg-indigo-700 rounded-full text-white w-8 h-8 flex items-center justify-center" title="Chia sẻ">
                                                        {shareFeedback[item.id] ? <span className="text-xs">{shareFeedback[item.id]}</span> : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" /></svg>}
                                                    </button>
                                                    <a href={item.imageUrl} download={`ai-creation-${item.id}.${item.type === 'video' ? 'mp4' : 'png'}`} onClick={(e) => e.stopPropagation()} className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full text-white w-8 h-8 flex items-center justify-center" title="Tải xuống">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                    </a>
                                                    <button onClick={(e) => { e.stopPropagation(); handleRemoveItem(item.id); }} className="p-2 bg-red-600 hover:bg-red-700 rounded-full text-white w-8 h-8 flex items-center justify-center" title="Xóa">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                           </div>
                                        </div>
                                    )})}
                                </div>
                            </section>
                        ))}
                    </div>
                )
            )}
        </div>
        </>
    );
};

export default HistoryView;