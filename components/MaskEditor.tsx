import React, { useRef, useEffect, useState, useCallback } from 'react';

interface MaskEditorProps {
  imageUrl: string;
  onSave: (maskDataUrl: string) => void;
  onClose: () => void;
}

const MaskEditor: React.FC<MaskEditorProps> = ({ imageUrl, onSave, onClose }) => {
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const [brushSize, setBrushSize] = useState(40);
  const [isErasing, setIsErasing] = useState(false);

  // FIX: Widen event type to be compatible with both native event listeners and React event handlers.
  const draw = useCallback((e: MouseEvent | TouchEvent | React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawingCanvasRef.current) return;
    const canvas = drawingCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const pos = 'touches' in e ? e.touches[0] : e;
    if (!pos) return;
    const x = (pos.clientX - rect.left) / rect.width * canvas.width;
    const y = (pos.clientY - rect.top) / rect.height * canvas.height;

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (isErasing) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    }

    if (lastPos.current) {
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();
    }
    
    lastPos.current = { x, y };
  }, [isDrawing, brushSize, isErasing]);

  // FIX: Update event type to be compatible with React event handlers.
  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = drawingCanvasRef.current;
    if(!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const pos = 'touches' in e ? e.touches[0] : e;
    if (!pos) return;
    lastPos.current = { 
        x: (pos.clientX - rect.left) / rect.width * canvas.width, 
        y: (pos.clientY - rect.top) / rect.height * canvas.height 
    };
    setIsDrawing(true);
    draw(e);
  }, [draw]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    lastPos.current = null;
  }, []);

  useEffect(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    
    const handleMove = (e: MouseEvent | TouchEvent) => draw(e);
    
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('touchmove', handleMove);
    
    return () => {
        canvas.removeEventListener('mousemove', handleMove);
        canvas.removeEventListener('touchmove', handleMove);
    };
  }, [draw]);


  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      const imageCanvas = imageCanvasRef.current;
      const drawingCanvas = drawingCanvasRef.current;
      if (imageCanvas && drawingCanvas) {
        const ctx = imageCanvas.getContext('2d');
        if (ctx) {
          imageCanvas.width = img.naturalWidth;
          imageCanvas.height = img.naturalHeight;
          drawingCanvas.width = img.naturalWidth;
          drawingCanvas.height = img.naturalHeight;
          ctx.drawImage(img, 0, 0);
        }
      }
    };
  }, [imageUrl]);

  const handleClear = () => {
    const canvas = drawingCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleSave = () => {
    const drawingCanvas = drawingCanvasRef.current;
    if (drawingCanvas) {
      // Create a final mask canvas: white on black
      const finalMaskCanvas = document.createElement('canvas');
      finalMaskCanvas.width = drawingCanvas.width;
      finalMaskCanvas.height = drawingCanvas.height;
      const finalCtx = finalMaskCanvas.getContext('2d');
      if(finalCtx) {
        finalCtx.fillStyle = 'black';
        finalCtx.fillRect(0, 0, finalMaskCanvas.width, finalMaskCanvas.height);
        finalCtx.globalCompositeOperation = 'source-over';
        finalCtx.drawImage(drawingCanvas, 0, 0);
         // Change semi-transparent white to opaque white
        const imageData = finalCtx.getImageData(0, 0, finalMaskCanvas.width, finalMaskCanvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] > 0) { // If pixel is not transparent
            data[i] = 255;     // R
            data[i + 1] = 255; // G
            data[i + 2] = 255; // B
            data[i + 3] = 255; // A
          }
        }
        finalCtx.putImageData(imageData, 0, 0);
      }
      onSave(finalMaskCanvas.toDataURL('image/png'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col p-2 sm:p-4" onClick={onClose}>
      <div className="relative w-full max-w-4xl mx-auto my-auto flex-grow flex flex-col" onClick={e => e.stopPropagation()}>
         <div className="relative w-full flex-grow flex items-center justify-center overflow-hidden">
            <canvas ref={imageCanvasRef} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-full max-h-full" />
            <canvas 
              ref={drawingCanvasRef}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-full max-h-full cursor-crosshair" 
              onMouseDown={startDrawing}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchEnd={stopDrawing}
            />
         </div>
      </div>
       <div className="w-full max-w-4xl mx-auto bg-gray-900/80 backdrop-blur-sm p-4 rounded-xl mt-2 flex flex-col sm:flex-row items-center justify-center gap-4" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-2">
              <label htmlFor="brushSize" className="text-white font-semibold text-sm">Cỡ cọ:</label>
              <input 
                  id="brushSize"
                  type="range" 
                  min="5" 
                  max="150" 
                  value={brushSize} 
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-32"
              />
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsErasing(false)} className={`px-4 py-2 text-sm font-semibold rounded-md ${!isErasing ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}>Vẽ</button>
            <button onClick={() => setIsErasing(true)} className={`px-4 py-2 text-sm font-semibold rounded-md ${isErasing ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}>Tẩy</button>
            <button onClick={handleClear} className="px-4 py-2 text-sm font-semibold rounded-md bg-yellow-600 hover:bg-yellow-700 text-white">Xóa hết</button>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-md bg-gray-600 hover:bg-gray-500 text-white">Hủy</button>
            <button onClick={handleSave} className="px-6 py-2 text-sm font-bold rounded-md bg-green-600 hover:bg-green-700 text-white">Lưu</button>
          </div>
       </div>
    </div>
  );
};

export default MaskEditor;