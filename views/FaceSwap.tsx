import React, { useState, useCallback } from 'react';
import ImageUploader from '../components/ImageUploader';
import Spinner from '../components/Spinner';
import { swapFaces } from '../services/geminiService';
import { addToHistory } from '../services/historyService';

interface FaceSwapProps {
  requireAuth: () => boolean;
}

const FaceSwap: React.FC<FaceSwapProps> = ({ requireAuth }) => {
    const [sourceFile, setSourceFile] = useState<File | null>(null);
    const [sourceUrl, setSourceUrl] = useState<string | null>(null);
    const [targetFile, setTargetFile] = useState<File | null>(null);
    const [targetUrl, setTargetUrl] = useState<string | null>(null);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleSourceUpload = useCallback((file: File) => {
        if (sourceUrl) URL.revokeObjectURL(sourceUrl);
        setSourceFile(file);
        setSourceUrl(URL.createObjectURL(file));
        setError(null);
    }, [sourceUrl]);

    const handleSourceClear = useCallback(() => {
        if (sourceUrl) URL.revokeObjectURL(sourceUrl);
        setSourceFile(null);
        setSourceUrl(null);
        setError(null);
    }, [sourceUrl]);

    const handleTargetUpload = useCallback((file: File) => {
        if (targetUrl) URL.revokeObjectURL(targetUrl);
        setTargetFile(file);
        setTargetUrl(URL.createObjectURL(file));
        setError(null);
    }, [targetUrl]);

    const handleTargetClear = useCallback(() => {
        if (targetUrl) URL.revokeObjectURL(targetUrl);
        setTargetFile(null);
        setTargetUrl(null);
        setError(null);
    }, [targetUrl]);

    const handleGenerateClick = async () => {
        if (!requireAuth()) return;

        if (!sourceFile || !targetFile) {
            setError("Vui lòng tải lên cả ảnh nguồn và ảnh đích.");
            return;
        }
        setIsGenerating(true);
        setError(null);
        setResultUrl(null);
        try {
            const newResultUrl = await swapFaces(sourceFile, targetFile);
            setResultUrl(newResultUrl);
            const inputs = [];
            if(sourceUrl) inputs.push({ url: sourceUrl, label: "Gương mặt nguồn" });
            if(targetUrl) inputs.push({ url: targetUrl, label: "Ảnh đích" });
            addToHistory(newResultUrl, 'faceswap', `Source: ${sourceFile.name}, Target: ${targetFile.name}`, undefined, inputs);
        } catch (err: any) {
            setError(err.message || "Đã xảy ra lỗi không xác định.");
        } finally {
            setIsGenerating(false);
        }
    };

    const isGenerateDisabled = !sourceFile || !targetFile || isGenerating;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-8 animate-fade-in">
            {/* Left Column */}
            <div className="w-full space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl shadow-lg">
                        <h2 className="text-xl font-semibold text-gray-100 mb-3 text-center">1. Gương mặt Nguồn</h2>
                        <ImageUploader onImageUpload={handleSourceUpload} onImageClear={handleSourceClear} imageUrl={sourceUrl} />
                    </div>
                    <div className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl shadow-lg">
                        <h2 className="text-xl font-semibold text-gray-100 mb-3 text-center">2. Ảnh Đích</h2>
                        <ImageUploader onImageUpload={handleTargetUpload} onImageClear={handleTargetClear} imageUrl={targetUrl} />
                    </div>
                </div>
                 <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">3. Hoán đổi</h2>
                    <button onClick={handleGenerateClick} disabled={isGenerateDisabled} className="w-full py-4 px-6 text-lg font-bold rounded-lg shadow-lg flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 disabled:from-gray-600 disabled:cursor-not-allowed">
                        {isGenerating ? <><Spinner /> <span className="ml-2">Đang hoán đổi...</span></> : 'Bắt đầu Hoán đổi'}
                    </button>
                </div>
            </div>

            {/* Right Column */}
            <div className="w-full space-y-6 lg:sticky top-8">
                 {(isGenerating || resultUrl) &&
                     <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg animate-fade-in">
                         <h2 className="text-2xl font-semibold text-gray-100 mb-4">Kết quả</h2>
                         <div className="relative w-full aspect-square bg-gray-900/50 rounded-xl flex justify-center items-center overflow-hidden">
                             {isGenerating ? (
                                 <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center z-10 p-4">
                                     <Spinner />
                                     <p className="mt-4 text-lg text-gray-200 text-center">AI đang thực hiện phép màu...</p>
                                 </div>
                             ) : (
                                resultUrl && <img src={resultUrl} alt="Face swap result" className="object-contain w-full h-full" />
                             )}
                         </div>
                         {resultUrl && !isGenerating && (
                             <a href={resultUrl} download="ai-face-swap.png" className="w-full mt-4 text-center block py-3 px-6 text-md font-semibold rounded-lg shadow-md bg-green-600 text-white hover:bg-green-700">
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

export default FaceSwap;