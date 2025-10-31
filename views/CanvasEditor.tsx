import React, { useState, useCallback } from 'react';
import ImageUploader from '../components/ImageUploader';
import ImageEditor from '../components/ImageEditor';
import { addToHistory } from '../services/historyService';

interface CanvasEditorProps {
  requireAuth: () => boolean;
}

const CanvasEditor: React.FC<CanvasEditorProps> = ({ requireAuth }) => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const handleImageUpload = useCallback((file: File) => {
        if (imageUrl) {
            URL.revokeObjectURL(imageUrl);
        }
        if (!requireAuth()) return;
        setImageFile(file);
        setImageUrl(URL.createObjectURL(file));
    }, [imageUrl, requireAuth]);

    const handleImageClear = useCallback(() => {
        if (imageUrl) {
            URL.revokeObjectURL(imageUrl);
        }
        setImageFile(null);
        setImageUrl(null);
    }, [imageUrl]);
    
    const handleEditComplete = (newImageUrl: string, description: string) => {
        if (imageUrl) {
             addToHistory(newImageUrl, 'freestyle', description, "Canvas Edit", [{ url: imageUrl, label: "Ảnh trước khi sửa" }]);
             // Update the current image URL for further edits without needing a re-upload
             setImageUrl(newImageUrl);
        }
    };


    return (
        <div className="w-full max-w-5xl mx-auto animate-fade-in">
            {!imageUrl ? (
                <div className="max-w-md mx-auto">
                    <ImageUploader 
                        onImageUpload={handleImageUpload} 
                        onImageClear={handleImageClear}
                        imageUrl={imageUrl} 
                    />
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <button onClick={handleImageClear} className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-800 text-white hover:bg-red-700">
                           Tải lên ảnh khác
                        </button>
                    </div>
                     <ImageEditor 
                        imageUrl={imageUrl}
                        onEditComplete={handleEditComplete}
                        onStartEditing={() => setIsEditing(true)}
                        onEndEditing={() => setIsEditing(false)}
                    />
                </div>
            )}
        </div>
    );
};

export default CanvasEditor;
