import React, { useState, useCallback } from 'react';
import ImageUploader from '../components/ImageUploader';
import Spinner from '../components/Spinner';
import MaskEditor from '../components/MaskEditor';
import ImageEditor from '../components/ImageEditor';
import { PRESET_SCENES } from '../constants';
import { Scene } from '../types';
import { composeScene, replaceSubjectInScene, generateImageFromPrompt, upscaleImage } from '../services/geminiService';
import { addToHistory } from '../services/historyService';

const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
        throw new Error("Invalid data URL");
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}

interface SceneComposerProps {
  requireAuth: () => boolean;
}

const SceneComposer: React.FC<SceneComposerProps> = ({ requireAuth }) => {
    const [subjectFile, setSubjectFile] = useState<File | null>(null);
    const [subjectUrl, setSubjectUrl] = useState<string | null>(null);
    const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
    const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
    const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null);
    const [isMaskEditorOpen, setIsMaskEditorOpen] = useState<boolean>(false);
    const [composedImageUrl, setComposedImageUrl] = useState<string | null>(null);
    const [isComposing, setIsComposing] = useState<boolean>(false);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [isUpscaling, setIsUpscaling] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [shareFeedback, setShareFeedback] = useState<string>('');
    const [backgroundPrompt, setBackgroundPrompt] = useState<string>('');
    const [isGeneratingBg, setIsGeneratingBg] = useState<boolean>(false);

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
        setMaskDataUrl(null); // Clear mask when background changes
        setError(null);
    }, [backgroundUrl]);

    const handleBackgroundClear = useCallback(() => {
        if (backgroundUrl) URL.revokeObjectURL(backgroundUrl);
        setBackgroundFile(null);
        setBackgroundUrl(null);
        setMaskDataUrl(null);
        setError(null);
    }, [backgroundUrl]);
    
    const handlePresetSceneSelect = async (scene: Scene) => {
        try {
            const response = await fetch(scene.thumbnail);
            const blob = await response.blob();
            const file = new File([blob], `${scene.id}.jpg`, { type: 'image/jpeg' });
            handleBackgroundUpload(file);
        } catch (err) {
            setError("Không thể tải ảnh nền mẫu.");
        }
    }
    
    const handleGenerateBackground = async () => {
        if (!requireAuth()) return;
        if (!backgroundPrompt.trim()) {
            setError("Vui lòng nhập mô tả cho nền.");
            return;
        }
        setIsGeneratingBg(true);
        setError(null);
        try {
            const generatedDataUrl = await generateImageFromPrompt(backgroundPrompt, '16:9');
            const file = dataURLtoFile(generatedDataUrl, 'generated-background.jpg');
            handleBackgroundUpload(file);
        } catch (err: any) {
            setError(err.message || "Không thể tạo nền.");
        } finally {
            setIsGeneratingBg(false);
        }
    };
    
    const handleMaskSave = (newMaskDataUrl: string) => {
        setMaskDataUrl(newMaskDataUrl);
        setIsMaskEditorOpen(false);
    };

    const handleComposeClick = async () => {
        if (!requireAuth()) return;

        if (!subjectFile) {
            setError("Vui lòng tải lên một ảnh chủ thể.");
            return;
        }
        if (!backgroundFile) {
            setError("Vui lòng tải lên hoặc chọn một ảnh nền.");
            return;
        }

        setIsComposing(true);
        setError(null);
        setComposedImageUrl(null);

        try {
            let resultUrl;
            if (maskDataUrl) {
                resultUrl = await replaceSubjectInScene(subjectFile, backgroundFile, maskDataUrl);
            } else {
                resultUrl = await composeScene(subjectFile, backgroundFile);
            }
            setComposedImageUrl(resultUrl);

            const inputs = [];
            if (subjectUrl) inputs.push({ url: subjectUrl, label: 'Chủ thể' });
            if (backgroundUrl) inputs.push({ url: backgroundUrl, label: 'Nền' });
            
            addToHistory(resultUrl, 'scene', maskDataUrl ? 'Replace Subject in Scene' : 'Compose Scene', `BG: ${backgroundFile.name}`, inputs);

        } catch (err: any) {
            setError(err.message || "Đã xảy ra lỗi không xác định khi ghép cảnh.");
        } finally {
            setIsComposing(false);
        }
    };
    
    const handleEditComplete = (newImageUrl: string, description: string) => {
        if (composedImageUrl) {
            addToHistory(newImageUrl, 'scene', description, "Edited", [{ url: composedImageUrl, label: "Ảnh trước khi sửa" }]);
        }
        setComposedImageUrl(newImageUrl);
    };

    const handleUpscaleClick = async () => {
        if (!composedImageUrl) return;

        setIsUpscaling(true);
        setError(null);

        try {
            const mimeType = composedImageUrl.split(';')[0].split(':')[1];
            const upscaledUrl = await upscaleImage(composedImageUrl, mimeType);
            addToHistory(upscaledUrl, 'scene', 'Upscaled Image', undefined, [{ url: composedImageUrl, label: "Ảnh trước khi nâng cấp" }]);
            setComposedImageUrl(upscaledUrl);
        } catch (err: any) {
            setError(err.message || "Không thể nâng cấp ảnh.");
        } finally {
            setIsUpscaling(false);
        }
    };

    const handleShare = async () => {
        if (!composedImageUrl) return;
        setShareFeedback('Đang chuẩn bị...');
        try {
            const response = await fetch(composedImageUrl);
            const blob = await response.blob();
            const file = new File([blob], 'ai-scene.png', { type: blob.type });

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'AI Scene Composition',
                    text: 'Đây là cảnh tôi đã tạo bằng AI Studio!',
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

    const isComposeDisabled = !subjectFile || !backgroundFile || isComposing || isGeneratingBg || isUpscaling || isEditing;
    const isLoading = isComposing || isUpscaling;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-8 animate-fade-in">
            {isMaskEditorOpen && backgroundUrl && (
                <MaskEditor 
                    imageUrl={backgroundUrl}
                    onSave={handleMaskSave}
                    onClose={() => setIsMaskEditorOpen(false)}
                />
            )}
            {/* Left Column */}
            <div className="w-full space-y-8">
                 <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md">
                    <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">1. Ảnh chủ thể (để chèn)</h2>
                    <ImageUploader onImageUpload={handleSubjectUpload} onImageClear={handleSubjectClear} imageUrl={subjectUrl} />
                </div>

                <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md">
                     <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">2. Ảnh nền</h2>
                    <ImageUploader onImageUpload={handleBackgroundUpload} onImageClear={handleBackgroundClear} imageUrl={backgroundUrl} />
                    
                     <div className="my-4 text-center text-gray-400">hoặc tạo nền bằng AI</div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={backgroundPrompt}
                            onChange={(e) => setBackgroundPrompt(e.target.value)}
                            placeholder="Ví dụ: một bãi biển nhiệt đới lúc hoàng hôn"
                            className="flex-grow p-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-purple-500"
                            disabled={isGeneratingBg}
                        />
                        <button onClick={handleGenerateBackground} disabled={isGeneratingBg || !backgroundPrompt.trim()} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed">
                            {isGeneratingBg ? <Spinner /> : 'Tạo'}
                        </button>
                    </div>
                    
                    {backgroundUrl && (
                        <div className="mt-4 p-4 bg-gray-800/50 rounded-lg text-center">
                            <h3 className="font-semibold text-lg text-white mb-2">Thay thế chủ thể? (Tùy chọn)</h3>
                            <p className="text-sm text-gray-400 mb-3">Tô màu lên đối tượng trong ảnh nền bạn muốn thay thế bằng chủ thể ở bước 1.</p>
                            <button onClick={() => setIsMaskEditorOpen(true)} className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors">
                                Vẽ để chọn vùng thay thế
                            </button>
                            {maskDataUrl && (
                                <div className="mt-4">
                                    <p className="text-sm font-semibold text-green-400">Đã chọn vùng thay thế.</p>
                                    <div className="flex items-center justify-center gap-4 mt-2">
                                        <img src={maskDataUrl} alt="Mask Preview" className="w-20 h-20 object-contain rounded-md border border-gray-600 bg-black"/>
                                        <button onClick={() => setMaskDataUrl(null)} className="text-red-400 hover:text-red-300 text-sm">Xóa lựa chọn</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <p className="text-center my-4 text-gray-400">hoặc chọn một cảnh có sẵn</p>
                    <div className="grid grid-cols-3 gap-2">
                        {PRESET_SCENES.map((scene) => (
                           <button key={scene.id} onClick={() => handlePresetSceneSelect(scene)} className="relative group rounded-lg overflow-hidden aspect-square focus:outline-none transition-all duration-300 ease-in-out transform hover:scale-105 ring-2 ring-transparent hover:ring-purple-400">
                               <img src={scene.thumbnail} alt={scene.name} className="w-full h-full object-cover"/>
                               <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-1">
                                   <span className="text-white text-xs font-semibold text-center">{scene.name}</span>
                               </div>
                           </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column */}
            <div className="w-full space-y-6 lg:sticky top-8">
                 <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md">
                     <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">3. Ghép ảnh</h2>
                     <button onClick={handleComposeClick} disabled={isComposeDisabled} className="w-full py-4 px-6 text-lg font-bold rounded-lg shadow-lg transition-all duration-300 ease-in-out flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 hover:shadow-purple-500/50 focus:outline-none focus:ring-4 focus:ring-purple-400 focus:ring-opacity-50 disabled:from-gray-600 disabled:to-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none">
                         {isComposing ? <><Spinner /> <span className="ml-2">Đang ghép...</span></> : (maskDataUrl ? '✨ Thay thế & Ghép ảnh' : '🖼️ Ghép vào cảnh')}
                     </button>
                 </div>

                 {(isComposing) &&
                     <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md animate-fade-in">
                         <h2 className="text-2xl font-semibold text-gray-100 mb-4">Kết quả</h2>
                         <div className="relative w-full aspect-square bg-gray-900/50 border-2 border-gray-700 rounded-xl flex justify-center items-center overflow-hidden">
                             <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center z-10 rounded-lg">
                                 <Spinner />
                                 <p className="mt-4 text-lg text-gray-200">Đang ghép ảnh của bạn...</p>
                             </div>
                         </div>
                     </div>
                 }
                {composedImageUrl && !isComposing && (
                    <>
                        <ImageEditor 
                            imageUrl={composedImageUrl}
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
                                            focus:outline-none focus:ring-4 focus:ring-indigo-400 disabled:bg-gray-600 disabled:cursor-not-allowed"
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
                                <a href={composedImageUrl} download="ai-scene.png" className={`w-full sm:w-auto flex-grow text-center block py-3 px-6 text-md font-semibold rounded-lg shadow-md transition-all duration-300 ease-in-out bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-400 ${isEditing ? 'pointer-events-none opacity-50' : ''}`}>
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

export default SceneComposer;