import React, { useState, useCallback, useRef, useEffect } from 'react';
import ImageUploader from '../components/ImageUploader';
import Spinner from '../components/Spinner';
import BeforeAfterSlider from '../components/BeforeAfterSlider';
import { tryOnOutfit, generateDifferentAngle } from '../services/geminiService';
import { addToHistory } from '../services/historyService';
import ImageEditor from '../components/ImageEditor';

const OUTFIT_SUGGESTIONS = [
    'một bộ vest công sở màu xanh navy',
    'một chiếc váy dạ hội màu đỏ lấp lánh',
    'trang phục phi hành gia',
    'một bộ đồ cosplay nhân vật anime',
    'áo khoác da và quần jean rách',
];

type InputMode = 'prompt' | 'image';

interface OutfitTryOnProps {
  requireAuth: () => boolean;
}

const TURNTABLE_ANGLES = [
    { id: 'front', name: 'Mặt trước', prompt: 'front view' },
    { id: 'front_right', name: 'Trước-Phải', prompt: 'three-quarter view from the front right' },
    { id: 'right', name: 'Bên phải', prompt: 'side view, from the right' },
    { id: 'back_right', name: 'Sau-Phải', prompt: 'three-quarter view from the back right' },
    { id: 'back', name: 'Mặt sau', prompt: 'view from the back' },
    { id: 'back_left', name: 'Sau-Trái', prompt: 'three-quarter view from the back left' },
    { id: 'left', name: 'Bên trái', prompt: 'side view, from the left' },
    { id: 'front_left', name: 'Trước-Trái', prompt: 'three-quarter view from the front left' },
];


