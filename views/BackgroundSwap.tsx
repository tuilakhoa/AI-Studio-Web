import React, { useState, useCallback } from 'react';
import ImageUploader from '../components/ImageUploader';
import Spinner from '../components/Spinner';
import BeforeAfterSlider from '../components/BeforeAfterSlider';
import { swapBackground } from '../services/geminiService';
import { addToHistory } from '../services/historyService';

interface BackgroundSwapProps {
  requireAuth: () => boolean;
}

const BackgroundSwap: React.FC<BackgroundSwapProps> = ({ requireAuth }) => {
    const [subjectFile, setSubjectFile] = useState<File | null>(null);
    const [subjectUrl, setSubjectUrl] = useState<string | null>(null);
    const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
    const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
    const [backgroundPrompt, setBackgroundPrompt] = useState<string>('');
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubjectUpload = useCallback((file: File) => {
        if (subjectUrl) URL.revokeObjectURL(subjectUrl);
        setSubjectFile(file);
        setSubjectUrl(URL.createObjectURL(file));
        setError(null);
    }, [subjectUrl]);

    const handleSubjectClear = useCallback(() => {
        if (subjectUrl) URL.revokeObjectURL(subjectUrl);
        setSubjectFile(null);
        setSubjectUrl(null);
        setError(null);
    }, [subjectUrl]);

    const handleBackgroundUpload = useCallback((file: File) => {
        if (backgroundUrl) URL.revokeObjectURL(backgroundUrl);
        setBackgroundFile(file);
        setBackgroundUrl(URL.createObjectURL(file));
        setBackgroundPrompt(''); // Clear prompt if file is uploaded
        setError(null);
    }, [backgroundUrl]);

    const handleBackgroundClear = useCallback(() => {
        if (backgroundUrl) URL.revokeObjectURL(backgroundUrl);
        setBackgroundFile(null);
        setBackgroundUrl(null);
        setError(null);
    }, [backgroundUrl]);

    const handleGenerateClick = async () => {
        if (!requireAuth()) return;

        if (!subjectFile) {
            setError("Vui lòng tải lên ảnh chủ thể.");
            return;
        }
        if (!backgroundFile && !backgroundPrompt.trim()) {
            setError("Vui lòng tải lên ảnh nền hoặc mô tả nền.");
            return;
        }
        setIsGenerating(true);
        setError(null);
        setResultUrl(null);
        try {
            const newResultUrl = await swapBackground(subjectFile, backgroundFile || undefined, backgroundPrompt || undefined);
            setResultUrl(newResultUrl);

            const inputs = [];
            if(subjectUrl) inputs.push({ url: subjectUrl, label: "Chủ thể" });
            if(backgroundUrl) inputs.push({ url: backgroundUrl, label: "Nền" });

            addToHistory(newResultUrl, 'backgroundswap', backgroundPrompt || `Background from ${backgroundFile?.name}`, `Subject from ${subjectFile.name}`, inputs);
        } catch (err: any) {
            setError(err.message || "Đã xảy ra lỗi không xác định.");
        } finally {
            setIsGenerating(false);
        }
    };

    const isGenerateDisabled = !subjectFile || (!backgroundFile && !backgroundPrompt.trim()) || isGenerating;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-8 animate-fade-in">
            {/* Left Column */}
            <div className="w-full space-y-8">
                <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">1. Ảnh Chủ thể</h2>
                    <ImageUploader onImageUpload={handleSubjectUpload} onImageClear={handleSubjectClear} imageUrl={subjectUrl} />
                </div>
                <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">2. Nền Mới</h2>
                    <ImageUploader onImageUpload={handleBackgroundUpload} onImageClear={handleBackgroundClear} imageUrl={backgroundUrl} />
                    <div className="my-4 text-center text-gray-400">hoặc tạo nền bằng AI</div>
                    <textarea
                        value={backgroundPrompt}
                        onChange={(e) => {
                            setBackgroundPrompt(e.target.value);
                            if (e.target.value) handleBackgroundClear(); // Clear uploaded file if typing
                        }}
                        placeholder="Ví dụ: một bãi biển nhiệt đới lúc hoàng hôn..."
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-purple-500"
                        rows={3}
                    />
                </div>
            </div>

            {/* Right Column */}
            <div className="w-full space-y-6 lg:sticky top-8">
                <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">3. Thay đổi Nền</h2>
                    <button onClick={handleGenerateClick} disabled={isGenerateDisabled} className="w-full py-4 px-6 text-lg font-bold rounded-lg shadow-lg flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 disabled:from-gray-600 disabled:cursor-not-allowed">
                        {isGenerating ? <><Spinner /> <span className="ml-2">Đang xử lý...</span></> : 'Bắt đầu Thay đổi'}
                    </button>
                </div>
                
                 {(isGenerating || resultUrl) &&
                     <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg animate-fade-in">
                         <h2 className="text-2xl font-semibold text-gray-100 mb-4">Kết quả</h2>
                         <div className="relative w-full aspect-square bg-gray-900/50 rounded-xl flex justify-center items-center overflow-hidden">
                             {isGenerating ? (
                                 <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center z-10 p-4">
                                     <Spinner />
                                     <p className="mt-4 text-lg text-gray-200 text-center">AI đang tách nền...</p>
                                 </div>
                             ) : (
                                resultUrl && subjectUrl && <BeforeAfterSlider before={subjectUrl} after={resultUrl} />
                             )}
                         </div>
                         {resultUrl && !isGenerating && (
                             <a href={resultUrl} download="ai-background-swap.png" className="w-full mt-4 text-center block py-3 px-6 text-md font-semibold rounded-lg shadow-md bg-green-600 text-white hover:bg-green-700">
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

export default BackgroundSwap;