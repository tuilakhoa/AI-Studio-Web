import React, { useState, useCallback, useEffect } from 'react';
import Spinner from '../components/Spinner';
import { trainStyle } from '../services/geminiService';
import { addToHistory } from '../services/historyService';

interface TrainYourModelProps {
  requireAuth: () => boolean;
}

const TrainYourModel: React.FC<TrainYourModelProps> = ({ requireAuth }) => {
    const [step, setStep] = useState(1);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [instancePrompt, setInstancePrompt] = useState('<phong-cach-cua-toi>');
    const [trainingProgress, setTrainingProgress] = useState(0);
    const [isTraining, setIsTraining] = useState(false);
    const [finalPrompt, setFinalPrompt] = useState('');
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        return () => {
            imageUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [imageUrls]);

    const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        
        setError(null);
        setImageFiles(prev => [...prev, ...files]);
        // FIX: The type of `file` is inferred as `unknown`, so we cast it to `Blob` which `URL.createObjectURL` expects.
        const urls = files.map(file => URL.createObjectURL(file as Blob));
        setImageUrls(prev => [...prev, ...urls]);
    };
    
    const removeImage = (index: number) => {
        URL.revokeObjectURL(imageUrls[index]);
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImageUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleStartTraining = () => {
        if (!requireAuth()) return;
        if (imageFiles.length < 3) {
            setError("Vui lòng tải lên ít nhất 3 ảnh.");
            return;
        }
        if (!instancePrompt.trim()) {
            setError("Vui lòng đặt tên cho mô hình/phong cách của bạn.");
            return;
        }

        setIsTraining(true);
        setError(null);
        setStep(2);

        // Simulate training time
        const interval = setInterval(() => {
            setTrainingProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsTraining(false);
                    setStep(3);
                    return 100;
                }
                return prev + 1;
            });
        }, 50);
    };

    const handleGenerate = async () => {
        if (!finalPrompt.trim()) {
            setError("Vui lòng nhập mô tả cho ảnh cuối cùng.");
            return;
        }
        setIsGenerating(true);
        setError(null);
        setResultUrl(null);

        try {
            const promptWithInstance = finalPrompt.replace(/<.*?>/g, instancePrompt);
            const newResultUrl = await trainStyle(imageFiles, promptWithInstance);
            setResultUrl(newResultUrl);
            const inputImages = imageUrls.map((url, i) => ({ url, label: `Ảnh ${i + 1}`}));
            addToHistory(newResultUrl, 'freestyle', `Trained Model (${instancePrompt}): ${finalPrompt}`, 'Train Your Model', inputImages);
        } catch (err: any) {
            setError(err.message || "Đã xảy ra lỗi không xác định.");
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleReset = () => {
        setImageFiles([]);
        setImageUrls([]);
        setStep(1);
        setError(null);
        setResultUrl(null);
        setFinalPrompt('');
        setTrainingProgress(0);
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in">
             <div className="text-center">
                <h1 className="text-3xl font-bold text-white">Huấn luyện Mô hình của riêng bạn</h1>
                <p className="text-gray-400 mt-2">Dạy AI phong cách nghệ thuật, nhân vật hoặc đối tượng của bạn, sau đó sử dụng nó trong các tác phẩm mới.</p>
            </div>

            {/* Step 1: Upload Images */}
            {step === 1 && (
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                    <h2 className="text-xl font-bold text-white mb-4">Bước 1: Tải lên 3-10 ảnh tham chiếu</h2>
                    <div className="p-4 border-2 border-dashed border-gray-600 rounded-lg">
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                            {imageUrls.map((url, index) => (
                                <div key={index} className="relative group aspect-square">
                                    <img src={url} alt={`upload preview ${index}`} className="w-full h-full object-cover rounded-md"/>
                                    <button onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-red-600/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                            ))}
                             <label className="aspect-square flex items-center justify-center border-2 border-dashed border-gray-700 rounded-md cursor-pointer hover:bg-gray-800 hover:border-purple-500 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                <input type="file" multiple accept="image/*" className="hidden" onChange={handleFilesChange} />
                            </label>
                        </div>
                    </div>
                     <div className="mt-4">
                         <label htmlFor="instance-prompt" className="block text-lg font-semibold text-white mb-2">Đặt tên cho Mô hình / Phong cách của bạn</label>
                         <input type="text" id="instance-prompt" value={instancePrompt} onChange={(e) => setInstancePrompt(e.target.value)} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200" />
                         <p className="text-xs text-gray-400 mt-1">Đây là từ khóa bạn sẽ sử dụng trong lời nhắc để tham chiếu đến phong cách này.</p>
                     </div>
                    {error && <p className="text-red-400 text-sm mt-3 text-center">{error}</p>}
                    <button onClick={handleStartTraining} disabled={imageFiles.length < 3 || !instancePrompt.trim()} className="w-full mt-6 py-3 text-lg font-bold rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-600">
                        Bắt đầu Huấn luyện
                    </button>
                </div>
            )}

            {/* Step 2: Training */}
            {step === 2 && (
                 <div className="p-10 bg-white/5 border border-white/10 rounded-2xl text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Đang huấn luyện mô hình của bạn...</h2>
                    <div className="w-full bg-gray-700 rounded-full h-4">
                        <div className="bg-purple-600 h-4 rounded-full transition-all duration-500" style={{width: `${trainingProgress}%`}}></div>
                    </div>
                    <p className="mt-4 text-gray-300">{Math.round(trainingProgress)}%</p>
                </div>
            )}

            {/* Step 3: Generate */}
            {step === 3 && (
                <>
                <div className="p-6 bg-green-900/20 border border-green-500/30 rounded-2xl text-center">
                    <h2 className="text-xl font-bold text-green-300">Huấn luyện Hoàn tất!</h2>
                    <p className="text-gray-300">Bây giờ bạn có thể sử dụng từ khóa <code className="bg-gray-800 text-purple-400 px-2 py-1 rounded">{instancePrompt}</code> trong lời nhắc của mình.</p>
                </div>
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                     <h2 className="text-xl font-bold text-white mb-4">Bước 2: Tạo ảnh bằng mô hình của bạn</h2>
                    <textarea 
                        value={finalPrompt}
                        onChange={(e) => setFinalPrompt(e.target.value)}
                        placeholder={`Ví dụ: một bức ảnh của ${instancePrompt} đang đội mũ cao bồi`}
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-200"
                        rows={4}
                    />
                    {error && <p className="text-red-400 text-sm mt-3 text-center">{error}</p>}
                    <div className="flex gap-4 mt-6">
                         <button onClick={handleReset} className="w-full py-3 text-lg font-bold rounded-lg bg-gray-600 text-white hover:bg-gray-500">
                            Bắt đầu lại
                        </button>
                        <button onClick={handleGenerate} disabled={isGenerating || !finalPrompt.trim()} className="w-full py-3 text-lg font-bold rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-600">
                            {isGenerating ? <Spinner /> : 'Tạo'}
                        </button>
                    </div>
                </div>

                {(isGenerating || resultUrl) && (
                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                        <h2 className="text-xl font-bold text-white mb-4">Kết quả</h2>
                        <div className="aspect-square bg-gray-900/50 rounded-lg flex items-center justify-center border-2 border-gray-700 overflow-hidden">
                           {isGenerating && <Spinner />}
                           {resultUrl && <img src={resultUrl} alt="generated result" className="w-full h-full object-contain" />}
                        </div>
                         {resultUrl && !isGenerating && (
                            <a href={resultUrl} download="ai-trained-model-result.png" className="w-full mt-4 text-center block py-3 px-6 text-md font-semibold rounded-lg shadow-md bg-green-600 text-white hover:bg-green-700">
                                Tải xuống
                            </a>
                        )}
                    </div>
                )}
                </>
            )}
        </div>
    );
};

export default TrainYourModel;
