import React, { useState, useCallback } from 'react';
import ImageUploader from '../components/ImageUploader';
import Spinner from '../components/Spinner';
import { morphObject } from '../services/geminiService';
import { addToHistory } from '../services/historyService';

const MORPH_SUGGESTIONS = [
    'biến thành một chiến binh con người',
    'biến thành một robot tương lai',
    'tưởng tượng lại như một sinh vật thần thoại',
    'hóa thành một tòa nhà chọc trời',
];

interface ArtMorphProps {
  requireAuth: () => boolean;
}

const ArtMorph: React.FC<ArtMorphProps> = ({ requireAuth }) => {
    const [sourceFile, setSourceFile] = useState<File | null>(null);
    const [sourceUrl, setSourceUrl] = useState<string | null>(null);
    const [morphPrompt, setMorphPrompt] = useState<string>('biến thành một chiến binh con người');
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleImageUpload = useCallback((file: File) => {
        if (sourceUrl) URL.revokeObjectURL(sourceUrl);
        setSourceFile(file);
        setSourceUrl(URL.createObjectURL(file));
        setError(null);
        setResultUrl(null);
    }, [sourceUrl]);

    const handleImageClear = useCallback(() => {
        if (sourceUrl) URL.revokeObjectURL(sourceUrl);
        setSourceFile(null);
        setSourceUrl(null);
        setError(null);
        setResultUrl(null);
    }, [sourceUrl]);

    const handleGenerateClick = async () => {
        if (!requireAuth()) return;

        if (!sourceFile) {
            setError("Vui lòng tải lên ảnh nguồn.");
            return;
        }
        if (!morphPrompt.trim()) {
            setError("Vui lòng mô tả sự biến đổi.");
            return;
        }
        setIsGenerating(true);
        setError(null);
        try {
            const newResultUrl = await morphObject(sourceFile, morphPrompt);
            setResultUrl(newResultUrl);
            if(sourceUrl) {
                addToHistory(newResultUrl, 'morph', morphPrompt, undefined, [{ url: sourceUrl, label: 'Ảnh gốc' }]);
            }
        } catch (err: any) {
            setError(err.message || "Đã xảy ra lỗi không xác định.");
        } finally {
            setIsGenerating(false);
        }
    };

    const isGenerateDisabled = !sourceFile || !morphPrompt.trim() || isGenerating;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-8 animate-fade-in">
            {/* Left Column */}
            <div className="w-full space-y-8">
                <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">1. Tải lên Ảnh Nguồn</h2>
                    <p className="text-center text-gray-400 text-sm mb-4">Chọn một con vật, đồ vật, hoặc bất cứ thứ gì bạn muốn biến đổi.</p>
                    <ImageUploader onImageUpload={handleImageUpload} onImageClear={handleImageClear} imageUrl={sourceUrl} />
                </div>
                <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">2. Mô tả Sự biến đổi</h2>
                    <textarea
                        value={morphPrompt}
                        onChange={(e) => setMorphPrompt(e.target.value)}
                        placeholder="Ví dụ: biến thành một chiến binh con người..."
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-purple-500"
                        rows={4}
                    />
                     <div className="mt-4">
                        <h3 className="text-sm font-semibold text-gray-400 mb-2">Thử một vài gợi ý:</h3>
                        <div className="flex flex-wrap gap-2">
                            {MORPH_SUGGESTIONS.map(suggestion => (
                                <button key={suggestion} onClick={() => setMorphPrompt(suggestion)} className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded-full transition-colors">{suggestion}</button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column */}
            <div className="w-full space-y-6 lg:sticky top-8">
                <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">3. Biến đổi</h2>
                    <button onClick={handleGenerateClick} disabled={isGenerateDisabled} className="w-full py-4 px-6 text-lg font-bold rounded-lg shadow-lg flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 disabled:from-gray-600 disabled:cursor-not-allowed">
                        {isGenerating ? <><Spinner /> <span className="ml-2">Đang biến đổi...</span></> : 'Bắt đầu Biến đổi'}
                    </button>
                </div>
                
                 {(isGenerating || resultUrl) &&
                     <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg animate-fade-in">
                         <h2 className="text-2xl font-semibold text-gray-100 mb-4">Kết quả</h2>
                         <div className="relative w-full aspect-square bg-gray-900/50 rounded-xl flex justify-center items-center overflow-hidden">
                             {isGenerating ? (
                                 <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center z-10 p-4">
                                     <Spinner />
                                     <p className="mt-4 text-lg text-gray-200 text-center">AI đang tái cấu trúc thực tại...</p>
                                 </div>
                             ) : (
                                resultUrl && <img src={resultUrl} alt="Art morph result" className="object-contain w-full h-full" />
                             )}
                         </div>
                         {resultUrl && !isGenerating && (
                             <a href={resultUrl} download="ai-morph.png" className="w-full mt-4 text-center block py-3 px-6 text-md font-semibold rounded-lg shadow-md bg-green-600 text-white hover:bg-green-700">
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

export default ArtMorph;