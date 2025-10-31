import React, { useState, useCallback } from 'react';
import ImageUploader from '../components/ImageUploader';
import Spinner from '../components/Spinner';
import BeforeAfterSlider from '../components/BeforeAfterSlider';
import { stylizePortrait } from '../services/geminiService';
import { addToHistory } from '../services/historyService';
import { PORTRAIT_STYLES } from '../constants';
import { PortraitStyle } from '../types';

interface PortraitStylizerProps {
  requireAuth: () => boolean;
}

const PortraitStylizer: React.FC<PortraitStylizerProps> = ({ requireAuth }) => {
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [originalUrl, setOriginalUrl] = useState<string | null>(null);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [selectedStyle, setSelectedStyle] = useState<PortraitStyle | null>(null);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleImageUpload = useCallback((file: File) => {
        if (originalUrl) URL.revokeObjectURL(originalUrl);
        setOriginalFile(file);
        setOriginalUrl(URL.createObjectURL(file));
        setError(null);
        setResultUrl(null);
    }, [originalUrl]);

    const handleImageClear = useCallback(() => {
        if (originalUrl) URL.revokeObjectURL(originalUrl);
        setOriginalFile(null);
        setOriginalUrl(null);
        setError(null);
        setResultUrl(null);
    }, [originalUrl]);

    const handleGenerateClick = async () => {
        if (!requireAuth()) return;

        if (!originalFile || !selectedStyle) {
            setError("Vui lòng tải lên ảnh và chọn một phong cách.");
            return;
        }
        setIsGenerating(true);
        setError(null);
        try {
            const newResultUrl = await stylizePortrait(originalFile, selectedStyle.prompt);
            setResultUrl(newResultUrl);
            if(originalUrl) {
                addToHistory(newResultUrl, 'stylizer', selectedStyle.prompt, `Style: ${selectedStyle.name}`, [{ url: originalUrl, label: 'Ảnh gốc' }]);
            }
        } catch (err: any) {
            setError(err.message || "Đã xảy ra lỗi không xác định.");
        } finally {
            setIsGenerating(false);
        }
    };

    const isGenerateDisabled = !originalFile || !selectedStyle || isGenerating;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-8 animate-fade-in">
            {/* Left Column */}
            <div className="w-full space-y-8">
                <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">1. Tải lên Chân dung</h2>
                    <ImageUploader onImageUpload={handleImageUpload} onImageClear={handleImageClear} imageUrl={originalUrl} />
                </div>
                <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">2. Chọn Phong cách</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {PORTRAIT_STYLES.map((style) => (
                          <button key={style.id} onClick={() => setSelectedStyle(style)} className={`relative group rounded-lg overflow-hidden aspect-square focus:outline-none transition-all transform hover:scale-105 ${selectedStyle?.id === style.id ? 'ring-4 ring-purple-500' : 'ring-2 ring-transparent hover:ring-purple-400'}`}>
                            <img src={style.thumbnail} alt={style.name} className="w-full h-full object-cover"/>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2">
                              <span className="text-white text-sm font-semibold">{style.name}</span>
                            </div>
                          </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column */}
            <div className="w-full space-y-6 lg:sticky top-8">
                <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">3. Tạo Chân dung</h2>
                    <button onClick={handleGenerateClick} disabled={isGenerateDisabled} className="w-full py-4 px-6 text-lg font-bold rounded-lg shadow-lg flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 disabled:from-gray-600 disabled:cursor-not-allowed">
                        {isGenerating ? <><Spinner /> <span className="ml-2">Đang vẽ...</span></> : 'Tạo Chân dung'}
                    </button>
                </div>
                
                 {(isGenerating || resultUrl) &&
                     <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg animate-fade-in">
                         <h2 className="text-2xl font-semibold text-gray-100 mb-4">Kết quả</h2>
                         <div className="relative w-full aspect-square bg-gray-900/50 rounded-xl flex justify-center items-center overflow-hidden">
                             {isGenerating ? (
                                 <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center z-10 p-4">
                                     <Spinner />
                                     <p className="mt-4 text-lg text-gray-200 text-center">AI đang sáng tạo...</p>
                                 </div>
                             ) : (
                                resultUrl && originalUrl && <BeforeAfterSlider before={originalUrl} after={resultUrl} />
                             )}
                         </div>
                         {resultUrl && !isGenerating && (
                             <a href={resultUrl} download="ai-stylized.png" className="w-full mt-4 text-center block py-3 px-6 text-md font-semibold rounded-lg shadow-md bg-green-600 text-white hover:bg-green-700">
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

export default PortraitStylizer;