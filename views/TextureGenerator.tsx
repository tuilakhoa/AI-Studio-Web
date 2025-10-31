import React, { useState } from 'react';
import Spinner from '../components/Spinner';
import { generateTextureMaps } from '../services/geminiService';
import { addToHistory } from '../services/historyService';

interface TextureGeneratorProps {
  requireAuth: () => boolean;
}

const MAP_TYPES = [
    { id: 'albedo', name: 'Albedo' },
    { id: 'normal', name: 'Normal' },
    { id: 'roughness', name: 'Roughness' },
    { id: 'ambient occlusion', name: 'Ambient Occlusion' }
];

const TextureGenerator: React.FC<TextureGeneratorProps> = ({ requireAuth }) => {
    const [prompt, setPrompt] = useState('gạch lát vỉa hè cũ kỹ');
    const [results, setResults] = useState<{ [key: string]: string } | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!requireAuth()) return;
        if (!prompt.trim()) {
            setError("Vui lòng nhập mô tả cho texture.");
            return;
        }
        setIsGenerating(true);
        setError(null);
        setResults(null);
        try {
            const generatedMaps = await generateTextureMaps(prompt);
            setResults(generatedMaps);
            // For history, we can save the albedo map as the primary image
            if (generatedMaps.albedo) {
                addToHistory(generatedMaps.albedo, 'freestyle', `PBR Texture: ${prompt}`, '3D Texture Generation');
            }
        } catch (err: any) {
            setError(err.message || "Đã xảy ra lỗi không xác định.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-semibold text-white mb-4 text-center">1. Mô tả Chất liệu</h2>
                <p className="text-center text-gray-400 mb-4">Mô tả chất liệu bạn muốn tạo, ví dụ: "vỏ cây sồi cổ thụ", "bề mặt kim loại xước", hoặc "vải denim xanh".</p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <input 
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Ví dụ: gạch lát vỉa hè cũ kỹ"
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-purple-500"
                        disabled={isGenerating}
                    />
                    <button 
                        onClick={handleGenerate} 
                        disabled={isGenerating || !prompt.trim()}
                        className="py-3 px-6 text-lg font-bold rounded-lg shadow-lg flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 disabled:from-gray-600"
                    >
                        {isGenerating ? <Spinner/> : 'Tạo Textures'}
                    </button>
                </div>
                {error && <p className="text-red-400 text-sm mt-3 text-center">{error}</p>}
            </div>

            {(isGenerating || results) && (
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-semibold text-white mb-4 text-center">Kết quả PBR Texture Maps</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {MAP_TYPES.map(mapType => (
                            <div key={mapType.id}>
                                <h3 className="text-lg font-semibold text-gray-300 mb-2 text-center capitalize">{mapType.name}</h3>
                                <div className="aspect-square bg-gray-900/50 rounded-lg flex items-center justify-center border-2 border-gray-700 overflow-hidden">
                                    {isGenerating && !results?.[mapType.id] && <Spinner />}
                                    {results?.[mapType.id] && (
                                        <div className="relative group w-full h-full">
                                            <img src={results[mapType.id]} alt={`${mapType.name} map`} className="w-full h-full object-cover"/>
                                            <a href={results[mapType.id]} download={`${prompt.replace(/ /g, '_')}_${mapType.id}.jpg`} className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TextureGenerator;
