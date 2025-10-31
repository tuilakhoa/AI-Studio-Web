import React, { useState, useCallback } from 'react';
import ImageUploader from '../components/ImageUploader';
import Spinner from '../components/Spinner';
import BeforeAfterSlider from '../components/BeforeAfterSlider';
import ImageEditor from '../components/ImageEditor';
import { restorePhoto, upscaleImage } from '../services/geminiService';
import { addToHistory } from '../services/historyService';

interface PhotoRestorerProps {
  requireAuth: () => boolean;
}

const CLARITY_LEVELS: { id: 'subtle' | 'medium' | 'strong', name: string }[] = [
    { id: 'subtle', name: 'Nhẹ' },
    { id: 'medium', name: 'Vừa' },
    { id: 'strong', name: 'Mạnh' },
];

const PhotoRestorer: React.FC<PhotoRestorerProps> = ({ requireAuth }) => {
    const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
    const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
    const [restoredImageUrl, setRestoredImageUrl] = useState<string | null>(null);
    const [isRestoring, setIsRestoring] = useState<boolean>(false);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [isUpscaling, setIsUpscaling] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [shareFeedback, setShareFeedback] = useState<string>('');
    const [colorize, setColorize] = useState<boolean>(true);
    const [clarityLevel, setClarityLevel] = useState<'subtle' | 'medium' | 'strong'>('subtle');


    const handleImageUpload = useCallback((file: File) => {
        if (originalImageUrl) {
            URL.revokeObjectURL(originalImageUrl);
        }
        setOriginalImageFile(file);
        setOriginalImageUrl(URL.createObjectURL(file));
        setRestoredImageUrl(null);
        setError(null);
    }, [originalImageUrl]);

    const handleImageClear = useCallback(() => {
        if (originalImageUrl) {
            URL.revokeObjectURL(originalImageUrl);
        }
        setOriginalImageFile(null);
        setOriginalImageUrl(null);
        setRestoredImageUrl(null);
        setError(null);
    }, [originalImageUrl]);
    
    const handleRestoreClick = async () => {
        if (!requireAuth()) return;

        if (!originalImageFile) {
            setError("Vui lòng tải lên một ảnh để khôi phục.");
            return;
        }

        setIsRestoring(true);
        setError(null);
        setRestoredImageUrl(null);

        try {
            const resultUrl = await restorePhoto(originalImageFile, colorize, clarityLevel);
            setRestoredImageUrl(resultUrl);
            if(originalImageUrl) {
                addToHistory(resultUrl, 'restore', `${colorize ? 'Restore & Colorize' : 'Restore Only'} - Clarity: ${clarityLevel}`, undefined, [{ url: originalImageUrl, label: 'Ảnh gốc' }]);
            }
        } catch (err: any) {
            setError(err.message || "Đã xảy ra lỗi không xác định.");
        } finally {
            setIsRestoring(false);
        }
    };

    const handleEditComplete = (newImageUrl: string, description: string) => {
        if (restoredImageUrl) {
            addToHistory(newImageUrl, 'restore', description, "Edited", [{ url: restoredImageUrl, label: "Ảnh trước khi sửa" }]);
        }
        setRestoredImageUrl(newImageUrl);
    };

    const handleUpscaleClick = async () => {
        if (!restoredImageUrl) return;

        setIsUpscaling(true);
        setError(null);

        try {
            const mimeType = restoredImageUrl.split(';')[0].split(':')[1];
            const upscaledUrl = await upscaleImage(restoredImageUrl, mimeType);
            addToHistory(upscaledUrl, 'restore', 'Upscaled Image', undefined, [{ url: restoredImageUrl, label: "Ảnh trước khi nâng cấp" }]);
            setRestoredImageUrl(upscaledUrl);
        } catch (err: any) {
            setError(err.message || "Không thể nâng cấp ảnh.");
        } finally {
            setIsUpscaling(false);
        }
    };

    const handleShare = async () => {
        if (!restoredImageUrl) return;
        setShareFeedback('Đang chuẩn bị...');
        try {
            const response = await fetch(restoredImageUrl);
            const blob = await response.blob();
            const file = new File([blob], 'restored-photo.png', { type: blob.type });

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'AI Photo Restoration',
                    text: 'Bức ảnh cũ này đã được khôi phục bằng AI Studio!',
                    files: [file],
                });
                setShareFeedback('Đã chia sẻ!');
            } else if (navigator.clipboard?.write) {
                await navigator.clipboard.write([
                    new ClipboardItem({ [blob.type]: blob })
                ]);
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

    const isRestoreDisabled = !originalImageFile || isRestoring || isUpscaling || isEditing;
    const isLoading = isRestoring || isUpscaling;
    const clarityIndex = CLARITY_LEVELS.findIndex(l => l.id === clarityLevel);

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
                    <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">2. Tùy chọn & Khôi phục</h2>
                    <p className="text-center text-gray-400 mb-4">Sửa chữa các vết xước, phai màu và hư hỏng trên những bức ảnh cũ của bạn.</p>
                    
                     <div className="flex items-center justify-center mb-6">
                        <input
                            type="checkbox"
                            id="colorize-checkbox"
                            checked={colorize}
                            onChange={(e) => setColorize(e.target.checked)}
                            className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                        />
                        <label htmlFor="colorize-checkbox" className="ml-2 text-sm font-medium text-gray-300">
                            Thêm màu cho ảnh Đen trắng
                        </label>
                    </div>

                    <details className="group">
                        <summary className="list-none flex items-center justify-center cursor-pointer text-purple-400 font-semibold">
                          <span>Tùy chọn Nâng cao</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 transition-transform group-open:rotate-90" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                        </summary>
                        <div className="mt-4 pt-4 border-t border-white/10 animate-fade-in space-y-3">
                            <h3 className="text-lg font-semibold text-gray-200 text-center">Nâng cao độ nét: <span className="font-bold text-purple-400">{CLARITY_LEVELS[clarityIndex]?.name}</span></h3>
                            <input
                                type="range"
                                min="0"
                                max="2"
                                value={clarityIndex}
                                onChange={e => setClarityLevel(CLARITY_LEVELS[Number(e.target.value)].id)}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-thumb-purple"
                            />
                            <div className="flex justify-between text-xs text-gray-400 px-1">
                                {CLARITY_LEVELS.map(level => <span key={level.id}>{level.name}</span>)}
                            </div>
                        </div>
                    </details>
                    
                    <button
                        onClick={handleRestoreClick}
                        disabled={isRestoreDisabled}
                        className="w-full mt-6 py-4 px-6 text-lg font-bold rounded-lg shadow-lg transition-all duration-300 ease-in-out flex items-center justify-center
                                    bg-gradient-to-r from-purple-600 to-indigo-600 text-white
                                    hover:from-purple-700 hover:to-indigo-700 hover:shadow-purple-500/50
                                    focus:outline-none focus:ring-4 focus:ring-purple-400 focus:ring-opacity-50
                                    disabled:from-gray-600 disabled:to-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        {isRestoring ? <><Spinner /> <span className="ml-2">Đang khôi phục...</span></> : '🪄 Khôi phục ngay'}
                    </button>
                </div>
            </div>

            {/* Right Column */}
            <div className="w-full space-y-6 lg:sticky top-8">
                {(isRestoring) &&
                    <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md animate-fade-in">
                        <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">Kết quả</h2>
                         <div className="relative w-full aspect-square bg-gray-900/50 border-2 border-gray-700 rounded-xl flex justify-center items-center overflow-hidden">
                            <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center z-10 rounded-lg">
                                <Spinner />
                                <p className="mt-4 text-lg text-gray-200">AI đang làm phép màu...</p>
                            </div>
                         </div>
                    </div>
                }

                {restoredImageUrl && !isRestoring && (
                    <>
                        <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md animate-fade-in">
                            <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">So sánh Trước & Sau</h2>
                            <div className="relative w-full aspect-square bg-gray-900/50 border-2 border-gray-700 rounded-xl flex justify-center items-center overflow-hidden">
                                {originalImageUrl && <BeforeAfterSlider before={originalImageUrl} after={restoredImageUrl} />}
                            </div>
                        </div>
                        <ImageEditor
                            imageUrl={restoredImageUrl}
                            onEditComplete={handleEditComplete}
                            onStartEditing={() => setIsEditing(true)}
                            onEndEditing={() => setIsEditing(false)}
                        />
                         <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md animate-fade-in">
                             <h3 className="text-xl font-semibold text-gray-200 mb-3">Xuất ảnh</h3>
                             <div className="flex flex-col sm:flex-row gap-4 mt-4">
                                <button
                                    onClick={handleShare}
                                    disabled={!!shareFeedback || isEditing}
                                    className="w-full sm:w-auto flex-grow text-center py-3 px-6 text-md font-semibold rounded-lg shadow-md transition-all duration-300 ease-in-out
                                            bg-indigo-600 text-white hover:bg-indigo-700
                                            focus:outline-none focus:ring-4 focus:ring-indigo-400
                                            disabled:bg-gray-600 disabled:cursor-not-allowed"
                                >
                                    {shareFeedback || 'Chia sẻ'}
                                </button>
                                <button
                                    onClick={handleUpscaleClick}
                                    disabled={isUpscaling || isEditing}
                                    className="w-full sm:w-auto flex-grow text-center py-3 px-6 text-md font-semibold rounded-lg shadow-md transition-all duration-300 ease-in-out
                                            bg-orange-600 text-white hover:bg-orange-700
                                            focus:outline-none focus:ring-4 focus:ring-orange-400
                                            disabled:bg-gray-600 disabled:cursor-not-allowed"
                                >
                                    {isUpscaling ? <><Spinner /><span className="ml-2">Đang nâng cấp...</span></> : '🔎 Nâng cấp 2x'}
                                </button>
                                <a 
                                    href={restoredImageUrl} 
                                    download="restored-photo.png"
                                    className={`w-full sm:w-auto flex-grow text-center block py-3 px-6 text-md font-semibold rounded-lg shadow-md transition-all duration-300 ease-in-out
                                            bg-green-600 text-white hover:bg-green-700
                                            focus:outline-none focus:ring-4 focus:ring-green-400 ${isEditing ? 'pointer-events-none opacity-50' : ''}`}
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

export default PhotoRestorer;