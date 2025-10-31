import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import Spinner from './Spinner';
import MaskEditor from './MaskEditor';
import { refineImage, editImageWithMask, removeObjectWithMask, generateDifferentAngle, applyColorStyle } from '../services/geminiService';

interface ImageEditorProps {
  imageUrl: string;
  onEditComplete: (newImageUrl: string, description: string) => void;
  onStartEditing: () => void;
  onEndEditing: () => void;
}

type EditMode = 'filters' | 'adjust' | 'erase' | 'add' | 'advanced';

const QUICK_FILTERS = [
    { id: 'vibrant', name: 'Sống động', prompt: 'Apply a vibrant color grading with slightly increased contrast. Make the colors pop.' },
    { id: 'vintage', name: 'Cổ điển', prompt: 'Apply a vintage film look with faded colors and a warm tone.' },
    { id: 'bw', name: 'Đen trắng', prompt: 'Convert the image to a dramatic, high-contrast black and white.' },
    { id: 'cool', name: 'Tông lạnh', prompt: 'Apply a cool color grading, emphasizing blues and greens for a cinematic feel.' },
    { id: 'warm', name: 'Tông ấm', prompt: 'Apply a warm, golden-hour color grading, emphasizing reds and yellows.' },
];

const AI_ADJUSTMENTS = [
    { id: 'brighten', name: 'Làm sáng hơn', prompt: 'Slightly brighten the image, making sure to preserve highlights and details.' },
    { id: 'darken', name: 'Làm tối hơn', prompt: 'Slightly darken the image, increasing the moodiness while preserving shadow details.' },
    { id: 'contrast', name: 'Tăng tương phản', prompt: 'Increase the overall contrast of the image for a punchier look.' },
    { id: 'sharpen', name: 'Tăng độ nét', prompt: 'Slightly increase the sharpness and clarity of the image, focusing on details.' },
];

const ICONS: { [key in EditMode]: React.ReactElement } = {
    filters: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" /></svg>,
    adjust: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 100 2h4a1 1 0 100-2H8z" clipRule="evenodd" /></svg>,
    erase: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM6 4a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zM4 6a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 9a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zm1 3a1 1 0 100 2h12a1 1 0 100-2H3z" clipRule="evenodd" /></svg>,
    add: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>,
    advanced: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M11.957 2.02c.16-.488.693-.774 1.182-.614l1.37.436a1 1 0 01.613 1.182l-2.152 6.783a1 1 0 01-1.182.614l-1.37-.436a1 1 0 01-.613-1.182L11.957 2.02zM8.5 2.193a1 1 0 00-1.182.614L5.166 9.59a1 1 0 00.613 1.182l1.37.436a1 1 0 001.182-.614L10.484 3.81a1 1 0 00-.613-1.182l-1.37-.436zM12.5 11.536a1 1 0 00-1.182.614l-2.152 6.783a1 1 0 00.613 1.182l1.37.436a1 1 0 001.182-.614l2.152-6.783a1 1 0 00-.613-1.182l-1.37-.436z" /></svg>,
};


