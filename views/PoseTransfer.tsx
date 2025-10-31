import React, { useState, useCallback } from 'react';
import ImageUploader from '../components/ImageUploader';
import Spinner from '../components/Spinner';
import { transferPose } from '../services/geminiService';
import { addToHistory } from '../services/historyService';

interface PoseTransferProps {
  requireAuth: () => boolean;
}

const PoseTransfer: React.FC<PoseTransferProps> = ({ requireAuth }) => {
    const [poseFile, setPoseFile] = useState<File | null>(null);
    const [poseUrl, setPoseUrl] = useState<string | null>(null);
    const [personFile, setPersonFile] = useState<File | null>(null);
    const [personUrl, setPersonUrl] = useState<string | null>(null);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handlePoseUpload = useCallback((file: File) => {
        if (poseUrl) URL.revokeObjectURL(poseUrl);
        setPoseFile(file);
        setPoseUrl(URL.createObjectURL(file));
        setError(null);
    }, [poseUrl]);

    const handlePoseClear = useCallback(() => {
        if (poseUrl) URL.revokeObjectURL(poseUrl);
        setPoseFile(null);
        setPoseUrl(null);
        setError(null);
    }, [poseUrl]);

    const handlePersonUpload = useCallback((file: File) => {
        if (personUrl) URL.revokeObjectURL(personUrl);
        setPersonFile(file);
        setPersonUrl(URL.createObjectURL(file));
        setError(null);
    }, [personUrl]);

    const handlePersonClear = useCallback(() => {
        if (personUrl) URL.revokeObjectURL(personUrl);
        setPersonFile(null);
        setPersonUrl(null);
        setError(null);
    }, [personUrl]);

    const handleGenerateClick = async () => {
        if (!requireAuth()) return;

        if (!poseFile || !personFile) {
            setError("Vui lòng tải lên cả ảnh dáng mẫu và ảnh người.");
            return;
        }
        setIsGenerating(true);
        setError(null);
        setResultUrl(null);
        try {
            const newResultUrl = await transferPose(poseFile, personFile);
            setResultUrl(newResultUrl);
            const inputs = [];
            if(poseUrl) inputs.push({url: poseUrl, label: "Dáng mẫu"});
            if(personUrl) inputs.push({url: personUrl, label: "Người mẫu"});
            addToHistory(newResultUrl, 'pose', `Pose from ${poseFile.name}`, `Person from ${personFile.name}`, inputs);
        } catch (err: any) {
            setError(err.message || "Đã xảy ra lỗi không xác định.");
        } finally {
            setIsGenerating(false);
        }
    };

    const isGenerateDisabled = !poseFile || !personFile || isGenerating;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-8 animate-fade-in">
            {/* Left Column */}
            <div className="w-full space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl shadow-lg">
                        <h2 className="text-xl font-semibold text-gray-100 mb-3 text-center">1. Dáng Mẫu</h2>
                        <ImageUploader onImageUpload={handlePoseUpload} onImageClear={handlePoseClear} imageUrl={poseUrl} />
                    </div>
                    <div className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl shadow-lg">
                        <h2 className="text-xl font-semibold text-gray-100 mb-3 text-center">2. Người Mẫu</h2>
                        <ImageUploader onImageUpload={handlePersonUpload} onImageClear={handlePersonClear} imageUrl={personUrl} />
                    </div>
                </div>
                 <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">3. Chuyển đổi</h2>
                    <button onClick={handleGenerateClick} disabled={isGenerateDisabled} className="w-full py-4 px-6 text-lg font-bold rounded-lg shadow-lg flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 disabled:from-gray-600 disabled:cursor-not-allowed">
                        {isGenerating ? <><Spinner /> <span className="ml-2">Đang chuyển đổi...</span></> : 'Bắt đầu Chuyển đổi Dáng'}
                    </button>
                </div>
            </div>

            {/* Right Column */}
            <div className="w-full space-y-6 lg:sticky top-8">
                 {(isGenerating || resultUrl) &&
                     <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md animate-fade-in">
                         <h2 className="text-2xl font-semibold text-gray-100 mb-4">Kết quả</h2>
                         <div className="relative w-full aspect-square bg-gray-900/50 rounded-xl flex justify-center items-center overflow-hidden">
                             {isGenerating ? (
                                 <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center z-10 p-4">
                                     <Spinner />
                                     <p className="mt-4 text-lg text-gray-200 text-center">AI đang học dáng...</p>
                                 </div>
                             ) : (
                                resultUrl && <img src={resultUrl} alt="Pose transfer result" className="object-contain w-full h-full" />
                             )}
                         </div>
                         {resultUrl && !isGenerating && (
                             <a href={resultUrl} download="ai-pose.png" className="w-full mt-4 text-center block py-3 px-6 text-md font-semibold rounded-lg shadow-md bg-green-600 text-white hover:bg-green-700">
                                Tải xuống
                            </a>
                         )}
                     </div>
                 }
                {error && <div className="p-4 bg-red-900/50 border-red-500/50 rounded-lg text-red-300 text-center mt-4">{error}</div>}
            </div>
        </div>
    );
};

export default PoseTransfer;