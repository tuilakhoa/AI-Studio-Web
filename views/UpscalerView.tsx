import React, { useState, useCallback } from 'react';
import ImageUploader from '../components/ImageUploader';
import Spinner from '../components/Spinner';
import BeforeAfterSlider from '../components/BeforeAfterSlider';
import { upscaleImage } from '../services/geminiService';
import { addToHistory } from '../services/historyService';

interface UpscalerViewProps {
  requireAuth: () => boolean;
}

const UpscalerView: React.FC<UpscalerViewProps> = ({ requireAuth }) => {
    const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
    const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
    const [upscaledImageUrl, setUpscaledImageUrl] = useState<string | null>(null);
    const [isUpscaling, setIsUpscaling] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [shareFeedback, setShareFeedback] = useState<string>('');

    const handleImageUpload = useCallback((file: File) => {
        if (originalImageUrl) {
            URL.revokeObjectURL(originalImageUrl);
        }
        setOriginalImageFile(file);
        setOriginalImageUrl(URL.createObjectURL(file));
        setUpscaledImageUrl(null);
        setError(null);
    }, [originalImageUrl]);

    const handleImageClear = useCallback(() => {
        if (originalImageUrl) {
            URL.revokeObjectURL(originalImageUrl);
        }
        setOriginalImageFile(null);
        setOriginalImageUrl(null);
        setUpscaledImageUrl(null);
        setError(null);
    }, [originalImageUrl]);
    
    const handleUpscaleClick = async () => {
        if (!requireAuth()) return;

        if (!originalImageUrl) {
            setError("Vui lòng tải lên một ảnh để nâng cấp.");
            return;
        }

        setIsUpscaling(true);
        setError(null);
        setUpscaledImageUrl(null);

        try {
            const mimeType = originalImageUrl.split(';')[0].split(':')[1];
            const resultUrl = await upscaleImage(originalImageUrl, mimeType);
            setUpscaledImageUrl(resultUrl);
            addToHistory(resultUrl, 'freestyle', 'Upscaled Image', undefined, [{ url: originalImageUrl, label: 'Ảnh gốc' }]);
        } catch (err: any) {
            setError(err.message || "Đã xảy ra lỗi không xác định.");
        } finally {
            setIsUpscaling(false);
        }
    };

    const handleShare = async () => {
        if (!upscaledImageUrl) return;
        setShareFeedback('Đang chuẩn bị...');
        try {
            const response = await fetch(upscaledImageUrl);
            const blob = await response.blob();
            const file = new File([blob], 'upscaled-photo.png', { type: blob.type });

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'AI Photo Upscale',
                    text: 'Ảnh này đã được nâng cấp bằng AI Studio!',
                    files: [file],
                });
                setShareFeedback('Đã chia sẻ!');
            } else if (navigator.clipboard?.write) {
                await navigator.clipboard.write([ new ClipboardItem({ [blob.type]: blob }) ]);
                setShareFeedback('Đã sao chép ảnh!');
            } else {
                throw new Error('Chia sẻ hoặc sao chép không được hỗ trợ trên trình duyệt này.');
            }
        } catch (err: any) {
            console.error('Lỗi khi chia sẻ:', err);
            setShareFeedback('Chia sẻ thất bại.');
        } finally {
            setTimeout(() => setShareFeedback(''), 3000);
        }
    };

    const isUpscaleDisabled = !originalImageFile || isUpscaling;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-8 animate-fade-in">
            {/* Left Column */}
            <div className="w-full space-y-8">
                <ImageUploader 
                    onImageUpload={handleImageUpload} 
                    onImageClear={handleImageClear}
                    imageUrl={originalImageUrl} 
                />
                 <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md">
                    <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">2. Nâng cấp Ảnh</h2>
                    <p className="text-center text-gray-400 mb-4">Sử dụng AI để tăng độ phân giải và làm sắc nét các chi tiết trong ảnh của bạn.</p>
                    <button
                        onClick={handleUpscaleClick}
                        disabled={isUpscaleDisabled}
                        className="w-full mt-6 py-4 px-6 text-lg font-bold rounded-lg shadow-lg transition-all duration-300 ease-in-out flex items-center justify-center
                                    bg-gradient-to-r from-purple-600 to-indigo-600 text-white
                                    hover:from-purple-700 hover:to-indigo-700 hover:shadow-purple-500/50
                                    focus:outline-none focus:ring-4 focus:ring-purple-400 focus:ring-opacity-50
                                    disabled:from-gray-600 disabled:to-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        {isUpscaling ? <><Spinner /> <span className="ml-2">Đang nâng cấp...</span></> : '🔎 Nâng cấp ngay'}
                    </button>
                </div>
            </div>

            {/* Right Column */}
            <div className="w-full space-y-6 lg:sticky top-8">
                {(isUpscaling) &&
                    <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md animate-fade-in">
                        <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">Kết quả</h2>
                         <div className="relative w-full aspect-square bg-gray-900/50 border-2 border-gray-700 rounded-xl flex justify-center items-center overflow-hidden">
                            <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center z-10 rounded-lg">
                                <Spinner />
                                <p className="mt-4 text-lg text-gray-200">AI đang thêm chi tiết...</p>
                            </div>
                         </div>
                    </div>
                }

                {upscaledImageUrl && !isUpscaling && (
                    <>
                        <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md animate-fade-in">
                            <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">So sánh Trước & Sau</h2>
                            <div className="relative w-full aspect-square bg-gray-900/50 border-2 border-gray-700 rounded-xl flex justify-center items-center overflow-hidden">
                                {originalImageUrl && <BeforeAfterSlider before={originalImageUrl} after={upscaledImageUrl} />}
                            </div>
                        </div>
                         <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md animate-fade-in">
                             <h3 className="text-xl font-semibold text-gray-200 mb-3">Xuất ảnh</h3>
                             <div className="flex flex-col sm:flex-row gap-4 mt-4">
                                <button
                                    onClick={handleShare}
                                    disabled={!!shareFeedback}
                                    className="w-full sm:w-auto flex-grow text-center py-3 px-6 text-md font-semibold rounded-lg shadow-md transition-all duration-300 ease-in-out
                                            bg-indigo-600 text-white hover:bg-indigo-700
                                            focus:outline-none focus:ring-4 focus:ring-indigo-400
                                            disabled:bg-gray-600 disabled:cursor-not-allowed"
                                >
                                    {shareFeedback || 'Chia sẻ'}
                                </button>
                                <a 
                                    href={upscaledImageUrl} 
                                    download="upscaled-photo.png"
                                    className={`w-full sm:w-auto flex-grow text-center block py-3 px-6 text-md font-semibold rounded-lg shadow-md transition-all duration-300 ease-in-out
                                            bg-green-600 text-white hover:bg-green-700
                                            focus:outline-none focus:ring-4 focus:ring-green-400`}
                                >
                                    Tải xuống
                                </a>
                            </div>
                        </div>
                    </>
                )}

                {error && <div className="p-4 bg-red-900/50 border border-red-500/50 rounded-lg text-red-300 text-center animate-fade-in">{error}</div>}
            </div>
        </div>
    );
};

export default UpscalerView;