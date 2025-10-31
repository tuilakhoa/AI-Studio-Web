import React, { useState, useCallback } from 'react';
import ImageUploader from '../components/ImageUploader';
import StyleSelector from '../components/StyleSelector';
import Spinner from '../components/Spinner';
import BeforeAfterSlider from '../components/BeforeAfterSlider';
import ImageEditor from '../components/ImageEditor';
import { HeadshotStyle } from '../types';
import { generateHeadshot, upscaleImage, extractColorPalette } from '../services/geminiService';
import { addToHistory } from '../services/historyService';
import { HEADSHOT_STYLES } from '../constants';

const ASPECT_RATIOS = [
    { id: '1:1', name: 'Vuông' },
    { id: '16:9', name: 'Ngang' },
    { id: '9:16', name: 'Dọc' },
];

type GeneratedImage = {
    url: string;
    styleName: string;
};

const LIGHTING_OPTIONS = [
    { id: 'studio', name: 'Studio' },
    { id: 'natural', name: 'Tự nhiên' },
    { id: 'dramatic', name: 'Kịch tính' },
    { id: 'night', name: 'Ban đêm' },
];

const BACKGROUND_OPTIONS = [
    { id: 'style_default', name: 'Theo Phong cách' },
    { id: 'remove_white', name: 'Nền trắng' },
    { id: 'remove_black', name: 'Nền đen' },
    { id: 'remove_grey', name: 'Nền xám' },
];

const EXPRESSION_OPTIONS = [
    { id: 'style_default', name: 'Mặc định' },
    { id: 'friendly', name: 'Thân thiện' },
    { id: 'confident', name: 'Tự tin' },
    { id: 'serious', name: 'Nghiêm túc' },
    { id: 'joyful', name: 'Vui vẻ' },
];


const BLUR_LABELS = ['Rõ nét', 'Thấp', 'Vừa', 'Cao'];

interface HeadshotGeneratorProps {
  requireAuth: () => boolean;
}

