import React, { useState, useCallback, ChangeEvent, useEffect } from 'react';
import Spinner from '../components/Spinner';
import ImageEditor from '../components/ImageEditor';
import { blendImages, generateBlendSuggestion, upscaleImage } from '../services/geminiService';
import { addToHistory } from '../services/historyService';

const MAX_IMAGES = 4;

const BLEND_STYLES = [
    { id: 'photorealistic', name: 'Siêu thực' },
    { id: 'fantasy', name: 'Fantasy Art' },
    { id: 'watercolor', name: 'Tranh màu nước' },
    { id: 'surreal', name: 'Chủ nghĩa siêu thực' },
];

interface PhotoBlenderProps {
  requireAuth: () => boolean;
}

const PhotoBlender: React.FC<PhotoBlenderProps> = ({ requireAuth }) => {
    const [imageFiles, setImageFiles] = useState<(File | null)[]>(Array(MAX_IMAGES).fill(null));
    const [imageUrls, setImageUrls] = useState<(string | null)[]>(Array(MAX_IMAGES).fill(null));
    const [prompt, setPrompt] = useState<string>('');
    const [blendedImageUrl, setBlendedImageUrl] = useState<string | null>(null);
    const [isBlending, setIsBlending] = useState<boolean>(false);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [isUpscaling, setIsUpscaling] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [shareFeedback, setShareFeedback] = useState<string>('');
    const [suggestion, setSuggestion] = useState<string | null>(null);
    const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState<boolean>(false);
    const [selectedStyle, setSelectedStyle] = useState<string>('photorealistic');

    useEffect(() => {
        const validFiles = imageFiles.filter((f): f is File => f !== null);

        if (validFiles.length >= 2) {
            const fetchSuggestion = async () => {
                setIsGeneratingSuggestion(true);
                setSuggestion(null);
                try {
                    const newSuggestion = await generateBlendSuggestion(validFiles);
                    setSuggestion(newSuggestion);
                } catch (err) {
                    console.error("Không thể tạo gợi ý:", err);
                } finally {
                    setIsGeneratingSuggestion(false);
                }
            };
            fetchSuggestion();
        } else {
            setSuggestion(null);
        }
    }, [imageFiles]);


    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0];
        if (file) {
            const newFiles = [...imageFiles];
            const newUrls = [...imageUrls];

            if (newUrls[index]) {
                URL.revokeObjectURL(newUrls[index]!);
            }

            newFiles[index] = file;
            newUrls[index] = URL.createObjectURL(file);

            setImageFiles(newFiles);
            setImageUrls(newUrls);
            setError(null);
        }
    };

    const handleImageClear = (index: number) => {
        const newFiles = [...imageFiles];
        const newUrls = [...imageUrls];

        if (newUrls[index]) {
            URL.revokeObjectURL(newUrls[index]!);
        }
        
        newFiles[index] = null;
        newUrls[index] = null;

        setImageFiles(newFiles);
        setImageUrls(newUrls);
        setError(null);
    };

    const handleBlendClick = async () => {
        if (!requireAuth()) return;

        const validFiles = imageFiles.filter((f): f is File => f !== null);
        
        if (validFiles.length < 2) {
            setError("Vui lòng tải lên ít nhất 2 ảnh để ghép.");
            return;
        }
        if (!prompt.trim()) {
            setError("Vui lòng nhập mô tả cho việc ghép ảnh.");
            return;
        }

        setIsBlending(true);
        setError(null);
        setBlendedImageUrl(null);

        try {
            const finalPrompt = `${prompt}. The final image should have a ${selectedStyle} style.`;
            const resultUrl = await blendImages(validFiles, finalPrompt);
            setBlendedImageUrl(resultUrl);
            const inputImages = imageUrls
                .map((url, index) => (url ? { url, label: `Ảnh ${index + 1}` } : null))
                .filter((item): item is { url: string; label: string } => item !== null);
            addToHistory(resultUrl, 'blender', finalPrompt, undefined, inputImages);
        } catch (err: any) {
            setError(err.message || "Đã xảy ra lỗi không xác định khi ghép ảnh.");
        } finally {
            setIsBlending(false);
        }
    };
    
    const handleEditComplete = (newImageUrl: string, description: string) => {
        if (blendedImageUrl) {
            addToHistory(newImageUrl, 'blender', description, "Edited", [{ url: blendedImageUrl, label: "Ảnh trước khi sửa" }]);
        }
        setBlendedImageUrl(newImageUrl);
    };

    const handleUpscaleClick = async () => {
        if (!blendedImageUrl) return;

        setIsUpscaling(true);
        setError(null);

        try {
            const mimeType = blendedImageUrl.split(';')[0].split(':')[1];
            const upscaledUrl = await upscaleImage(blendedImageUrl, mimeType);
            addToHistory(upscaledUrl, 'blender', 'Upscaled Image', undefined, [{ url: blendedImageUrl, label: "Ảnh trước khi nâng cấp" }]);
            setBlendedImageUrl(upscaledUrl);
        } catch (err: any) {
            setError(err.message || "Không thể nâng cấp ảnh.");
        } finally {
            setIsUpscaling(false);
        }
    };
    
    const handleShare = async () => {
        if (!blendedImageUrl) return;
        setShareFeedback('Đang chuẩn bị...');
        try {
            const response = await fetch(blendedImageUrl);
            const blob = await response.blob();
            const file = new File([blob], 'ai-blend.png', { type: blob.type });

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'AI Photo Blend',
                    text: 'Tác phẩm được ghép từ nhiều ảnh bằng AI Studio!',
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

    const isBlendDisabled = imageFiles.filter(Boolean).length < 2 || !prompt.trim() || isBlending || isUpscaling || isEditing;
    const isLoading = isBlending || isUpscaling;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-8 animate-fade-in">
            {/* Left Column */}
            <div className="w-full space-y-8">
                <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md">
                    <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">1. Tải lên 2-4 ảnh</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {imageUrls.map((url, index) => (
                            <div key={index} className="relative aspect-square border-2 border-dashed border-gray-600 rounded-xl flex items-center justify-center group bg-gray-900/50">
                                {url ? (
                                    <>
                                        <img src={url} alt={`Input ${index + 1}`} className="object-cover w-full h-full rounded-xl" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center items-center rounded-xl">
                                            <button onClick={() => handleImageClear(index)} className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2.5" aria-label="Xóa ảnh">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <label className="cursor-pointer text-center text-gray-400 hover:text-purple-400 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                        <span className="text-sm mt-2 block">Ảnh {index + 1}</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, index)} />
                                    </label>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md">
                    <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">2. Mô tả & Phong cách</h2>
                    <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ví dụ: hợp nhất người trong ảnh 1 vào bối cảnh thành phố trong ảnh 2..." className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition" rows={4} />
                    <div className="mt-4">
                        <h3 className="text-lg font-semibold text-gray-200 mb-3 text-center">Chọn phong cách ghép ảnh</h3>
                        <div className="flex justify-center flex-wrap gap-2">
                            {BLEND_STYLES.map(style => (
                                <button
                                    key={style.id}
                                    onClick={() => setSelectedStyle(style.id)}
                                    className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                                        selectedStyle === style.id
                                        ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
                                    }`}
                                >
                                    {style.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="mt-4">
                        {isGeneratingSuggestion && (
                            <div className="flex items-center justify-center text-sm text-gray-400 p-2">
                                <Spinner />
                                <span className="ml-2">Đang tạo gợi ý...</span>
                            </div>
                        )}
                        {suggestion && !isGeneratingSuggestion && (
                            <div className="animate-fade-in">
                                <h4 className="text-sm font-semibold text-gray-300 mb-2">Gợi ý cho bạn:</h4>
                                <button
                                    onClick={() => setPrompt(suggestion)}
                                    className="w-full text-left p-3 bg-gray-700/50 rounded-lg hover:bg-purple-900/50 border border-gray-600 hover:border-purple-500 transition-all duration-200"
                                >
                                    <p className="text-gray-200 italic">"{suggestion}"</p>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Column */}
            <div className="w-full space-y-6 lg:sticky top-8">
                <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md">
                    <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">3. Ghép ảnh</h2>
                    <button onClick={handleBlendClick} disabled={isBlendDisabled} className="w-full py-4 px-6 text-lg font-bold rounded-lg shadow-lg transition-all duration-300 ease-in-out flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 hover:shadow-purple-500/50 focus:outline-none focus:ring-4 focus:ring-purple-400 focus:ring-opacity-50 disabled:from-gray-600 disabled:to-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none">
                        {isBlending ? <><Spinner /> <span className="ml-2">Đang ghép...</span></> : '🎨 Ghép ảnh'}
                    </button>
                </div>
                {(isBlending) &&
                     <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md animate-fade-in">
                         <h2 className="text-2xl font-semibold text-gray-100 mb-4">Kết quả</h2>
                        <div className="relative w-full aspect-square bg-gray-900/50 border-2 border-gray-700 rounded-xl flex justify-center items-center overflow-hidden">
                            <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center z-10 rounded-lg">
                                <Spinner />
                                <p className="mt-4 text-lg text-gray-200">AI đang hòa trộn sự sáng tạo...</p>
                            </div>
                        </div>
                    </div>
                }
                {blendedImageUrl && !isBlending && (
                    <>
                        <ImageEditor
                            imageUrl={blendedImageUrl}
                            onEditComplete={handleEditComplete}
                            onStartEditing={() => setIsEditing(true)}
                            onEndEditing={() => setIsEditing(false)}
                        />
                        <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md animate-fade-in">
                            <h3 className="text-xl font-semibold text-gray-200 mb-3">Xuất ảnh</h3>
                            <div className="flex flex-col sm:flex-row gap-4 mt-4">
                                <button onClick={handleShare} disabled={!!shareFeedback || isEditing} className="w-full sm:w-auto flex-grow text-center py-3 px-6 text-md font-semibold rounded-lg shadow-md transition-all duration-300 ease-in-out bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-400 disabled:bg-gray-600 disabled:cursor-not-allowed">
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
                                <a href={blendedImageUrl} download="ai-blend.png" className={`w-full sm:w-auto flex-grow text-center block py-3 px-6 text-md font-semibold rounded-lg shadow-md transition-all duration-300 ease-in-out bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-400 ${isEditing ? 'pointer-events-none opacity-50' : ''}`}>
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

export default PhotoBlender;