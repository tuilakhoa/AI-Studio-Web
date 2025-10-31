import React, { useState, useEffect, useCallback } from 'react';
import Spinner from '../components/Spinner';
import ImageUploader from '../components/ImageUploader';
import { generateVideoFromImage } from '../services/geminiService';
import { addToHistory } from '../services/historyService';

const MOTION_STYLES = [
    { id: 'subtle', name: 'Tinh tế', prompt: 'a subtle smile and a slow turn of the head to the right' },
    { id: 'pan_left', name: 'Lia trái', prompt: 'The camera slowly pans from right to left' },
    { id: 'zoom_in', name: 'Phóng to', prompt: 'a slow zoom in effect on the subject' },
    { id: 'dynamic', name: 'Sống động', prompt: 'The subject comes to life with dynamic movement' },
];

interface VideoComposerProps {
  requireAuth: () => boolean;
}

const VideoComposer: React.FC<VideoComposerProps> = ({ requireAuth }) => {
    const [sourceImageFile, setSourceImageFile] = useState<File | null>(null);
    const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>('Animate this person with a subtle smile and a slow turn of the head to the right.');
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [progressMessage, setProgressMessage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [motionStyle, setMotionStyle] = useState<string>('subtle');

    const handleImageUpload = useCallback((file: File) => {
        if (sourceImageUrl) URL.revokeObjectURL(sourceImageUrl);
        setSourceImageFile(file);
        setSourceImageUrl(URL.createObjectURL(file));
        setError(null);
    }, [sourceImageUrl]);

    const handleImageClear = useCallback(() => {
        if (sourceImageUrl) URL.revokeObjectURL(sourceImageUrl);
        setSourceImageFile(null);
        setSourceImageUrl(null);
        setError(null);
    }, [sourceImageUrl]);
    
    const handleMotionStyleSelect = (styleId: string) => {
        const selected = MOTION_STYLES.find(s => s.id === styleId);
        if (selected) {
            setMotionStyle(styleId);
            setPrompt(selected.prompt);
        }
    };
    
    const handleGenerateClick = async () => {
        if (!requireAuth()) return;

        if (!sourceImageFile) {
            setError("Vui lòng tải lên một ảnh nguồn.");
            return;
        }
        if (!prompt.trim()) {
            setError("Vui lòng nhập một yêu cầu cho video.");
            return;
        }

        setIsGenerating(true);
        setError(null);
        setGeneratedVideoUrl(null);
        
        try {
            const resultUrl = await generateVideoFromImage(
                sourceImageFile, 
                prompt, 
                setProgressMessage
            );
            setGeneratedVideoUrl(resultUrl);
            if (sourceImageUrl) {
                addToHistory(resultUrl, 'video', prompt, undefined, [{ url: sourceImageUrl, label: 'Ảnh gốc' }]);
            }
        } catch (err: any) {
            setError(err.message || "Đã xảy ra lỗi không xác định khi tạo video.");
        } finally {
            setIsGenerating(false);
            setProgressMessage('');
        }
    };

    const isGenerateDisabled = !sourceImageFile || !prompt.trim() || isGenerating;
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-8 animate-fade-in">
            {/* Left Column */}
            <div className="w-full space-y-8">
                 <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md">
                    <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">1. Ảnh nguồn</h2>
                    <ImageUploader onImageUpload={handleImageUpload} onImageClear={handleImageClear} imageUrl={sourceImageUrl} />
                </div>
                 <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md">
                    <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">2. Yêu cầu Video</h2>
                     <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-200 mb-3 text-center">Chọn kiểu chuyển động</h3>
                        <div className="flex justify-center flex-wrap gap-2">
                            {MOTION_STYLES.map(style => (
                                <button
                                    key={style.id}
                                    onClick={() => handleMotionStyleSelect(style.id)}
                                    className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                                        motionStyle === style.id
                                        ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
                                    }`}
                                >
                                    {style.name}
                                </button>
                            ))}
                        </div>
                    </div>
                     <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Ví dụ: làm cho người này mỉm cười và gật đầu..."
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                        rows={3}
                    />
                </div>
            </div>

            {/* Right Column */}
            <div className="w-full space-y-6 lg:sticky top-8">
                <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md">
                    <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">3. Tạo Video</h2>
                     <button onClick={handleGenerateClick} disabled={isGenerateDisabled} className="w-full py-4 px-6 text-lg font-bold rounded-lg shadow-lg transition-all duration-300 ease-in-out flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 hover:shadow-purple-500/50 focus:outline-none focus:ring-4 focus:ring-purple-400 focus:ring-opacity-50 disabled:from-gray-600 disabled:to-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none">
                        {isGenerating ? <><Spinner /> <span className="ml-2">Đang tạo...</span></> : 'Tạo Video'}
                    </button>
                </div>

                {(isGenerating || generatedVideoUrl) &&
                    <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md animate-fade-in">
                        <h2 className="text-2xl font-semibold text-gray-100 mb-4">Kết quả</h2>
                        <div className="relative w-full aspect-square bg-gray-900/50 rounded-xl flex justify-center items-center overflow-hidden">
                            {isGenerating ? (
                                <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center z-10 p-4">
                                    <Spinner />
                                    <p className="mt-4 text-lg text-gray-200 text-center">{progressMessage || 'Đang tạo video...'}</p>
                                    <p className="mt-2 text-sm text-gray-400 text-center">Việc này có thể mất vài phút.</p>
                                </div>
                            ) : (
                                generatedVideoUrl && <video src={generatedVideoUrl} controls autoPlay loop className="object-contain w-full h-full" />
                            )}
                        </div>
                        {generatedVideoUrl && !isGenerating && (
                            <a href={generatedVideoUrl} download="ai-video.mp4" className="w-full mt-4 text-center block py-3 px-6 text-md font-semibold rounded-lg shadow-md bg-green-600 text-white hover:bg-green-700">
                                Tải xuống
                            </a>
                        )}
                    </div>
                }

                {error && <div className="p-4 bg-red-900/50 border border-red-500/50 rounded-lg text-red-300 text-center mt-4">{error}</div>}
            </div>
        </div>
    );
};

export default VideoComposer;