const AspectRatioSelector: React.FC<{
    selectedRatio: string;
    onSelectRatio: (ratio: string) => void;
}> = ({ selectedRatio, onSelectRatio }) => (
    <div className="flex justify-center gap-3">
        {ASPECT_RATIOS.map(ratio => (
            <button
                key={ratio.id}
                onClick={() => onSelectRatio(ratio.id)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${selectedRatio === ratio.id ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
                {ratio.name} ({ratio.id})
            </button>
        ))}
    </div>
);


const HeadshotGenerator: React.FC<HeadshotGeneratorProps> = ({ requireAuth }) => {
  const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<HeadshotStyle | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isUpscaling, setIsUpscaling] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [colorPalette, setColorPalette] = useState<string[] | null>(null);
  const [isExtractingPalette, setIsExtractingPalette] = useState<boolean>(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string>('');
  const [batchProgress, setBatchProgress] = useState<{ current: number, total: number} | null>(null);

  // New state for input mode and custom prompt
  const [inputMode, setInputMode] = useState<'style' | 'prompt'>('style');
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // Advanced options state
  const [lightingOption, setLightingOption] = useState('studio');
  const [backgroundOption, setBackgroundOption] = useState('style_default');
  const [blurLevel, setBlurLevel] = useState(2); // 0: none, 1: low, 2: medium, 3: high
  const [expression, setExpression] = useState('style_default');

  const handleImageUpload = useCallback((file: File) => {
    if (originalImageUrl) {
      URL.revokeObjectURL(originalImageUrl);
    }
    setOriginalImageFile(file);
    setOriginalImageUrl(URL.createObjectURL(file));
    setGeneratedImages([]);
    setError(null);
    setColorPalette(null);
  }, [originalImageUrl]);

  const handleImageClear = useCallback(() => {
    if (originalImageUrl) {
      URL.revokeObjectURL(originalImageUrl);
    }
    setOriginalImageFile(null);
    setOriginalImageUrl(null);
    setGeneratedImages([]);
    setError(null);
    setColorPalette(null);
  }, [originalImageUrl]);

  const handleStyleSelect = useCallback((style: HeadshotStyle) => {
    setSelectedStyle(style);
    setError(null);
  }, []);
  
  const handleGenerateSuccess = (resultUrl: string, style: Pick<HeadshotStyle, 'name'>, fullPrompt: string) => {
      setGeneratedImages([{ url: resultUrl, styleName: style.name }]);
      if (originalImageUrl) {
        addToHistory(resultUrl, 'headshot', fullPrompt, style.name, [{ url: originalImageUrl, label: 'Ảnh gốc' }]);
      }
  }

  const buildFullPrompt = useCallback((style: HeadshotStyle) => {
    let finalPrompt = `Generate a new, photorealistic, professional headshot of the person in the image. Maintain their core facial features, ethnicity, and approximate age. The final image should be a high-quality photograph, not an illustration or cartoon. ${style.prompt}`;

    // Expression override
    if (expression !== 'style_default') {
        finalPrompt += ` Critically, the person must have a ${expression} expression, overriding any other expression description.`;
    }

    // Lighting
    switch (lightingOption) {
        case 'natural':
            finalPrompt += " The lighting should be bright, natural, and warm, as if from a large window.";
            break;
        case 'dramatic':
            finalPrompt += " Use dramatic, high-contrast lighting like Rembrandt or split lighting to create a moody and powerful look.";
            break;
        case 'night':
            finalPrompt += " The scene is at night. The lighting should be cinematic and moody, coming from artificial sources like city lights or neon signs.";
            break;
        case 'studio':
        default:
            finalPrompt += " The lighting should be soft, even, and flattering, typical of a professional studio setup.";
            break;
    }

    // Background
    switch (backgroundOption) {
        case 'remove_white':
            finalPrompt += " The background must be a clean, solid, perfectly uniform white.";
            break;
        case 'remove_black':
            finalPrompt += " The background must be a clean, solid, perfectly uniform black.";
            break;
        case 'remove_grey':
            finalPrompt += " The background must be a clean, solid, perfectly uniform light grey.";
            break;
        case 'style_default':
        default:
            finalPrompt += ` The background should be ${style.backgroundDescription}.`;
            const blurLevels = ['in sharp focus', 'slightly blurred', 'moderately blurred with a pleasant bokeh effect', 'very heavily and smoothly blurred'];
            if(blurLevel >= 0 && blurLevel < blurLevels.length) {
                finalPrompt += ` It should be ${blurLevels[blurLevel]}.`;
            }
            break;
    }
     if (style.id === 'black_white') {
        finalPrompt += ' The final image must be in black and white.';
    }

    return finalPrompt;
  }, [lightingOption, backgroundOption, blurLevel, expression]);

  const buildFullPromptFromCustom = useCallback((userPrompt: string) => {
    let finalPrompt = `The style must be based on this description: "${userPrompt}".`;

    if (expression !== 'style_default') {
        finalPrompt += ` Critically, the person must have a ${expression} expression, overriding any other expression description.`;
    }

    switch (lightingOption) {
        case 'natural': finalPrompt += " The lighting should be bright, natural, and warm."; break;
        case 'dramatic': finalPrompt += " Use dramatic, high-contrast lighting."; break;
        case 'night': finalPrompt += " The scene is at night with cinematic lighting."; break;
        case 'studio': default: finalPrompt += " The lighting should be soft, even, and flattering, typical of a professional studio setup."; break;
    }

    switch (backgroundOption) {
        case 'remove_white': finalPrompt += " The background must be a clean, solid, perfectly uniform white."; break;
        case 'remove_black': finalPrompt += " The background must be a clean, solid, perfectly uniform black."; break;
        case 'remove_grey': finalPrompt += " The background must be a clean, solid, perfectly uniform light grey."; break;
        case 'style_default':
        default:
            const blurLevels = ['in sharp focus', 'slightly blurred', 'moderately blurred with a pleasant bokeh effect', 'very heavily and smoothly blurred'];
            if(blurLevel >= 0 && blurLevel < blurLevels.length) {
                finalPrompt += ` The background should be ${blurLevels[blurLevel]}.`;
            }
            break;
    }
    return finalPrompt;
  }, [lightingOption, backgroundOption, blurLevel, expression]);

  const handleGenerateClick = async () => {
    if (!requireAuth()) return;

    if (!originalImageFile) {
        setError("Vui lòng tải lên ảnh.");
        return;
    }
     if (inputMode === 'style' && !selectedStyle) {
      setError("Vui lòng chọn một phong cách.");
      return;
    }
    if (inputMode === 'prompt' && !customPrompt.trim()) {
      setError("Vui lòng nhập một lời nhắc tùy chỉnh.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);
    setColorPalette(null);

    try {
      const fullPrompt = inputMode === 'style' 
        ? buildFullPrompt(selectedStyle!)
        : buildFullPromptFromCustom(customPrompt);
        
      const resultUrl = await generateHeadshot(originalImageFile, fullPrompt, aspectRatio);
      
      const styleForHistory = inputMode === 'style' 
        ? selectedStyle! 
        : { name: 'Lời nhắc Tùy chỉnh' };
        
      handleGenerateSuccess(resultUrl, styleForHistory, fullPrompt);

    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi không xác định.");
    } finally {
      setIsGenerating(false);
    }
  };
  
   const handleGenerateAllClick = async () => {
    if (!requireAuth()) return;

    if (!originalImageFile || !originalImageUrl) {
        setError("Vui lòng tải lên một ảnh trước.");
        return;
    }
    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);
    setColorPalette(null);
    setBatchProgress({ current: 0, total: HEADSHOT_STYLES.length });

    const results: GeneratedImage[] = [];
    try {
        for (let i = 0; i < HEADSHOT_STYLES.length; i++) {
            const style = HEADSHOT_STYLES[i];
            setBatchProgress({ current: i + 1, total: HEADSHOT_STYLES.length });
            try {
                const fullPrompt = buildFullPrompt(style);
                const resultUrl = await generateHeadshot(originalImageFile, fullPrompt, aspectRatio);
                results.push({ url: resultUrl, styleName: style.name });
                addToHistory(resultUrl, 'headshot', fullPrompt, style.name, [{ url: originalImageUrl, label: 'Ảnh gốc' }]);
            } catch (styleError) {
                console.error(`Lỗi khi tạo phong cách ${style.name}:`, styleError);
                // Optionally add a placeholder for failed images
            }
        }
        setGeneratedImages(results);
    } catch (err: any) {
        setError(err.message || "Đã xảy ra lỗi không xác định trong quá trình tạo hàng loạt.");
    } finally {
        setIsGenerating(false);
        setBatchProgress(null);
    }
  };

  const handleEditComplete = (newImageUrl: string, description: string) => {
    if (generatedImages.length > 0) {
        const originalImageUrlForEdit = generatedImages[0].url;
        setGeneratedImages([{ ...generatedImages[0], url: newImageUrl }]);
        addToHistory(newImageUrl, 'headshot', description, "Edited", [{ url: originalImageUrlForEdit, label: "Ảnh trước khi sửa" }]);
        setColorPalette(null); // Palette may have changed
    }
  };

  const handleUpscaleClick = async () => {
    if (generatedImages.length !== 1) return;

    setIsUpscaling(true);
    setError(null);

    try {
        const imageToUpscale = generatedImages[0];
        const mimeType = imageToUpscale.url.split(';')[0].split(':')[1];
        const upscaledUrl = await upscaleImage(imageToUpscale.url, mimeType);
        
        setGeneratedImages([{ url: upscaledUrl, styleName: imageToUpscale.styleName + " (Nâng cấp)" }]);
        addToHistory(upscaledUrl, 'headshot', 'Upscaled Image', imageToUpscale.styleName, [{ url: imageToUpscale.url, label: "Ảnh trước khi nâng cấp" }]);
        setColorPalette(null);
    } catch (err: any) {
        setError(err.message || "Không thể nâng cấp ảnh.");
    } finally {
        setIsUpscaling(false);
    }
  };

  const handleExtractPalette = async () => {
    if (generatedImages.length === 0) return;
    
    setIsExtractingPalette(true);
    setError(null);
    
    try {
        const mimeType = generatedImages[0].url.split(';')[0].split(':')[1];
        const colors = await extractColorPalette(generatedImages[0].url, mimeType);
        setColorPalette(colors);
    } catch (err: any) {
        setError(err.message || "Đã xảy ra lỗi không xác định.");
    } finally {
        setIsExtractingPalette(false);
    }
  };

  const handleCopyColor = (color: string) => {
      navigator.clipboard.writeText(color);
      setCopiedColor(color);
      setTimeout(() => setCopiedColor(null), 2000);
  };
    
  const handleShare = async () => {
    if (generatedImages.length === 0) return;
    setShareFeedback('Đang chuẩn bị...');
    try {
        const response = await fetch(generatedImages[0].url);
        const blob = await response.blob();
        const file = new File([blob], 'ai-headshot.png', { type: blob.type });

        if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({
                title: 'AI Headshot',
                text: 'Đây là ảnh chân dung mới của tôi được tạo bằng AI Studio!',
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

  const isGenerateDisabled = !originalImageFile || isGenerating || isEditing || isUpscaling || (inputMode === 'style' && !selectedStyle) || (inputMode === 'prompt' && !customPrompt.trim());
  const isLoading = isGenerating || isUpscaling;
  const generatedImageUrl = generatedImages.length > 0 ? generatedImages[0].url : null;


  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-8 animate-fade-in">
        {/* Left Column */}
        <div className="w-full space-y-8">
          <ImageUploader 
            onImageUpload={handleImageUpload} 
            onImageClear={handleImageClear}
            imageUrl={originalImageUrl} 
          />
          <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md">
            <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">2. Tùy chọn Sáng tạo</h2>
            
            <div className="flex justify-center bg-gray-800 p-1 rounded-lg mb-4">
                <button onClick={() => setInputMode('style')} className={`w-1/2 py-2 rounded-md font-semibold transition-colors ${inputMode === 'style' ? 'bg-purple-600 text-white' : 'hover:bg-gray-700'}`}>
                    Chọn Phong cách
                </button>
                <button onClick={() => setInputMode('prompt')} className={`w-1/2 py-2 rounded-md font-semibold transition-colors ${inputMode === 'prompt' ? 'bg-purple-600 text-white' : 'hover:bg-gray-700'}`}>
                    Dùng Lời nhắc
                </button>
            </div>

            {inputMode === 'style' ? (
                <div className="animate-fade-in">
                    <StyleSelector selectedStyle={selectedStyle} onStyleSelect={handleStyleSelect} />
                </div>
            ) : (
                <div className="animate-fade-in">
                    <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Ví dụ: một bức ảnh chân dung đen trắng cổ điển, ánh sáng ấn tượng, nền tối..."
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-purple-500"
                        rows={4}
                    />
                </div>
            )}
            
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-200 mb-3 text-center">Tỷ lệ khung hình</h3>
              <AspectRatioSelector selectedRatio={aspectRatio} onSelectRatio={setAspectRatio} />
            </div>
          </div>
          <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md">
            <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">Tùy chỉnh</h2>

            <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-200 text-center">Ánh sáng</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {LIGHTING_OPTIONS.map(opt => (
                        <button key={opt.id} onClick={() => setLightingOption(opt.id)} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${lightingOption === opt.id ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                            {opt.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-6 space-y-3">
                <h3 className="text-lg font-semibold text-gray-200 text-center">Nền</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {BACKGROUND_OPTIONS.map(opt => (
                        <button key={opt.id} onClick={() => setBackgroundOption(opt.id)} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${backgroundOption === opt.id ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                            {opt.name}
                        </button>
                    ))}
                </div>
            </div>
            
            {backgroundOption === 'style_default' && (
                <div className="mt-6 space-y-3 animate-fade-in">
                    <h3 className="text-lg font-semibold text-gray-200 text-center">Độ mờ nền: <span className="font-bold text-purple-400">{BLUR_LABELS[blurLevel]}</span></h3>
                    <input
                        type="range"
                        min="0"
                        max="3"
                        value={blurLevel}
                        onChange={e => setBlurLevel(Number(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-thumb-purple"
                    />
                    <div className="flex justify-between text-xs text-gray-400 px-1">
                        {BLUR_LABELS.map(label => <span key={label}>{label}</span>)}
                    </div>
                </div>
            )}
            <details className="mt-6 group">
                <summary className="list-none flex items-center justify-center cursor-pointer text-purple-400 font-semibold">
                  <span>Tùy chọn Nâng cao</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 transition-transform group-open:rotate-90" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                </summary>
                <div className="mt-4 pt-4 border-t border-white/10 animate-fade-in">
                   <h3 className="text-lg font-semibold text-gray-200 text-center">Biểu cảm</h3>
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-3">
                        {EXPRESSION_OPTIONS.map(opt => (
                            <button key={opt.id} onClick={() => setExpression(opt.id)} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${expression === opt.id ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                {opt.name}
                            </button>
                        ))}
                    </div>
                </div>
            </details>
          </div>
        </div>

        {/* Right Column */}
        <div className="w-full space-y-6 lg:sticky top-8">
          <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md">
            <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">3. Tạo Headshot</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={handleGenerateClick}
                disabled={isGenerateDisabled}
                className="w-full py-3 px-4 text-md font-bold rounded-lg shadow-lg transition-all duration-300 ease-in-out flex items-center justify-center
                          bg-gradient-to-r from-purple-600 to-indigo-600 text-white
                          hover:from-purple-700 hover:to-indigo-700 hover:shadow-purple-500/50
                          focus:outline-none focus:ring-4 focus:ring-purple-400 focus:ring-opacity-50
                          disabled:from-gray-600 disabled:to-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isGenerating && !batchProgress ? <><Spinner /> <span className="ml-2">Đang tạo...</span></> : 'Tạo Headshot'}
              </button>
              <button
                onClick={handleGenerateAllClick}
                disabled={isGenerateDisabled || inputMode === 'prompt'}
                className="w-full py-3 px-4 text-md font-bold rounded-lg shadow-lg transition-all duration-300 ease-in-out flex items-center justify-center
                          bg-gradient-to-r from-teal-500 to-cyan-500 text-white
                          hover:from-teal-600 hover:to-cyan-600
                          focus:outline-none focus:ring-4 focus:ring-cyan-400
                          disabled:from-gray-600 disabled:to-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isGenerating && batchProgress ? <><Spinner /> <span className="ml-2">Đang tạo...</span></> : '🚀 Tạo tất cả'}
              </button>
              </div>
          </div>
          
          {(isLoading || generatedImages.length > 0) &&
            <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md animate-fade-in">
              <h2 className="text-2xl font-semibold text-gray-100 mb-4">Kết quả</h2>
              <div className="relative w-full aspect-square bg-gray-900/50 border-2 border-gray-700 rounded-xl flex justify-center items-center overflow-hidden">
                {isGenerating ? (
                  <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center z-10 rounded-lg">
                    <Spinner />
                    <p className="mt-4 text-lg text-gray-200">
                      {batchProgress ? `Đang tạo ${batchProgress.current}/${batchProgress.total}...` : 'Đang tạo headshot...'}
                    </p>
                  </div>
                ) : (generatedImages.length === 1 && originalImageUrl ?
                  <BeforeAfterSlider before={originalImageUrl} after={generatedImages[0].url} /> :
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2 w-full h-full overflow-y-auto">
                      {generatedImages.map((img, index) => (
                          <div key={index} className="relative group aspect-square">
                              <img src={img.url} alt={img.styleName} className="w-full h-full object-cover rounded-md" />
                              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 rounded-md">
                                  <p className="text-white text-xs font-semibold">{img.styleName}</p>
                              </div>
                          </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          }
          
          {generatedImages.length === 1 && !isGenerating && generatedImageUrl && (
            <ImageEditor 
                imageUrl={generatedImageUrl}
                onEditComplete={handleEditComplete}
                onStartEditing={() => setIsEditing(true)}
                onEndEditing={() => setIsEditing(false)}
            />
          )}

          {generatedImages.length > 0 && !isGenerating && (
            <>
              <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md animate-fade-in">
                <h3 className="text-xl font-semibold text-gray-200 mb-3">Công cụ & Xuất ảnh</h3>
                <p className="text-sm text-gray-400 mb-3">Các công cụ này sẽ hoạt động trên ảnh cuối cùng trong trình chỉnh sửa.</p>
                
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    onClick={handleExtractPalette}
                    disabled={isExtractingPalette || isEditing}
                    className="col-span-2 py-3 px-6 text-md font-semibold rounded-lg shadow-md transition-all duration-300 ease-in-out flex items-center justify-center
                              bg-gradient-to-r from-teal-500 to-cyan-500 text-white
                              hover:from-teal-600 hover:to-cyan-600
                              focus:outline-none focus:ring-4 focus:ring-teal-300
                              disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed"
                  >
                      {isExtractingPalette ? <><Spinner /><span className="ml-2">Đang trích xuất...</span></> : '🎨 Trích xuất Bảng màu'}
                  </button>
                  {colorPalette && (
                      <div className="mt-2 col-span-2 animate-fade-in">
                          <div className="flex justify-center gap-2 relative">
                              {colorPalette.map((color, index) => (
                                  <div key={index} className="relative">
                                      <button
                                          onClick={() => handleCopyColor(color)}
                                          className="w-10 h-10 rounded-lg border-2 border-white/20 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white"
                                          style={{ backgroundColor: color }}
                                          title={`Sao chép ${color}`}
                                      />
                                      {copiedColor === color && <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-0.5 rounded">Đã sao chép!</div>}
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
                  <button
                    onClick={handleUpscaleClick}
                    disabled={isUpscaling || isGenerating || isEditing || generatedImages.length !== 1}
                    className="text-center py-3 px-6 text-md font-semibold rounded-lg shadow-md transition-all duration-300 ease-in-out flex items-center justify-center
                              bg-orange-600 text-white hover:bg-orange-700
                              focus:outline-none focus:ring-4 focus:ring-orange-400
                              disabled:bg-gray-600 disabled:cursor-not-allowed"
                  >
                    {isUpscaling ? <><Spinner /><span className="ml-2">Đang nâng cấp...</span></> : '🔎 Nâng cấp 2x'}
                  </button>
                  <button
                    onClick={handleShare}
                    disabled={!!shareFeedback || generatedImages.length === 0 || isEditing}
                    className="text-center py-3 px-6 text-md font-semibold rounded-lg shadow-md transition-all duration-300 ease-in-out
                              bg-indigo-600 text-white hover:bg-indigo-700
                              focus:outline-none focus:ring-4 focus:ring-indigo-400
                              disabled:bg-gray-600 disabled:cursor-not-allowed"
                  >
                    {shareFeedback || 'Chia sẻ'}
                  </button>
                  <a 
                    href={generatedImageUrl || '#'} 
                    download="ai-headshot.png"
                    className={`col-span-2 text-center py-3 px-6 text-md font-semibold rounded-lg shadow-md transition-all duration-300 ease-in-out flex items-center justify-center
                              bg-green-600 text-white hover:bg-green-700
                              focus:outline-none focus:ring-4 focus:ring-green-400 ${!generatedImageUrl || isEditing ? 'pointer-events-none opacity-50' : ''}`}
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
    </>
  );
};

export default HeadshotGenerator;