const OutfitTryOn: React.FC<OutfitTryOnProps> = ({ requireAuth }) => {
    const [personFile, setPersonFile] = useState<File | null>(null);
    const [personUrl, setPersonUrl] = useState<string | null>(null);
    
    const [inputMode, setInputMode] = useState<InputMode>('prompt');
    const [outfitPrompt, setOutfitPrompt] = useState<string>('một bộ vest công sở màu xanh navy');
    const [outfitFile, setOutfitFile] = useState<File | null>(null);
    const [outfitUrl, setOutfitUrl] = useState<string | null>(null);

    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    
    type TurntableImage = { id: string; url: string | null; };
    const [turntableImages, setTurntableImages] = useState<TurntableImage[]>([]);
    const [isGeneratingTurntable, setIsGeneratingTurntable] = useState(false);
    const [turntableProgress, setTurntableProgress] = useState({ current: 0, total: 0 });
    const [currentAngleIndex, setCurrentAngleIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const animationIntervalRef = useRef<number | null>(null);

    // State for drag-to-rotate functionality
    const [isDragging, setIsDragging] = useState(false);
    const dragStartX = useRef(0);
    const dragStartIndex = useRef(0);
    const DRAG_SENSITIVITY = 50; // pixels per angle change


    const resetResults = () => {
        setResultUrl(null);
        setTurntableImages([]);
        setIsGeneratingTurntable(false);
        setTurntableProgress({ current: 0, total: 0 });
        setCurrentAngleIndex(0);
        setIsPlaying(false);
    };

    const handleImageUpload = useCallback((file: File) => {
        if (personUrl) URL.revokeObjectURL(personUrl);
        setPersonFile(file);
        setPersonUrl(URL.createObjectURL(file));
        setError(null);
        resetResults();
    }, [personUrl]);

    const handleImageClear = useCallback(() => {
        if (personUrl) URL.revokeObjectURL(personUrl);
        setPersonFile(null);
        setPersonUrl(null);
        setError(null);
        resetResults();
    }, [personUrl]);
    
    const handleOutfitUpload = useCallback((file: File) => {
        if (outfitUrl) URL.revokeObjectURL(outfitUrl);
        setOutfitFile(file);
        setOutfitUrl(URL.createObjectURL(file));
        setError(null);
    }, [outfitUrl]);

    const handleOutfitClear = useCallback(() => {
        if (outfitUrl) URL.revokeObjectURL(outfitUrl);
        setOutfitFile(null);
        setOutfitUrl(null);
        setError(null);
    }, [outfitUrl]);
    
    const setMode = (mode: InputMode) => {
        setInputMode(mode);
        if (mode === 'prompt') {
            handleOutfitClear();
        } else {
            setOutfitPrompt('');
        }
    }

    const handleGenerateClick = async () => {
        if (!requireAuth()) return;

        if (!personFile) {
            setError("Vui lòng tải lên ảnh một người.");
            return;
        }
        if (inputMode === 'prompt' && !outfitPrompt.trim()) {
            setError("Vui lòng mô tả trang phục.");
            return;
        }
        if (inputMode === 'image' && !outfitFile) {
            setError("Vui lòng tải lên ảnh trang phục.");
            return;
        }
        setIsGenerating(true);
        setError(null);
        resetResults();
        try {
            const newResultUrl = await tryOnOutfit(
                personFile,
                inputMode === 'prompt' ? outfitPrompt : undefined,
                inputMode === 'image' ? outfitFile! : undefined
            );
            setResultUrl(newResultUrl);
            setTurntableImages([{ id: 'front', url: newResultUrl }]);
            const inputs = [];
            if(personUrl) inputs.push({ url: personUrl, label: 'Người mẫu' });
            if (inputMode === 'image' && outfitUrl) {
                inputs.push({ url: outfitUrl, label: 'Trang phục' });
            }
            if(personUrl) {
                addToHistory(newResultUrl, 'outfit', inputMode === 'prompt' ? outfitPrompt : `Outfit from image: ${outfitFile!.name}`, undefined, inputs);
            }
        } catch (err: any) {
            setError(err.message || "Đã xảy ra lỗi không xác định.");
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleGenerateTurntable = async () => {
        const baseImage = turntableImages.find(img => img.id === 'front')?.url;
        if (!baseImage) {
            setError("Không tìm thấy ảnh gốc để tạo chế độ xem 360°.");
            return;
        }

        setIsGeneratingTurntable(true);
        setTurntableProgress({ current: 1, total: TURNTABLE_ANGLES.length });
        setError(null);

        try {
            const newImages: TurntableImage[] = [{ id: 'front', url: baseImage }];
            const mimeType = baseImage.split(';')[0].split(':')[1];
            
            for (let i = 1; i < TURNTABLE_ANGLES.length; i++) {
                const angle = TURNTABLE_ANGLES[i];
                setTurntableProgress(prev => ({ ...prev, current: i + 1 }));
                
                const newAngleUrl = await generateDifferentAngle(baseImage, mimeType, angle.prompt);
                newImages.push({ id: angle.id, url: newAngleUrl });
                
                // Cập nhật trạng thái từng ảnh để người dùng thấy tiến trình
                setTurntableImages([...newImages]);

                addToHistory(newAngleUrl, 'outfit', `Góc nhìn 360: ${angle.prompt}`, undefined, [{ url: baseImage, label: 'Kết quả gốc' }]);
            }

            setIsPlaying(true);

        } catch (err: any) {
            setError(err.message || "Không thể tạo chế độ xem 360°.");
        } finally {
            setIsGeneratingTurntable(false);
        }
    };

    useEffect(() => {
        if (isPlaying && turntableImages.length === TURNTABLE_ANGLES.length) {
            animationIntervalRef.current = window.setInterval(() => {
                setCurrentAngleIndex(prev => (prev + 1) % TURNTABLE_ANGLES.length);
            }, 250);
        } else {
            if (animationIntervalRef.current) {
                clearInterval(animationIntervalRef.current);
                animationIntervalRef.current = null;
            }
        }
        return () => {
            if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
        };
    }, [isPlaying, turntableImages.length]);

    // --- Drag-to-rotate handlers ---
    const handleDragStart = (clientX: number) => {
        setIsPlaying(false);
        setIsDragging(true);
        dragStartX.current = clientX;
        dragStartIndex.current = currentAngleIndex;
    };

    const handleDragMove = (clientX: number) => {
        if (!isDragging) return;
        const deltaX = clientX - dragStartX.current;
        const angleOffset = Math.round(deltaX / DRAG_SENSITIVITY);
        const newIndex = dragStartIndex.current + angleOffset;
        const totalAngles = TURNTABLE_ANGLES.length;
        // A robust way to handle positive and negative modulo
        const correctedIndex = ((newIndex % totalAngles) + totalAngles) % totalAngles;
        setCurrentAngleIndex(correctedIndex);
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        handleDragStart(e.clientX);
    };
    const handleTouchStart = (e: React.TouchEvent) => {
        handleDragStart(e.touches[0].clientX);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => handleDragMove(e.clientX);
        const handleTouchMove = (e: TouchEvent) => handleDragMove(e.touches[0].clientX);

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('touchmove', handleTouchMove);
            window.addEventListener('mouseup', handleDragEnd);
            window.addEventListener('touchend', handleDragEnd);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchend', handleDragEnd);
        };
    }, [isDragging]);

    const handleEditComplete = (newImageUrl: string, description: string) => {
        const previousResultUrl = resultUrl; // Capture for history
        setResultUrl(newImageUrl);
        // CRITICAL: Update the base image for the turntable
        setTurntableImages([{ id: 'front', url: newImageUrl }]);
        setIsPlaying(false);
        setCurrentAngleIndex(0);

        if (previousResultUrl) {
            addToHistory(newImageUrl, 'outfit', description, 'Edited', [{ url: previousResultUrl, label: 'Ảnh trước khi sửa' }]);
        }
    };

    const isGenerateDisabled = !personFile || (inputMode === 'prompt' ? !outfitPrompt.trim() : !outfitFile) || isGenerating || isEditing;
    const isTurntableComplete = turntableImages.length === TURNTABLE_ANGLES.length;
    const currentDisplayImage = turntableImages[currentAngleIndex]?.url || resultUrl;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-8 animate-fade-in">
            {/* Left Column */}
            <div className="w-full space-y-8">
                <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md">
                    <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">1. Tải lên ảnh người</h2>
                    <ImageUploader onImageUpload={handleImageUpload} onImageClear={handleImageClear} imageUrl={personUrl} />
                </div>
                <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md">
                    <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">2. Chọn Trang phục</h2>
                    <div className="flex justify-center bg-gray-800 p-1 rounded-lg mb-4">
                        <button onClick={() => setMode('prompt')} className={`w-1/2 py-2 rounded-md font-semibold transition-colors ${inputMode === 'prompt' ? 'bg-purple-600 text-white' : 'hover:bg-gray-700'}`}>Mô tả</button>
                        <button onClick={() => setMode('image')} className={`w-1/2 py-2 rounded-md font-semibold transition-colors ${inputMode === 'image' ? 'bg-purple-600 text-white' : 'hover:bg-gray-700'}`}>Tải ảnh lên</button>
                    </div>
                    {inputMode === 'prompt' ? (
                        <div className="animate-fade-in">
                            <textarea
                                value={outfitPrompt}
                                onChange={(e) => setOutfitPrompt(e.target.value)}
                                placeholder="Ví dụ: một chiếc váy dạ hội màu đỏ lấp lánh..."
                                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-purple-500"
                                rows={4}
                            />
                            <div className="mt-4">
                                <h3 className="text-sm font-semibold text-gray-400 mb-2">Hoặc thử một vài gợi ý:</h3>
                                <div className="flex flex-wrap gap-2">
                                    {OUTFIT_SUGGESTIONS.map(suggestion => (
                                        <button key={suggestion} onClick={() => setOutfitPrompt(suggestion)} className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded-full transition-colors">{suggestion}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                         <div className="animate-fade-in">
                            <ImageUploader onImageUpload={handleOutfitUpload} onImageClear={handleOutfitClear} imageUrl={outfitUrl} />
                         </div>
                    )}
                </div>
            </div>

            {/* Right Column */}
            <div className="w-full space-y-6 lg:sticky top-8">
                <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md">
                    <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">3. Thử đồ</h2>
                    <button onClick={handleGenerateClick} disabled={isGenerateDisabled} className="w-full py-4 px-6 text-lg font-bold rounded-lg shadow-lg transition-all duration-300 ease-in-out flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed">
                        {isGenerating ? <><Spinner /> <span className="ml-2">Đang xử lý...</span></> : 'Mặc thử ngay'}
                    </button>
                </div>
                
                 {(isGenerating || resultUrl) &&
                     <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md animate-fade-in">
                         <h2 className="text-2xl font-semibold text-gray-100 mb-4">Kết quả</h2>
                         <div 
                             className={`relative w-full aspect-square bg-gray-900/50 rounded-xl flex justify-center items-center overflow-hidden ${isTurntableComplete ? 'cursor-ew-resize' : ''}`}
                             onMouseDown={isTurntableComplete ? handleMouseDown : undefined}
                             onTouchStart={isTurntableComplete ? handleTouchStart : undefined}
                         >
                             {isGenerating ? (
                                 <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center z-10 p-4">
                                     <Spinner />
                                     <p className="mt-4 text-lg text-gray-200 text-center">AI đang tìm đồ...</p>
                                 </div>
                             ) : !isTurntableComplete && resultUrl && personUrl ? (
                                <BeforeAfterSlider before={personUrl} after={resultUrl} />
                             ) : currentDisplayImage ? (
                                <img src={currentDisplayImage} alt="Turntable view" className="object-contain w-full h-full select-none" draggable="false" />
                             ) : null }
                         </div>
                     </div>
                 }
                {resultUrl && !isGenerating && (
                    <>
                        <ImageEditor
                            imageUrl={resultUrl}
                            onEditComplete={handleEditComplete}
                            onStartEditing={() => setIsEditing(true)}
                            onEndEditing={() => setIsEditing(false)}
                        />
                        <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg animate-fade-in">
                            <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">Chế độ xem 360°</h2>
                            {isTurntableComplete ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-center gap-4">
                                         <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 bg-gray-700 rounded-full hover:bg-gray-600">
                                            {isPlaying ? 
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v4a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg> :
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                                            }
                                        </button>
                                        <p className="text-sm text-gray-300 font-semibold w-24 text-center">{TURNTABLE_ANGLES[currentAngleIndex].name}</p>
                                    </div>
                                    <div className="mt-4">
                                        <div className="flex gap-2 overflow-x-auto p-2 -mx-2 snap-x">
                                            {TURNTABLE_ANGLES.map((angle, index) => {
                                                const image = turntableImages.find(img => img.id === angle.id);
                                                return (
                                                    <button
                                                        key={angle.id}
                                                        onClick={() => {
                                                            setCurrentAngleIndex(index);
                                                            setIsPlaying(false);
                                                        }}
                                                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all duration-200 border-2 snap-center ${currentAngleIndex === index ? 'border-purple-500 scale-105' : 'border-transparent hover:border-gray-500'}`}
                                                    >
                                                        {image?.url ? (
                                                            <img src={image.url} alt={angle.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                                                <Spinner />
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <a href={currentDisplayImage || '#'} download={`ai-outfit-${TURNTABLE_ANGLES[currentAngleIndex].id}.png`} className={`w-full text-center block py-3 px-6 text-md font-semibold rounded-lg shadow-md bg-green-600 text-white hover:bg-green-700 ${!currentDisplayImage || isEditing ? 'pointer-events-none opacity-50' : ''}`}>
                                        Tải xuống góc nhìn hiện tại
                                    </a>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-center text-gray-400 text-sm mb-4">Nâng cấp kết quả của bạn thành một mô hình xoay 360 độ.</p>
                                    <button onClick={handleGenerateTurntable} disabled={isGeneratingTurntable || isEditing} className="w-full py-3 px-4 text-md font-bold rounded-lg shadow-lg transition-all flex items-center justify-center bg-teal-600 text-white hover:bg-teal-700 disabled:bg-gray-600 disabled:cursor-not-allowed">
                                         {isGeneratingTurntable ? <><Spinner /> <span className="ml-2">Đang tạo...</span></> : 'Tạo Chế độ xem 360°'}
                                    </button>
                                     {isGeneratingTurntable && (
                                        <div className="mt-4">
                                            <p className="text-center text-sm text-gray-300">Đang tạo góc nhìn {turntableProgress.current}/{turntableProgress.total}</p>
                                            <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                                                <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${(turntableProgress.current / turntableProgress.total) * 100}%` }}></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
                {error && <div className="p-4 bg-red-900/50 border-red-500/50 rounded-lg text-red-300 text-center mt-4">{error}</div>}
            </div>
        </div>
    );
};

export default OutfitTryOn;