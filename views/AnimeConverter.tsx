import React, { useState, useCallback } from 'react';
import ImageUploader from '../components/ImageUploader';
import Spinner from '../components/Spinner';
import BeforeAfterSlider from '../components/BeforeAfterSlider';
import { convertToAnime } from '../services/geminiService';
import { addToHistory } from '../services/historyService';

interface AnimeConverterProps {
  requireAuth: () => boolean;
}

const ANIME_STYLES = [
    { id: 'default', name: 'Mặc định', prompt: 'a modern, high-quality anime style' },
    { id: '90s', name: 'Thập niên 90', prompt: 'a retro 90s anime style with film grain and cel shading' },
    { id: 'ghibli', name: 'Studio Ghibli', prompt: 'a beautiful and whimsical Studio Ghibli-inspired art style' },
    { id: 'shinkai', name: 'Makoto Shinkai', prompt: 'a breathtaking Makoto Shinkai-inspired style with detailed backgrounds and dramatic lighting' },
];

const AnimeConverter: React.FC<AnimeConverterProps> = ({ requireAuth }) => {
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [originalUrl, setOriginalUrl] = useState<string | null>(null);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [quote, setQuote] = useState<string | null>(null);
    const [requestQuote, setRequestQuote] = useState<boolean>(true);
    const [animeStyle, setAnimeStyle] = useState<string>('default');
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState<boolean>(false);

    const handleImageUpload = useCallback((file: File) => {
        if (originalUrl) URL.revokeObjectURL(originalUrl);
        setOriginalFile(file);
        setOriginalUrl(URL.createObjectURL(file));
        setError(null);
        setResultUrl(null);
        setQuote(null);
    }, [originalUrl]);

    const handleImageClear = useCallback(() => {
        if (originalUrl) URL.revokeObjectURL(originalUrl);
        setOriginalFile(null);
        setOriginalUrl(null);
        setError(null);
        setResultUrl(null);
        setQuote(null);
    }, [originalUrl]);

    const handleGenerateClick = async () => {
        if (!requireAuth()) return;

        if (!originalFile) {
            setError("Vui lòng tải lên một ảnh.");
            return;
        }
        setIsGenerating(true);
        setError(null);
        setResultUrl(null);
        setQuote(null);
        try {
            const stylePrompt = ANIME_STYLES.find(s => s.id === animeStyle)?.prompt;
            const { imageUrl, quote: generatedQuote } = await convertToAnime(originalFile, requestQuote, stylePrompt);
            setResultUrl(imageUrl);
            setQuote(generatedQuote);
            if(originalUrl) {
                addToHistory(imageUrl, 'animeConverter', `Anime Conversion${requestQuote && generatedQuote ? ` with quote: "${generatedQuote}"` : ''}`, `Style: ${animeStyle}`, [{ url: originalUrl, label: 'Ảnh gốc' }]);
            }
        } catch (err: any) {
            setError(err.message || "Đã xảy ra lỗi không xác định.");
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleCopyQuote = () => {
        if (!quote || copied) return;
        navigator.clipboard.writeText(quote);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isGenerateDisabled = !originalFile || isGenerating;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-8 animate-fade-in">
            {/* Left Column */}
            <div className="w-full space-y-8">
                <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">1. Tải lên Ảnh</h2>
                    <ImageUploader onImageUpload={handleImageUpload} onImageClear={handleImageClear} imageUrl={originalUrl} />
                </div>
                <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">2. Tùy chọn</h2>
                     <div className="flex items-center justify-center">
                        <input
                            type="checkbox"
                            id="quote-checkbox"
                            checked={requestQuote}
                            onChange={(e) => setRequestQuote(e.target.checked)}
                            className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                        />
                        <label htmlFor="quote-checkbox" className="ml-3 text-md font-medium text-gray-300">
                            Kèm theo câu thoại anime
                        </label>
                    </div>
                    <details className="mt-6 group">
                        <summary className="list-none flex items-center justify-center cursor-pointer text-purple-400 font-semibold">
                          <span>Tùy chọn Nâng cao</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 transition-transform group-open:rotate-90" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                        </summary>
                        <div className="mt-4 pt-4 border-t border-white/10 animate-fade-in">
                           <h3 className="text-lg font-semibold text-gray-200 text-center">Phong cách Anime</h3>
                           <div className="grid grid-cols-2 gap-3 mt-3">
                                {ANIME_STYLES.map(opt => (
                                    <button key={opt.id} onClick={() => setAnimeStyle(opt.id)} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${animeStyle === opt.id ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                        {opt.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </details>
                </div>
            </div>

            {/* Right Column */}
            <div className="w-full space-y-6 lg:sticky top-8">
                <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">3. Chuyển đổi</h2>
                    <button onClick={handleGenerateClick} disabled={isGenerateDisabled} className="w-full py-4 px-6 text-lg font-bold rounded-lg shadow-lg flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 disabled:from-gray-600 disabled:cursor-not-allowed">
                        {isGenerating ? <><Spinner /> <span className="ml-2">Đang vẽ...</span></> : '✨ Chuyển thành Anime'}
                    </button>
                </div>
                
                 {(isGenerating || resultUrl) &&
                     <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg animate-fade-in">
                         <h2 className="text-2xl font-semibold text-gray-100 mb-4">Kết quả</h2>
                         <div className="relative w-full aspect-square bg-gray-900/50 rounded-xl flex justify-center items-center overflow-hidden">
                             {isGenerating ? (
                                 <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center z-10 p-4">
                                     <Spinner />
                                     <p className="mt-4 text-lg text-gray-200 text-center">AI đang vẽ theo phong cách anime...</p>
                                 </div>
                             ) : (
                                resultUrl && originalUrl && <BeforeAfterSlider before={originalUrl} after={resultUrl} />
                             )}
                         </div>
                         
                         {quote && !isGenerating && (
                            <div className="mt-4 p-6 bg-gray-800/50 rounded-lg border border-purple-500/30 relative overflow-hidden animate-fade-in">
                               <span className="absolute top-0 left-2 text-8xl font-serif text-purple-500/10 select-none">“</span>
                               <p className="relative text-xl italic text-gray-200 text-center leading-relaxed z-10 px-4">
                                   {quote}
                               </p>
                               <div className="flex justify-end mt-2 pr-2">
                                   <button onClick={handleCopyQuote} className="px-3 py-1 text-xs font-semibold rounded-md bg-gray-700 hover:bg-gray-600 text-white transition-colors flex items-center gap-1">
                                       <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                       {copied ? 'Đã sao chép!' : 'Sao chép'}
                                   </button>
                               </div>
                               <span className="absolute bottom-[-2rem] right-0 text-8xl font-serif text-purple-500/10 select-none transform rotate-180">“</span>
                           </div>
                         )}

                         {resultUrl && !isGenerating && (
                            <a href={resultUrl} download="ai-anime.png" className="w-full mt-4 text-center block py-3 px-6 text-md font-semibold rounded-lg shadow-md bg-green-600 text-white hover:bg-green-700">
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

export default AnimeConverter;