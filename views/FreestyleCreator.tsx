import React, { useState, useEffect } from 'react';
import Spinner from '../components/Spinner';
import ImageEditor from '../components/ImageEditor';
import { generateImageFromPrompt, generateVideoFromPrompt, generateEnhancedPrompt, generatePromptFromImage, upscaleImage } from '../services/geminiService';
import { addToHistory } from '../services/historyService';

type GenerationType = 'image' | 'video';
type ImageAspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
type VideoAspectRatio = "16:9" | "9:16";

interface FreestyleCreatorProps {
  requireAuth: () => boolean;
  initialPrompt: string | null;
  onClearInitialPrompt: () => void;
}

const IMAGE_ASPECT_RATIOS: { id: ImageAspectRatio; name: string }[] = [
    { id: '1:1', name: 'Vuông' },
    { id: '16:9', name: 'Ngang' },
    { id: '9:16', name: 'Dọc' },
    { id: '4:3', name: 'Cảnh' },
    { id: '3:4', name: 'Chân dung' },
];
const VIDEO_ASPECT_RATIOS: { id: VideoAspectRatio; name: string }[] = [
    { id: '16:9', name: 'Ngang' },
    { id: '9:16', name: 'Dọc' },
];

const LIGHTING_OPTIONS = [
    { id: 'default', name: 'Mặc định' },
    { id: 'studio', name: 'Studio' },
    { id: 'natural', name: 'Tự nhiên' },
    { id: 'dramatic', name: 'Kịch tính' },
    { id: 'cinematic', name: 'Điện ảnh' },
];

const DEPTH_OF_FIELD_OPTIONS = [
    { id: 'default', name: 'Mặc định', label: '' },
    { id: 'deep', name: 'Sâu', label: ' (Mọi thứ đều rõ nét)' },
    { id: 'shallow', name: 'Nông', label: ' (Nền mờ)' },
];

const ART_STYLES = [
    { id: 'default', name: 'Mặc định' },
    { id: 'photorealistic', name: 'Siêu thực' },
    { id: 'oil_painting', name: 'Tranh sơn dầu' },
    { id: 'concept_art', name: 'Concept Art' },
    { id: '3d_render', name: 'Hoạt hình 3D' },
];