const ImageEditor: React.FC<ImageEditorProps> = ({ imageUrl, onEditComplete, onStartEditing, onEndEditing }) => {
    const [history, setHistory] = useState<string[]>([]);
    const [currentImage, setCurrentImage] = useState<string>(imageUrl);
    const [activeMode, setActiveMode] = useState<EditMode>('filters');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [isMaskEditorOpen, setIsMaskEditorOpen] = useState(false);
    const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null);
    const [addPrompt, setAddPrompt] = useState('');
    
    // State for advanced tools
    const styleFileInputRef = useRef<HTMLInputElement>(null);
    const [blurLevel, setBlurLevel] = useState(1); // 0: low, 1: medium, 2: strong
    const BLUR_LABELS = ['Nhẹ', 'Vừa', 'Mạnh'];
    
    useEffect(() => {
        setCurrentImage(imageUrl);
        setHistory([imageUrl]);
        setError(null);
    }, [imageUrl]);

    useEffect(() => {
        if (isLoading) {
            onStartEditing();
        } else {
            onEndEditing();
        }
    }, [isLoading, onStartEditing, onEndEditing]);
    
    const handleUndo = () => {
        if (history.length > 1) {
            const newHistory = [...history];
            newHistory.pop();
            setHistory(newHistory);
            setCurrentImage(newHistory[newHistory.length - 1]);
            onEditComplete(newHistory[newHistory.length - 1], "Hoàn tác chỉnh sửa");
        }
    };
    
    const handleApiCall = async (apiFunc: () => Promise<string>, description: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const resultUrl = await apiFunc();
            setCurrentImage(resultUrl);
            setHistory(prev => [...prev, resultUrl]);
            onEditComplete(resultUrl, description);
        } catch (err: any) {
            setError(err.message || 'Chỉnh sửa thất bại.');
        } finally {
            setIsLoading(false);
        }
    };

    const applyRefine = (prompt: string, description: string) => {
        const mimeType = currentImage.split(';')[0].split(':')[1];
        handleApiCall(() => refineImage(currentImage, mimeType, prompt), description);
    };

    const handleMaskSave = (newMaskDataUrl: string) => {
        setMaskDataUrl(newMaskDataUrl);
        setIsMaskEditorOpen(false);
    };

    const handleMagicErase = () => {
        if (!maskDataUrl) return;
        const mimeType = currentImage.split(';')[0].split(':')[1];
        handleApiCall(() => removeObjectWithMask(currentImage, mimeType, maskDataUrl), "Xóa vật thể");
        setMaskDataUrl(null);
    };
    
    const handleAddElement = () => {
        if (!maskDataUrl || !addPrompt.trim()) return;
        const mimeType = currentImage.split(';')[0].split(':')[1];
        handleApiCall(() => editImageWithMask(currentImage, mimeType, maskDataUrl, addPrompt), `Thêm: ${addPrompt}`);
        setMaskDataUrl(null);
        setAddPrompt('');
    };
    
    // --- Advanced Tool Handlers ---
    const handleAngleChange = (anglePrompt: string, angleName: string) => {
        const mimeType = currentImage.split(';')[0].split(':')[1];
        handleApiCall(() => generateDifferentAngle(currentImage, mimeType, anglePrompt), `Góc nhìn: ${angleName}`);
    };

    const handleApplyStyle = (file: File | null) => {
        if (!file) return;
        const mimeType = currentImage.split(';')[0].split(':')[1];
        handleApiCall(() => applyColorStyle(currentImage, mimeType, file), `Áp dụng phong cách từ ${file.name}`);
        if(styleFileInputRef.current) styleFileInputRef.current.value = "";
    };

    const handleBlurBackground = () => {
        const blurPrompts = [
            'Apply a subtle but realistic photographic background blur (bokeh)',
            'Apply a medium photographic background blur (bokeh)',
            'Apply a strong and cinematic background blur (bokeh)'
        ];
        const prompt = `${blurPrompts[blurLevel]}, ensuring the main subject remains in sharp focus.`;
        applyRefine(prompt, `Làm mờ nền: ${BLUR_LABELS[blurLevel]}`);
    };

    const renderSubPanel = () => {
        switch (activeMode) {
            case 'filters':
                return QUICK_FILTERS.map(filter => (
                    <button key={filter.id} onClick={() => applyRefine(filter.prompt, `Bộ lọc: ${filter.name}`)} className="px-3 py-2 text-sm text-center bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">{filter.name}</button>
                ));
            case 'adjust':
                return AI_ADJUSTMENTS.map(adj => (
                    <button key={adj.id} onClick={() => applyRefine(adj.prompt, adj.name)} className="px-3 py-2 text-sm text-center bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">{adj.name}</button>
                ));
            case 'erase':
                return (
                    <div className="w-full text-center p-2 bg-gray-800/50 rounded-lg col-span-full">
                        <p className="text-sm text-gray-400 mb-3">Tô lên vùng ảnh bạn muốn xóa.</p>
                        <button onClick={() => setIsMaskEditorOpen(true)} className="w-full mb-3 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors">
                            Vẽ để chọn vật thể
                        </button>
                        {maskDataUrl && (
                             <div className="flex flex-col items-center gap-3">
                                <p className="text-sm font-semibold text-green-400">Đã chọn vật thể. Sẵn sàng để xóa.</p>
                                <button onClick={handleMagicErase} className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors">
                                    Xóa ngay
                                </button>
                            </div>
                        )}
                    </div>
                );
            case 'add':
                 return (
                    <div className="w-full text-center p-2 bg-gray-800/50 rounded-lg col-span-full">
                        <p className="text-sm text-gray-400 mb-3">Tô lên vùng ảnh bạn muốn thêm hoặc thay đổi, sau đó mô tả yêu cầu của bạn.</p>
                        <button onClick={() => setIsMaskEditorOpen(true)} className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors">
                            Vẽ để chọn vùng
                        </button>
                        {maskDataUrl && (
                             <div className="flex flex-col items-center gap-3 mt-3 animate-fade-in">
                                 <p className="text-sm font-semibold text-green-400">Đã chọn vùng.</p>
                                <textarea
                                  value={addPrompt}
                                  onChange={(e) => setAddPrompt(e.target.value)}
                                  placeholder="Ví dụ: một con chim đang bay"
                                  className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200"
                                  rows={2}
                                />
                                <button onClick={handleAddElement} disabled={!addPrompt.trim()} className="w-full py-2 px-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg transition-colors disabled:bg-gray-600">
                                    Áp dụng thay đổi
                                </button>
                            </div>
                        )}
                    </div>
                );
            case 'advanced':
                return (
                    <div className="col-span-full space-y-4">
                        {/* Change Angle */}
                        <div className="p-2 bg-gray-800/50 rounded-lg">
                            <h4 className="text-center font-semibold text-gray-300 text-sm mb-2">Thay đổi góc nhìn</h4>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => handleAngleChange('three-quarter view from the left', 'Nhìn từ trái')} className="px-2 py-1 text-xs text-center bg-gray-700 hover:bg-gray-600 rounded-lg">Nhìn từ trái</button>
                                <button onClick={() => handleAngleChange('head looking up slightly', 'Nhìn lên')} className="px-2 py-1 text-xs text-center bg-gray-700 hover:bg-gray-600 rounded-lg">Nhìn lên</button>
                                <button onClick={() => handleAngleChange('three-quarter view from the right', 'Nhìn từ phải')} className="px-2 py-1 text-xs text-center bg-gray-700 hover:bg-gray-600 rounded-lg">Nhìn từ phải</button>
                            </div>
                        </div>
                        {/* Copy Color Style */}
                        <div className="p-2 bg-gray-800/50 rounded-lg">
                            <h4 className="text-center font-semibold text-gray-300 text-sm mb-2">Sao chép phong cách màu</h4>
                             <label htmlFor="style-ref-upload" className="w-full cursor-pointer text-center block py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors">
                                Tải ảnh tham chiếu
                             </label>
                            <input id="style-ref-upload" type="file" accept="image/*" ref={styleFileInputRef} onChange={(e) => handleApplyStyle(e.target.files ? e.target.files[0] : null)} className="hidden" />
                        </div>
                        {/* Blur Background */}
                         <div className="p-2 bg-gray-800/50 rounded-lg">
                            <h4 className="text-center font-semibold text-gray-300 text-sm mb-2">Làm mờ nền: <span className="text-purple-400">{BLUR_LABELS[blurLevel]}</span></h4>
                             <input
                                type="range"
                                min="0"
                                max="2"
                                value={blurLevel}
                                onChange={e => setBlurLevel(Number(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-thumb-purple"
                            />
                             <button onClick={handleBlurBackground} className="w-full mt-2 py-2 px-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm rounded-lg transition-colors">
                                Áp dụng
                            </button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <>
            {isMaskEditorOpen && (
                <MaskEditor 
                    imageUrl={currentImage}
                    onSave={handleMaskSave}
                    onClose={() => setIsMaskEditorOpen(false)}
                />
            )}
            <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-200">Trình chỉnh sửa AI</h3>
                    <button onClick={handleUndo} disabled={history.length <= 1 || isLoading} className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center gap-2">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                        Hoàn tác
                    </button>
                </div>
                <div className="relative w-full aspect-square bg-gray-900/50 rounded-xl flex justify-center items-center overflow-hidden mb-4">
                    {isLoading && (
                        <div className="absolute inset-0 bg-black/70 flex flex-col justify-center items-center z-20">
                            <Spinner />
                            <p className="mt-2 text-gray-300">AI đang xử lý...</p>
                        </div>
                    )}
                    <img src={currentImage} alt="Editable result" className="object-contain w-full h-full" />
                </div>
                
                <div className="grid grid-cols-5 gap-2 mb-4 p-1 bg-gray-900/50 rounded-lg">
                    {(Object.keys(ICONS) as EditMode[]).map(mode => (
                        <button 
                            key={mode} 
                            onClick={() => { setActiveMode(mode); setMaskDataUrl(null); }}
                            className={`py-2 text-sm font-semibold rounded-md flex flex-col sm:flex-row items-center justify-center gap-2 transition-colors ${activeMode === mode ? 'bg-purple-600 text-white' : 'hover:bg-gray-700'}`}
                        >
                           {ICONS[mode]} <span className="hidden sm:inline capitalize">{mode === 'advanced' ? 'Chuyên sâu' : mode}</span>
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 min-h-[50px]">
                    {renderSubPanel()}
                </div>
                {error && <p className="text-red-400 text-sm mt-3 text-center">{error}</p>}
            </div>
        </>
    );
};

export default ImageEditor;