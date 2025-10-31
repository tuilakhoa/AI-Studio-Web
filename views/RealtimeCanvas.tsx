import React, { useState, useRef, useEffect, useCallback } from 'react';
import Spinner from '../components/Spinner';
import { generateFromSketch } from '../services/geminiService';
import { addToHistory } from '../services/historyService';

interface RealtimeCanvasProps {
  requireAuth: () => boolean;
}

type Tool = 'brush' | 'eraser';

const RealtimeCanvas: React.FC<RealtimeCanvasProps> = ({ requireAuth }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const lastPos = useRef<{ x: number; y: number } | null>(null);
    const debouncedGenerateRef = useRef<number | null>(null);

    const [prompt, setPrompt] = useState('a majestic castle on a floating island, fantasy art');
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // New Toolbar State
    const [activeTool, setActiveTool] = useState<Tool>('brush');
    const [brushSize, setBrushSize] = useState(5);
    const [brushColor, setBrushColor] = useState('#FFFFFF');
    
    // New Features State
    const [isRealtime, setIsRealtime] = useState(false);
    const [guidanceStrength, setGuidanceStrength] = useState(75);
    const [historyStack, setHistoryStack] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);


    const getCanvasContext = () => canvasRef.current?.getContext('2d');

    // Initialize canvas and history
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const emptyCanvas = canvas.toDataURL();
            setHistoryStack([emptyCanvas]);
            setHistoryIndex(0);
        }
    }, []);

    // Redraw canvas when history changes (undo/redo)
    useEffect(() => {
        if (historyIndex < 0 || historyIndex >= historyStack.length) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        const dataUrl = historyStack[historyIndex];

        if (!canvas || !ctx || !dataUrl) return;

        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
        img.src = dataUrl;
    }, [historyIndex, historyStack]);

    const saveStateForHistory = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const newHistory = historyStack.slice(0, historyIndex + 1);
        newHistory.push(canvas.toDataURL());

        setHistoryStack(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(prev => prev - 1);
        }
    };
    const handleRedo = () => {
        if (historyIndex < historyStack.length - 1) {
            setHistoryIndex(prev => prev + 1);
        }
    };

    const draw = useCallback((e: MouseEvent | TouchEvent) => {
        if (!isDrawing) return;
        const ctx = getCanvasContext();
        const canvas = canvasRef.current;
        if (!ctx || !canvas) return;

        const rect = canvas.getBoundingClientRect();
        const pos = 'touches' in e ? e.touches[0] : e;
        if (!pos) return;
        
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (pos.clientX - rect.left) * scaleX;
        const y = (pos.clientY - rect.top) * scaleY;

        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (activeTool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = brushColor;
        }

        if (lastPos.current) {
            ctx.beginPath();
            ctx.moveTo(lastPos.current.x, lastPos.current.y);
            ctx.lineTo(x, y);
            ctx.stroke();
        }
        lastPos.current = { x, y };
    }, [isDrawing, brushSize, brushColor, activeTool]);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const nativeEvent = e.nativeEvent;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const pos = 'touches' in nativeEvent ? nativeEvent.touches[0] : nativeEvent;
        if(!pos) return;
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        lastPos.current = { x: (pos.clientX - rect.left) * scaleX, y: (pos.clientY - rect.top) * scaleY };
        setIsDrawing(true);
        draw(nativeEvent);
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        lastPos.current = null;
        saveStateForHistory();

        if (isRealtime) {
            if (debouncedGenerateRef.current) clearTimeout(debouncedGenerateRef.current);
            debouncedGenerateRef.current = window.setTimeout(() => handleGenerate(), 1500);
        }
    };
    
    useEffect(() => {
        const handleMove = (e: MouseEvent | TouchEvent) => draw(e);
        const currentCanvas = canvasRef.current;
        
        currentCanvas?.addEventListener('mousemove', handleMove);
        currentCanvas?.addEventListener('touchmove', handleMove);
        currentCanvas?.addEventListener('mouseup', stopDrawing);
        currentCanvas?.addEventListener('touchend', stopDrawing);
        currentCanvas?.addEventListener('mouseleave', stopDrawing);

        return () => {
            currentCanvas?.removeEventListener('mousemove', handleMove);
            currentCanvas?.removeEventListener('touchmove', handleMove);
            currentCanvas?.removeEventListener('mouseup', stopDrawing);
            currentCanvas?.removeEventListener('touchend', stopDrawing);
            currentCanvas?.removeEventListener('mouseleave', stopDrawing);
        };
    }, [draw]);


    const handleClearCanvas = () => {
        const ctx = getCanvasContext();
        if (ctx && canvasRef.current) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            saveStateForHistory();
        }
    };

    const handleGenerate = async () => {
        if (debouncedGenerateRef.current) clearTimeout(debouncedGenerateRef.current);
        if (!requireAuth() || !canvasRef.current) return;
        if (!prompt.trim()) {
            setError("Vui lòng nhập mô tả.");
            return;
        }

        setIsGenerating(true);
        setError(null);
        try {
            const sketchDataUrl = canvasRef.current.toDataURL('image/png');
            const newResultUrl = await generateFromSketch(sketchDataUrl, prompt, guidanceStrength);
            setResultUrl(newResultUrl);
            addToHistory(newResultUrl, 'freestyle', `Sketch + "${prompt}"`, "Realtime Canvas", [{ url: sketchDataUrl, label: 'Phác thảo' }]);
        } catch (err: any) {
            setError(err.message || "Đã có lỗi xảy ra.");
        } finally {
            setIsGenerating(false);
        }
    };
    
    const ToolButton: React.FC<{tool: Tool, label: string, children: React.ReactNode}> = ({ tool, label, children }) => (
        <button 
            onClick={() => setActiveTool(tool)}
            className={`p-2 rounded-md transition-colors ${activeTool === tool ? 'bg-purple-600 text-white' : 'hover:bg-gray-600'}`}
            title={label}
        >
            {children}
        </button>
    );

    return (
        <div className="w-full space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Drawing Panel */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-white text-center">1. Phác thảo ý tưởng</h2>
                    <div className="relative">
                        <canvas 
                            ref={canvasRef} 
                            width="512" 
                            height="512" 
                            className="w-full aspect-square bg-gray-900 rounded-lg shadow-inner cursor-crosshair border-2 border-gray-700"
                            onMouseDown={startDrawing}
                            onTouchStart={startDrawing}
                        />
                         <div className="absolute bottom-0 left-0 right-0 p-2">
                            <div className="max-w-md mx-auto bg-gray-900/80 backdrop-blur-sm p-2 rounded-xl shadow-lg flex items-center justify-between gap-2 text-white">
                                <div className="flex gap-1 p-1 bg-gray-800 rounded-lg">
                                    <ToolButton tool="brush" label="Cọ vẽ"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></ToolButton>
                                    <ToolButton tool="eraser" label="Tẩy"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></ToolButton>
                                </div>
                                <div className="flex items-center gap-2 flex-grow">
                                     <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} className="w-8 h-8 bg-transparent cursor-pointer" title="Màu cọ"/>
                                    <div className="w-8 h-8 flex items-center justify-center" title={`Cỡ cọ: ${brushSize}`}><div className="bg-white rounded-full" style={{width: `${(brushSize/50)*20+2}px`, height: `${(brushSize/50)*20+2}px`}}></div></div>
                                    <input type="range" min="1" max="50" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full"/>
                                </div>
                                <div className="flex items-center gap-1 p-1 bg-gray-800 rounded-lg">
                                    <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 rounded-md hover:bg-gray-600 disabled:text-gray-500 disabled:hover:bg-transparent" title="Hoàn tác"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg></button>
                                    <button onClick={handleRedo} disabled={historyIndex >= historyStack.length - 1} className="p-2 rounded-md hover:bg-gray-600 disabled:text-gray-500 disabled:hover:bg-transparent" title="Làm lại"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" /></svg></button>
                                    <button onClick={handleClearCanvas} className="p-2 rounded-md hover:bg-gray-600" title="Xóa hết"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Result Panel */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-white text-center">Kết quả</h2>
                     <div className="w-full aspect-square bg-gray-900 rounded-lg shadow-inner flex items-center justify-center border-2 border-gray-700 overflow-hidden">
                        {isGenerating && <Spinner />}
                        {!isGenerating && resultUrl && <img src={resultUrl} alt="Generated from sketch" className="w-full h-full object-contain" />}
                        {!isGenerating && !resultUrl && <p className="text-gray-500">Kết quả sẽ hiện ở đây</p>}
                    </div>
                    {resultUrl && !isGenerating && (
                        <a href={resultUrl} download="ai-sketch-result.png" className="w-full text-center block py-3 px-6 text-md font-semibold rounded-lg shadow-md bg-green-600 text-white hover:bg-green-700">Tải xuống</a>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                <h2 className="text-2xl font-semibold text-white mb-4 text-center">2. Mô tả & Tạo</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                        <div>
                            <h4 className="font-semibold text-gray-200">Chế độ Thời gian thực</h4>
                            <p className="text-sm text-gray-400">Tự động tạo khi bạn vẽ.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={isRealtime} onChange={(e) => setIsRealtime(e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                    </div>
                     <div className="p-3 bg-gray-800/50 rounded-lg">
                        <label htmlFor="guidance-strength" className="block font-semibold text-gray-200 text-center mb-1">Mức độ Bám sát Phác thảo: <span className="text-purple-400 font-bold">{guidanceStrength}</span></label>
                        <p className="text-xs text-gray-500 text-center mb-2">Thấp hơn = Sáng tạo hơn. Cao hơn = Chính xác hơn.</p>
                        <input type="range" id="guidance-strength" min="0" max="100" value={guidanceStrength} onChange={(e) => setGuidanceStrength(Number(e.target.value))} className="w-full"/>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                    <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Mô tả nội dung bạn muốn AI vẽ..."
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-purple-500"
                        rows={3}
                    />
                    <button 
                        onClick={handleGenerate} 
                        disabled={isGenerating || isRealtime} 
                        className="py-3 px-6 text-lg font-bold rounded-lg shadow-lg flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 disabled:from-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? <Spinner /> : 'Tạo'}
                    </button>
                </div>
                 {error && <p className="text-red-400 text-sm mt-3 text-center">{error}</p>}
            </div>
        </div>
    );
};

export default RealtimeCanvas;