const FreestyleCreator: React.FC<FreestyleCreatorProps> = ({ requireAuth, initialPrompt, onClearInitialPrompt }) => {
    const [prompt, setPrompt] = useState<string>('Một phi hành gia đang cưỡi ngựa, ảnh siêu thực, chi tiết cao.');
    const [generationType, setGenerationType] = useState<GenerationType>('image');
    const [imageAspectRatio, setImageAspectRatio] = useState<ImageAspectRatio>('1:1');
    const [videoAspectRatio, setVideoAspectRatio] = useState<VideoAspectRatio>('16:9');
    
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [resultType, setResultType] = useState<GenerationType | null>(null);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
    const [isGettingPrompt, setIsGettingPrompt] = useState<boolean>(false);
    const [isUpscaling, setIsUpscaling] = useState<boolean>(false);
    const [progressMessage, setProgressMessage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [shareFeedback, setShareFeedback] = useState<string>('');
    
    // Advanced settings state
    const [lightingOption, setLightingOption] = useState('default');
    const [depthOfField, setDepthOfField] = useState('default');
    const [artStyle, setArtStyle] = useState('default');
    
    useEffect(() => {
        if (initialPrompt) {
            setPrompt(initialPrompt);
            onClearInitialPrompt();
        }
    }, [initialPrompt, onClearInitialPrompt]);

    const handleEnhancePrompt = async () => {
        if (!prompt.trim() || isEnhancing) return;
        setIsEnhancing(true);
        setError(null);
        try {
            const enhancedPrompt = await generateEnhancedPrompt(prompt);
            setPrompt(enhancedPrompt);
        } catch (err: any) {
            setError(err.message || "Không thể nâng cao lời nhắc.");
        } finally {
            setIsEnhancing(false);
        }
    };
    
    const handlePromptImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsGettingPrompt(true);
        setError(null);
        try {
            const generatedPrompt = await generatePromptFromImage(file);
            setPrompt(generatedPrompt);
        } catch (err: any) {
            setError(err.message || "Không thể tạo lời nhắc từ ảnh.");
        } finally {
            setIsGettingPrompt(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleGenerateClick = async () => {
        if (!requireAuth()) return;

        if (!prompt.trim()) {
            setError("Vui lòng nhập một yêu cầu.");
            return;
        }

        setIsGenerating(true);
        setError(null);
        setResultUrl(null);
        setResultType(null);
        setProgressMessage('');

        let finalPrompt = prompt;
        if (generationType === 'image') {
            if (artStyle !== 'default') {
                finalPrompt += `, in the art style of ${artStyle.replace('_', ' ')}`;
            }
            switch (lightingOption) {
                case 'studio': finalPrompt += ", professional studio lighting, soft and even"; break;
                case 'natural': finalPrompt += ", bright natural lighting, as if from a large window"; break;
                case 'dramatic': finalPrompt += ", dramatic high-contrast lighting, Rembrandt style"; break;
                case 'cinematic': finalPrompt += ", cinematic lighting, moody with volumetric light rays"; break;
            }
            switch (depthOfField) {
                case 'deep': finalPrompt += ", deep depth of field, everything in sharp focus"; break;
                case 'shallow': finalPrompt += ", shallow depth of field, beautiful bokeh background"; break;
            }
        }

        try {
            let newResultUrl;
            if (generationType === 'image') {
                newResultUrl = await generateImageFromPrompt(finalPrompt, imageAspectRatio);
            } else { // video
                newResultUrl = await generateVideoFromPrompt(finalPrompt, videoAspectRatio, setProgressMessage);
            }
            setResultUrl(newResultUrl);
            setResultType(generationType);
            addToHistory(newResultUrl, 'freestyle', finalPrompt);
        } catch (err: any) {
            setError(err.message || "Đã xảy ra lỗi không xác định.");
        } finally {
            setIsGenerating(false);
            setProgressMessage('');
        }
    };
    
    const handleEditComplete = (newImageUrl: string, description: string) => {
        setResultUrl(newImageUrl);
        addToHistory(newImageUrl, 'freestyle', description, "Edited");
    };

    const handleUpscaleClick = async () => {
        if (!resultUrl || resultType !== 'image') return;

        setIsUpscaling(true);
        setError(null);

        try {
            const mimeType = resultUrl.split(';')[0].split(':')[1];
            const upscaledUrl = await upscaleImage(resultUrl, mimeType);
            setResultUrl(upscaledUrl);
            addToHistory(upscaledUrl, 'freestyle', 'Upscaled Image');
        } catch (err: any) {
            setError(err.message || "Không thể nâng cấp ảnh.");
        } finally {
            setIsUpscaling(false);
        }
    };
    
    const handleShare = async () => {
        if (!resultUrl || !resultType) return;
        setShareFeedback('Đang chuẩn bị...');
        try {
            const response = await fetch(resultUrl);
            const blob = await response.blob();
            const file = new File([blob], `ai-freestyle.${resultType === 'video' ? 'mp4' : 'jpg'}`, { type: blob.type });

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'AI Freestyle Creation',
                    text: 'Tác phẩm được tạo bằng AI Studio!',
                    files: [file],
                });
                setShareFeedback('Đã chia sẻ!');
            } else if (resultType === 'image' && navigator.clipboard?.write) {
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

    const isGenerateDisabled = !prompt.trim() || isGenerating || isEnhancing || isGettingPrompt || isUpscaling || isEditing;
    const isLoading = isGenerating || isUpscaling;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-8 animate-fade-in">
            {/* Left Column */}
            <div className="w-full space-y-6">
                <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md">
                    <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">1. Mô tả ý tưởng của bạn</h2>
                    <div className="relative">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Ví dụ: một phi hành gia đang cưỡi ngựa trên sao Hỏa, tranh sơn dầu..."
                            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                            rows={6}
                        />
                         <button 
                            onClick={handleEnhancePrompt}
                            disabled={!prompt.trim() || isEnhancing || isGenerating}
                            className="absolute bottom-3 right-3 px-3 py-1 text-xs font-semibold rounded-md shadow-md transition-all duration-300 ease-in-out flex items-center justify-center
                                       bg-gradient-to-r from-teal-500 to-cyan-500 text-white
                                       hover:from-teal-600 hover:to-cyan-600
                                       focus:outline-none focus:ring-2 focus:ring-cyan-300
                                       disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed"
                        >
                            {isEnhancing ? <Spinner/> : 'Nâng cao Lời nhắc ✨'}
                        </button>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/20 text-center">
                        <label htmlFor="prompt-image-upload" className="cursor-pointer group">
                            <span className="font-semibold text-purple-400 group-hover:text-purple-300 transition-colors">
                                {isGettingPrompt ? 'Đang phân tích...' : 'Tạo lời nhắc từ ảnh'}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">AI sẽ mô tả ảnh để bạn có thể tạo các biến thể.</p>
                            <input 
                                id="prompt-image-upload" 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handlePromptImageUpload}
                                disabled={isGettingPrompt || isGenerating}
                            />
                        </label>
                        {isGettingPrompt && <div className="flex justify-center mt-2"><Spinner /></div>}
                    </div>
                </div>
                 <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md">
                    <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">2. Chọn định dạng & Cài đặt</h2>
                    <div className="flex justify-center bg-gray-800 p-1 rounded-lg">
                        <button onClick={() => setGenerationType('image')} className={`w-1/2 py-2 rounded-md font-semibold transition-colors ${generationType === 'image' ? 'bg-purple-600 text-white' : 'hover:bg-gray-700'}`}>Ảnh</button>
                        <button onClick={() => setGenerationType('video')} className={`w-1/2 py-2 rounded-md font-semibold transition-colors ${generationType === 'video' ? 'bg-purple-600 text-white' : 'hover:bg-gray-700'}`}>Video</button>
                    </div>

                    <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-200 mb-3 text-center">Tỷ lệ khung hình</h3>
                        <div className="flex justify-center flex-wrap gap-2">
                            {(generationType === 'image' ? IMAGE_ASPECT_RATIOS : VIDEO_ASPECT_RATIOS).map(ratio => (
                                <button
                                    key={ratio.id}
                                    onClick={() => generationType === 'image' ? setImageAspectRatio(ratio.id as ImageAspectRatio) : setVideoAspectRatio(ratio.id as VideoAspectRatio)}
                                    className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                                        (generationType === 'image' && imageAspectRatio === ratio.id) || (generationType === 'video' && videoAspectRatio === ratio.id)
                                        ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
                                    }`}
                                >
                                    {ratio.name} ({ratio.id})
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                 {generationType === 'image' && (
                    <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md animate-fade-in">
                        <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">Tùy chỉnh Nâng cao (Ảnh)</h2>
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold text-gray-200 text-center">Phong cách nghệ thuật</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                                    {ART_STYLES.map(opt => (
                                        <button key={opt.id} onClick={() => setArtStyle(opt.id)} className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${artStyle === opt.id ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                            {opt.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold text-gray-200 text-center">Ánh sáng</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                                    {LIGHTING_OPTIONS.map(opt => (
                                        <button key={opt.id} onClick={() => setLightingOption(opt.id)} className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${lightingOption === opt.id ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                            {opt.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold text-gray-200 text-center">Độ sâu Trường ảnh</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {DEPTH_OF_FIELD_OPTIONS.map(opt => (
                                        <button key={opt.id} onClick={() => setDepthOfField(opt.id)} className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${depthOfField === opt.id ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                            {opt.name}<span className="hidden sm:inline">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Column */}
            <div className="w-full space-y-6 lg:sticky top-8">
                <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md">
                    <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">3. Bắt đầu tạo</h2>
                     <button onClick={handleGenerateClick} disabled={isGenerateDisabled} className="w-full py-4 px-6 text-lg font-bold rounded-lg shadow-lg transition-all duration-300 ease-in-out flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 hover:shadow-purple-500/50 focus:outline-none focus:ring-4 focus:ring-purple-400 focus:ring-opacity-50 disabled:from-gray-600 disabled:to-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none">
                         {isGenerating ? <><Spinner /> <span className="ml-2">Đang tạo...</span></> : '✨ Tạo ngay'}
                     </button>
                </div>
                
                 {(isGenerating) &&
                     <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md animate-fade-in">
                         <h2 className="text-2xl font-semibold text-gray-100 mb-4">Kết quả</h2>
                         <div className="relative w-full aspect-square bg-gray-900/50 border-2 border-gray-700 rounded-xl flex justify-center items-center overflow-hidden">
                             <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center z-10 rounded-lg p-4">
                                 <Spinner />
                                 <p className="mt-4 text-lg text-gray-200 text-center">{progressMessage || 'Đang tạo tác phẩm của bạn...'}</p>
                                 {generationType === 'video' && <p className="mt-2 text-sm text-gray-400 text-center">Việc này có thể mất vài phút.</p>}
                             </div>
                         </div>
                     </div>
                 }
                {resultUrl && !isGenerating && (
                    <>
                        {resultType === 'image' ? (
                            <ImageEditor
                                imageUrl={resultUrl}
                                onEditComplete={handleEditComplete}
                                onStartEditing={() => setIsEditing(true)}
                                onEndEditing={() => setIsEditing(false)}
                            />
                        ) : (
                            <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md animate-fade-in">
                                <h2 className="text-2xl font-semibold text-gray-100 mb-4">Kết quả Video</h2>
                                <div className="relative w-full aspect-square bg-gray-900/50 rounded-xl overflow-hidden">
                                     <video src={resultUrl} controls autoPlay loop className="object-contain w-full h-full" />
                                </div>
                            </div>
                        )}
                         <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md animate-fade-in">
                             <h3 className="text-xl font-semibold text-gray-200 mb-3">Xuất sản phẩm</h3>
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
                                {resultType === 'image' && (
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
                                )}
                                <a href={resultUrl} download={`ai-creation.${resultType === 'video' ? 'mp4' : 'jpg'}`} className={`w-full sm:w-auto flex-grow text-center block py-3 px-6 text-md font-semibold rounded-lg shadow-md transition-all duration-300 ease-in-out bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-400 ${isEditing ? 'pointer-events-none opacity-50' : ''}`}>
                                    Tải xuống
                                </a>
                            </div>
                        </div>
                    </>
                )}
                {error && <div className="p-4 bg-red-900/50 border-red-500/50 rounded-lg text-red-300 text-center animate-fade-in">{error}</div>}
            </div>
        </div>
    );
};

export default FreestyleCreator;