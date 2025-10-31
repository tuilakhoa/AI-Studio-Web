import React, { useState, useEffect, useCallback } from 'react';
import { INSPIRATION_CATEGORIES } from '../constants';
import { GeneratedInspiration, InspirationCategory } from '../types';
import { generateImageFromPrompt } from '../services/geminiService';
import Spinner from '../components/Spinner';

interface InspirationViewProps {
  onPromptSelect: (prompt: string) => void;
}

const pickRandom = <T,>(arr: T[], num: number): T[] => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
};

const SKELETON_HEIGHTS = ['h-64', 'h-80', 'h-72', 'h-96', 'h-56', 'h-80', 'h-96', 'h-64'];

const InspirationView: React.FC<InspirationViewProps> = ({ onPromptSelect }) => {
  const [activeCategory, setActiveCategory] = useState<string>(INSPIRATION_CATEGORIES[0].id);
  const [images, setImages] = useState<GeneratedInspiration[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<GeneratedInspiration | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const generateImages = useCallback(async (category: InspirationCategory) => {
    setIsLoading(true);
    setError(null);
    setImages([]);

    try {
      const selectedPrompts = pickRandom(category.prompts, 8);
      
      for (const prompt of selectedPrompts) {
        const src = await generateImageFromPrompt(prompt, '3:4');
        const newImage: GeneratedInspiration = {
          id: Math.random().toString(36).substring(2, 9),
          src,
          prompt,
        };
        setImages((prevImages) => [...prevImages, newImage]);
      }

    } catch (err: any) {
      console.error("Lỗi khi tạo ảnh cảm hứng:", err);
      setError(err.message || "Không thể tạo ảnh cảm hứng. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    const initialCategory = INSPIRATION_CATEGORIES.find(c => c.id === activeCategory);
    if (initialCategory) {
      generateImages(initialCategory);
    }
  }, [activeCategory, generateImages]);

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
  };
  
  const handleRefresh = () => {
      const currentCategory = INSPIRATION_CATEGORIES.find(c => c.id === activeCategory);
      if(currentCategory) {
          generateImages(currentCategory);
      }
  }
  
  const handleCopyPrompt = () => {
    if(!selectedImage || copied) return;
    navigator.clipboard.writeText(selectedImage.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleUsePrompt = () => {
      if(!selectedImage) return;
      onPromptSelect(selectedImage.prompt);
  }

  const DetailModal = () => {
    if (!selectedImage) return null;
    return (
      <div onClick={() => setSelectedImage(null)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in">
        <div onClick={(e) => e.stopPropagation()} className="bg-gray-900 border border-purple-500/30 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
          <div className="bg-black flex items-center justify-center">
            <img src={selectedImage.src} alt={selectedImage.prompt} className="w-full h-full object-contain max-h-[50vh] lg:max-h-[90vh]" />
          </div>
          <div className="p-6 flex flex-col">
            <h3 className="text-xl font-bold text-white mb-4">Lời nhắc</h3>
            <p className="text-gray-300 flex-grow overflow-y-auto mb-4 bg-gray-800 p-3 rounded-lg">{selectedImage.prompt}</p>
            <div className="flex flex-col sm:flex-row gap-3">
               <button onClick={handleUsePrompt} className="w-full py-3 px-4 text-md font-bold rounded-lg shadow-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700">
                Sử dụng Lời nhắc này
              </button>
              <button onClick={handleCopyPrompt} className="w-full sm:w-auto px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                 {copied ? 'Đã sao chép!' : 'Sao chép'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <DetailModal />
      <div className="animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Khám phá Cảm hứng</h2>
          <p className="text-gray-400 max-w-3xl mx-auto">
            Khám phá tiềm năng của AI. Chọn một danh mục để xem các tác phẩm được tạo ra, và sử dụng lời nhắc để tự mình thử nghiệm!
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-8 sticky top-[88px] bg-gray-950/80 backdrop-blur-md py-4 z-10">
          {INSPIRATION_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`px-4 py-2 text-sm sm:text-base font-semibold rounded-lg transition-all duration-200 ${
                activeCategory === cat.id
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
              }`}
            >
              {cat.name}
            </button>
          ))}
          <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="px-4 py-2 text-sm sm:text-base font-semibold rounded-lg transition-all duration-200 bg-teal-600 text-white hover:bg-teal-500 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2"
            >
               <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l5 5M20 20l-5-5" transform="rotate(90 12 12)" /></svg>
              Làm mới
          </button>
        </div>
        
        {error && <div className="text-center p-4 bg-red-900/50 text-red-300 rounded-lg">{error}</div>}

        <div className="columns-2 sm:columns-3 md:columns-4 gap-6 space-y-6">
          {isLoading && images.length === 0 && Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className={`w-full ${SKELETON_HEIGHTS[index]} bg-gray-800 rounded-lg animate-pulse break-inside-avoid`}></div>
          ))}

          {images.map((img) => (
            <div key={img.id} onClick={() => setSelectedImage(img)} className="group relative rounded-lg overflow-hidden shadow-lg border border-white/10 break-inside-avoid cursor-pointer transform transition-transform duration-300 hover:scale-105">
              <img 
                src={img.src} 
                alt={img.prompt} 
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          ))}
          
           {isLoading && images.length > 0 && Array.from({ length: 8 - images.length }).map((_, index) => (
            <div key={`placeholder-${index}`} className={`w-full ${SKELETON_HEIGHTS[index]} bg-gray-800 rounded-lg animate-pulse break-inside-avoid`}></div>
          ))}
        </div>
      </div>
    </>
  );
};

export default InspirationView;