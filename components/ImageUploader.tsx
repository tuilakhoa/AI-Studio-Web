import React, { useRef, useState, useCallback } from 'react';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  onImageClear: () => void;
  imageUrl: string | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onImageUpload, 
  onImageClear,
  imageUrl,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (files: FileList | null) => {
    if (files && files[0]) {
      onImageUpload(files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files);
    }
  }, [onImageUpload]);

  const clearImage = () => {
    onImageClear();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md">
      <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">1. Tải lên ảnh của bạn</h2>
      <div 
        className={`relative w-full aspect-square border-2 border-dashed rounded-xl flex flex-col justify-center items-center transition-all duration-300 ease-in-out group ${dragActive ? 'border-purple-400 bg-purple-900/20 scale-105' : 'border-gray-600 hover:border-gray-400'}`}
        onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
      >
        {imageUrl ? (
          <>
            <img src={imageUrl} alt="Uploaded Selfie" className="object-cover w-full h-full rounded-xl" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center items-center rounded-xl">
               <button
                onClick={clearImage}
                className="bg-red-600 hover:bg-red-700 text-white rounded-full p-3 transition-transform duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                aria-label="Xóa ảnh"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </>
        ) : (
          <div className="text-center p-4 cursor-pointer" onClick={onButtonClick}>
             <svg className="mx-auto h-16 w-16 text-gray-500 group-hover:text-purple-400 transition-colors duration-300" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="mt-4 text-gray-300"><span className="font-semibold text-purple-400">Nhấn để tải lên</span> hoặc kéo thả</p>
            <p className="text-sm text-gray-500 mt-1">PNG, JPG, WEBP (tối đa 10MB)</p>
            <input ref={fileInputRef} type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={(e) => handleFileChange(e.target.files)} />
          </div>
        )}
      </div>
    </div>
  );
};
export default ImageUploader;