import React, { useState, useCallback } from 'react';
import ImageUploader from '../components/ImageUploader';
import Spinner from '../components/Spinner';
import { outpaintImage, generateOutpaintingSuggestion } from '../services/geminiService';
import { addToHistory } from '../services/historyService';

type Direction = 'up' | 'down' | 'left' | 'right' | 'panoramic';

interface OutpaintingProps {
  requireAuth: () => boolean;
}

const DirectionButton: React.FC<{
    direction: Direction;
    onClick: (dir: Direction) => void;
    selected: boolean;
    children: React.ReactNode;
    className?: string;
}> = ({ direction, onClick, selected, children, className = '' }) => (
    <button
        onClick={() => onClick(direction)}
        className={`w-12 h-12 flex items-center justify-center rounded-lg transition-colors ${
            selected
                ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                : 'bg-gray-700 hover:bg-gray-600'
        } ${className}`}
    >
        {children}
    </button>
);

const Outpainting: React.FC<OutpaintingProps> = ({ requireAuth }) => {
    const [sourceFile, setSourceFile] = useState<File | null>(null);
    const [sourceUrl, setSourceUrl] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [direction, setDirection] = useState<Direction>('right');
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleImageUpload = useCallback(async (file: File) => {
        if (sourceUrl) URL.revokeObjectURL(sourceUrl);
        setSourceFile(file);
        const newUrl = URL.createObjectURL(file);
        setSourceUrl(newUrl);
        setError(null);
        setResultUrl(null);

        // Generate suggestion automatically
        setIsSuggesting(true);
        setPrompt(''); 
        try {
            const suggestion = await generateOutpaintingSuggestion(file);
            setPrompt(suggestion);
        } catch (err) {
            console.error("Failed to get suggestion:", err);
            // Don't show an error for suggestion failure, user can type manually
        } finally {
            setIsSuggesting(false);
        }
    }, [sourceUrl]);

    const handleImageClear = useCallback(() => {
        if (sourceUrl) URL.revokeObjectURL(sourceUrl);
        setSourceFile(null);
        setSourceUrl(null);
        setError(null);
        setResultUrl(null);
        setPrompt('');
    }, [sourceUrl]);

    const handleGenerateClick = async () => {
        if (!requireAuth()) return;

        if (!sourceFile) {
            setError("Vui lòng tải lên ảnh nguồn.");
            return;
        }
        if (!prompt.trim()) {
            setError("Vui lòng mô tả phần mở rộng.");
            return;
        }
        setIsGenerating(true);
        setError(null);
        try {
            const newResultUrl = await outpaintImage(sourceFile, prompt, direction);
            setResultUrl(newResultUrl);
            if(sourceUrl) {
                addToHistory(newResultUrl, 'outpainting', prompt, `Direction: ${direction}`, [{ url: sourceUrl, label: 'Ảnh gốc' }]);
            }
        } catch (err: any) {
            setError(err.message || "Đã xảy ra lỗi không xác định.");
        } finally {
            setIsGenerating(false);
        }
    };

    const isGenerateDisabled = !sourceFile || !prompt.trim() || isGenerating || isSuggesting;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-8 animate-fade-in">
            {/* Left Column */}
            <div className="w-full space-y-8">
                <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">1. Tải lên Ảnh Nguồn</h2>
                    <p className="text-center text-gray-400 text-sm mb-4">Mở rộng ảnh của bạn bằng cách vẽ tiếp khung cảnh dựa trên mô tả của bạn.</p>
                    <ImageUploader onImageUpload={handleImageUpload} onImageClear={handleImageClear} imageUrl={sourceUrl} />
                </div>
                 <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">2. Chọn Hướng & Mô tả</h2>
                    <div className="grid grid-cols-3 gap-2 w-max mx-auto justify-items-center items-center">
                        <div />
                        <DirectionButton direction="up" onClick={setDirection} selected={direction === 'up'}>
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                        </DirectionButton>
                        <div />

                        <DirectionButton direction="left" onClick={setDirection} selected={direction === 'left'}>
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                        </DirectionButton>
                        <div className="w-24 h-24 border-2 border-gray-500 rounded-lg bg-gray-900 flex items-center justify-center p-1 relative">
                            {sourceUrl ? <img src={sourceUrl} className="max-w-full max-h-full object-contain rounded-sm"/> : <span className="text-gray-500 text-xs text-center">Ảnh gốc</span>}
                             {direction === 'panoramic' && (
                                <>
                                <div className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 text-purple-400 animate-pulse text-2xl font-bold">&lt;</div>
                                <div className="absolute right-0 top-1/2 translate-x-full -translate-y-1/2 text-purple-400 animate-pulse text-2xl font-bold">&gt;</div>
                                </>
                            )}
                        </div>
                         <DirectionButton direction="right" onClick={setDirection} selected={direction === 'right'}>
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                        </DirectionButton>

                        <div />
                         <DirectionButton direction="down" onClick={setDirection} selected={direction === 'down'}>
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </DirectionButton>
                        <div />
                    </div>
                     <button
                        onClick={() => setDirection('panoramic')}
                        className={`w-full mt-4 py-3 text-md font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
                            direction === 'panoramic'
                                ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                                : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5" /></svg>
                        Mở rộng Toàn cảnh
                    </button>
                    <div className="relative mt-6">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={isSuggesting ? "AI đang phân tích ảnh để đưa ra gợi ý..." : "Mô tả những gì cần vẽ vào phần mở rộng..."}
                            className="w-full p-3 pr-12 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-purple-500 disabled:bg-gray-700/50"
                            rows={3}
                            disabled={isSuggesting}
                        />
                         {isSuggesting && (
                            <div className="absolute top-1/2 right-3 -translate-y-1/2">
                                <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                        )}
                    </div>
                     <div className="mt-4 p-3 bg-indigo-900/30 border border-indigo-500/30 rounded-lg text-center">
                        <p className="text-sm text-indigo-200"><strong className="font-semibold">Mẹo Pro:</strong> Nếu ảnh của bạn là chân dung, hãy thử hướng "Xuống" hoặc "Toàn cảnh" và mô tả phần còn lại của cơ thể/quần áo để AI hoàn thiện nhân vật của bạn!</p>
                    </div>
                </div>
            </div>

            {/* Right Column */}
            <div className="w-full space-y-6 lg:sticky top-8">
                <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">3. Vẽ Tiếp</h2>
                    <button onClick={handleGenerateClick} disabled={isGenerateDisabled} className="w-full py-4 px-6 text-lg font-bold rounded-lg shadow-lg flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 disabled:from-gray-600 disabled:cursor-not-allowed">
                        {isGenerating ? <><Spinner /> <span className="ml-2">Đang vẽ...</span></> : 'Bắt đầu Vẽ Tiếp'}
                    </button>
                </div>
                
                 {(isGenerating || resultUrl) &&
                     <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg animate-fade-in">
                         <h2 className="text-2xl font-semibold text-gray-100 mb-4">Kết quả</h2>
                         <div className="relative w-full aspect-video bg-gray-900/50 rounded-xl flex justify-center items-center overflow-hidden">
                             {isGenerating ? (
                                 <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center z-10 p-4">
                                     <Spinner />
                                     <p className="mt-4 text-lg text-gray-200 text-center">AI đang mở rộng thế giới của bạn...</p>
                                 </div>
                             ) : (
                                resultUrl && <img src={resultUrl} alt="Outpainting result" className="object-contain w-full h-full" />
                             )}
                         </div>
                         {resultUrl && !isGenerating && (
                             <a href={resultUrl} download="ai-outpainting.png" className="w-full mt-4 text-center block py-3 px-6 text-md font-semibold rounded-lg shadow-md bg-green-600 text-white hover:bg-green-700">
                                Tải xuống
                            </a>
                         )}
                     </div>
                 }
                {error && <div className="p-4 bg-red-900/50 border-red-500/50 rounded-lg text-red-300 text-center mt-4">{error}</div>}
            </div>
        </div>
    );
};

export default Outpainting;