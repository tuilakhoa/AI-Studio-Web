import React, { useState } from 'react';
import Spinner from '../components/Spinner';
import ImageEditor from '../components/ImageEditor';
import { generateImageFromPrompt, upscaleImage } from '../services/geminiService';
import { addToHistory } from '../services/historyService';

type ImageAspectRatio = "9:16" | "3:4" | "1:1";
const ASPECT_RATIOS: { id: ImageAspectRatio; name: string }[] = [
    { id: '9:16', name: 'Cao' },
    { id: '3:4', name: 'Chân dung' },
    { id: '1:1', name: 'Vuông' },
];

const CHARACTER_STYLES = [
    { id: 'photorealistic', name: 'Siêu thực' },
    { id: 'anime', name: 'Anime' },
    { id: 'fantasy', name: 'Fantasy Art' },
    { id: 'cyberpunk', name: 'Cyberpunk' },
    { id: 'cartoon', name: 'Hoạt hình' },
];

interface FullBodyGeneratorProps {
  requireAuth: () => boolean;
}

const FullBodyGenerator: React.FC<FullBodyGeneratorProps> = ({ requireAuth }) => {
    const [prompt, setPrompt] = useState<string>('một nữ hiệp sĩ trong bộ giáp bạc sáng bóng, đang đứng trên một cánh đồng hoa');
    const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>('9:16');
    const [characterStyle, setCharacterStyle] = useState<string>('photorealistic');
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [isUpscaling, setIsUpscaling] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateClick = async () => {
        if (!requireAuth()) return;

        if (!prompt.trim()) {
            setError("Vui lòng nhập mô tả nhân vật.");
            return;
        }
        setIsGenerating(true);
        setError(null);
        setResultUrl(null);
        try {
            const finalPrompt = `Full body shot of a character described as: "${prompt}". The style should be ${characterStyle}. Ensure the entire body is visible from head to toe.`;
            const newResultUrl = await generateImageFromPrompt(finalPrompt, aspectRatio);
            setResultUrl(newResultUrl);
            addToHistory(newResultUrl, 'fullbody', finalPrompt, `Style: ${characterStyle}`);
        } catch (err: any) {
            setError(err.message || "Đã xảy ra lỗi không xác định.");
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleEditComplete = (newImageUrl: string, description: string) => {
        setResultUrl(newImageUrl);
        addToHistory(newImageUrl, 'fullbody', description, "Edited");
    };

    const handleUpscaleClick = async () => {
        if (!resultUrl) return;
        setIsUpscaling(true);
        setError(null);
        try {
            const mimeType = resultUrl.split(';')[0].split(':')[1];
            const upscaledUrl = await upscaleImage(resultUrl, mimeType);
            setResultUrl(upscaledUrl);
            addToHistory(upscaledUrl, 'fullbody', 'Upscaled Image');
        } catch (err: any) {
            setError(err.message || "Không thể nâng cấp ảnh.");
        } finally {
            setIsUpscaling(false);
        }
    };

    const isGenerateDisabled = !prompt.trim() || isGenerating || isUpscaling || isEditing;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-8 animate-fade-in">
            {/* Left Column */}
            <div className="w-full space-y-6">
                <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md">
                    <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">1. Mô tả Nhân vật</h2>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Ví dụ: một thám tử cyberpunk với áo khoác dài, đứng trong một con hẻm mưa neon..."
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-purple-500"
                        rows={6}
                    />
                </div>
                 <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md">
                    <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">2. Cài đặt</h2>
                     <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-200 mb-3 text-center">Phong cách</h3>
                            <div className="flex justify-center flex-wrap gap-2">
                                {CHARACTER_STYLES.map(style => (
                                    <button
                                        key={style.id}
                                        onClick={() => setCharacterStyle(style.id)}
                                        className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${characterStyle === style.id ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                                    >{style.name}</button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-200 mb-3 text-center">Tỷ lệ khung hình</h3>
                            <div className="flex justify-center flex-wrap gap-2">
                                {ASPECT_RATIOS.map(ratio => (
                                    <button
                                        key={ratio.id}
                                        onClick={() => setAspectRatio(ratio.id)}
                                        className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${aspectRatio === ratio.id ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                                    >{ratio.name} ({ratio.id})</button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column */}
            <div className="w-full space-y-6 lg:sticky top-8">
                <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md">
                    <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">3. Bắt đầu tạo</h2>
                     <button onClick={handleGenerateClick} disabled={isGenerateDisabled} className="w-full py-4 px-6 text-lg font-bold rounded-lg shadow-lg transition-all duration-300 ease-in-out flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-600 disabled:cursor-not-allowed">
                         {isGenerating ? <><Spinner /> <span className="ml-2">Đang tạo...</span></> : 'Tạo Nhân vật'}
                     </button>
                </div>
                
                 {(isGenerating || resultUrl) &&
                     <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md animate-fade-in">
                         <h2 className="text-2xl font-semibold text-gray-100 mb-4">Kết quả</h2>
                         <div className="relative w-full aspect-[9/16] bg-gray-900/50 rounded-xl flex justify-center items-center overflow-hidden">
                             {isGenerating && (
                                 <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center z-10 p-4">
                                     <Spinner />
                                     <p className="mt-4 text-lg text-gray-200 text-center">Đang tạo nhân vật của bạn...</p>
                                 </div>
                             )}
                             {resultUrl && <img src={resultUrl} alt="Generated character" className="object-contain w-full h-full" />}
                         </div>
                     </div>
                 }

                {resultUrl && !isGenerating && (
                    <>
                        <ImageEditor imageUrl={resultUrl} onEditComplete={handleEditComplete} onStartEditing={() => setIsEditing(true)} onEndEditing={() => setIsEditing(false)} />
                        <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md">
                             <h3 className="text-xl font-semibold text-gray-200 mb-3">Xuất ảnh</h3>
                            <div className="flex gap-4 mt-4">
                                <button
                                    onClick={handleUpscaleClick}
                                    disabled={isUpscaling || isEditing}
                                    className="w-full text-center py-3 px-6 text-md font-semibold rounded-lg shadow-md bg-orange-600 text-white hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                                >{isUpscaling ? 'Đang nâng cấp...' : 'Nâng cấp 2x'}</button>
                                <a href={resultUrl} download="ai-character.png" className={`w-full text-center block py-3 px-6 text-md font-semibold rounded-lg shadow-md bg-green-600 text-white hover:bg-green-700 ${isEditing ? 'pointer-events-none opacity-50' : ''}`}>
                                    Tải xuống
                                </a>
                            </div>
                        </div>
                    </>
                )}
                {error && <div className="p-4 bg-red-900/50 border-red-500/50 rounded-lg text-red-300 text-center mt-4">{error}</div>}
            </div>
        </div>
    );
};

export default FullBodyGenerator;