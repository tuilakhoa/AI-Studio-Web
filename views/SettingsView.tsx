import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import Spinner from '../components/Spinner';
import { clearHistory, exportHistory } from '../services/historyService';
import { View } from '../types';

interface SavedTheme {
  id: string;
  name: string;
  css: string;
}

interface SettingsViewProps {
  setCurrentView: (view: View) => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode, icon: React.ReactElement }> = ({ title, children, icon }) => (
    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
            <div className="text-purple-400">{icon}</div>
            <h3 className="text-xl font-semibold text-white">{title}</h3>
        </div>
        <div className="space-y-6">
            {children}
        </div>
    </div>
);

const SettingToggle: React.FC<{
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}> = ({ label, description, checked, onChange }) => (
    <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-lg">
        <div>
            <h4 className="font-semibold text-gray-200">{label}</h4>
            <p className="text-sm text-gray-400">{description}</p>
        </div>
        <label htmlFor={`${label}-toggle`} className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" id={`${label}-toggle`} className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)}/>
            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
        </label>
    </div>
);


const SettingsView: React.FC<SettingsViewProps> = ({ setCurrentView }) => {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [savedThemes, setSavedThemes] = useState<SavedTheme[]>([]);
  const [activeThemeId, setActiveThemeId] = useState<string | null>(null);

  // Load all settings from localStorage on initial mount
  useEffect(() => {
    setReduceMotion(localStorage.getItem('ai-studio-reduce-motion') === 'true');
    setCompactMode(localStorage.getItem('ai-studio-compact-mode') === 'true');
    setAutoSave(localStorage.getItem('ai-studio-autosave') !== 'false'); // Mặc định là true
    setSavedThemes(JSON.parse(localStorage.getItem('ai-studio-saved-themes') || '[]'));
    setActiveThemeId(localStorage.getItem('ai-studio-active-theme-id'));
  }, []);

  // Effect for reduce motion
  useEffect(() => {
    localStorage.setItem('ai-studio-reduce-motion', String(reduceMotion));
    document.documentElement.classList.toggle('reduce-motion', reduceMotion);
  }, [reduceMotion]);
  
  // Effect for compact mode
  useEffect(() => {
    localStorage.setItem('ai-studio-compact-mode', String(compactMode));
    document.documentElement.classList.toggle('compact-mode', compactMode);
  }, [compactMode]);

  // Effect for auto save
  useEffect(() => {
    localStorage.setItem('ai-studio-autosave', String(autoSave));
  }, [autoSave]);

  // Effect for applying custom AI theme CSS
  useEffect(() => {
    const styleId = 'ai-theme-styles';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    const activeTheme = savedThemes.find(t => t.id === activeThemeId);
    styleEl.innerHTML = activeTheme ? activeTheme.css : '';
    
    if (activeThemeId) {
        localStorage.setItem('ai-studio-active-theme-id', activeThemeId);
    } else {
        localStorage.removeItem('ai-studio-active-theme-id');
    }

  }, [activeThemeId, savedThemes]);

  const handleGenerateTheme = async () => {
    // FIX: Use process.env.API_KEY as per the guidelines and remove the explicit check.
    if (!aiPrompt.trim()) {
      setError("Vui lòng nhập mô tả cho giao diện.");
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: aiPrompt,
        config: {
          systemInstruction: `You are a master web designer and CSS artist with a deep knowledge of pop culture, art, and design trends. Your task is to translate a user's theme description into a beautiful, functional, and thematic CSS stylesheet for a web application called 'AI Studio'.

**CRITICAL RULES:**
1.  **CSS ONLY:** You MUST ONLY output raw CSS code. Do not include markdown fences like \`\`\`css, explanations, or any other text.
2.  **Analyze and Be Creative:** Analyze the user's prompt (e.g., 'Dragon Ball', 'hacker matrix', 'Conan detective'). Generate a comprehensive CSS block.
    *   For 'Dragon Ball', use orange, blue, and yellow for backgrounds, buttons, and text. Use a bold, energetic font.
    *   For 'Conan detective', use dark blues, mystery tones, and a classic, sharp font.
    *   For 'hacker matrix', use a black background, glowing green text, and a monospaced font.
3.  **Target Selectors:** Target key selectors. The most important ones are: \`body\`, \`#root\`, \`aside\`, \`header\`, \`button\`, \`h1\`, \`h2\`, \`h3\`, \`.border-white\\/10\`, \`.bg-white\\/5\`, \`.bg-gray-800\`, \`.bg-gray-700\`, \`.text-gray-400\`, \`input\`, \`textarea\`.
4.  **CHANGE ICON COLORS:** You MUST change the color of icons by targeting SVGs. Example: \`aside button svg { color: #newcolor; }\`. This is critical.
5.  **Use Gradients and Shadows:** Use creative gradients (\`linear-gradient\`), box-shadows, and transitions to make the theme feel alive.
6.  **Maintain Readability:** Ensure text is always readable against the backgrounds you choose.
7.  **Override Existing Styles:** Your CSS will be injected to override existing styles, so be specific where needed. Use important variables like \`--color-bg-primary\`, \`--color-text-primary\`, \`--color-accent-primary\` in your response for robust theming.`,
        },
      });
      
      const newTheme: SavedTheme = {
          id: `ai-${Date.now()}`,
          name: aiPrompt.substring(0, 30) + '...',
          css: response.text,
      };

      setSavedThemes(prev => [newTheme, ...prev]);
      setActiveThemeId(newTheme.id);

    } catch (err: any) {
      setError(err.message || "Không thể tạo giao diện.");
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleSaveThemes = (newThemes: SavedTheme[]) => {
      setSavedThemes(newThemes);
      localStorage.setItem('ai-studio-saved-themes', JSON.stringify(newThemes));
  };
  
  const handleRenameTheme = (id: string) => {
      const theme = savedThemes.find(t => t.id === id);
      const newName = prompt("Đổi tên giao diện:", theme?.name);
      if (newName && newName.trim()) {
          const newThemes = savedThemes.map(t => t.id === id ? { ...t, name: newName.trim() } : t);
          handleSaveThemes(newThemes);
      }
  };

  const handleDeleteTheme = (id: string) => {
      if (window.confirm("Bạn có chắc chắn muốn xóa giao diện này không?")) {
          if (activeThemeId === id) {
              setActiveThemeId(null);
          }
          const newThemes = savedThemes.filter(t => t.id !== id);
          handleSaveThemes(newThemes);
      }
  };

  const handleClearThemes = () => {
    if (window.confirm("Bạn có chắc muốn xóa tất cả các giao diện đã lưu không?")) {
        setActiveThemeId(null);
        handleSaveThemes([]);
        localStorage.removeItem('ai-studio-active-theme-id');
    }
  };

  const handleClearAllData = () => {
    if (window.confirm("CẢNH BÁO: Hành động này sẽ xóa TOÀN BỘ dữ liệu ứng dụng (lịch sử, giao diện đã lưu, v.v.) khỏi trình duyệt của bạn và tải lại trang. Bạn có chắc chắn muốn tiếp tục không?")) {
        localStorage.clear();
        window.location.reload();
    }
  };


  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-8">

      {/* Appearance Section */}
      <Section title="Giao diện" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12.5a2 2 0 002-2v-6.5a2 2 0 00-2-2H7" /></svg>}>
          <SettingToggle
              label="Giao diện thu gọn"
              description="Hiển thị nhiều thông tin hơn bằng cách giảm khoảng cách."
              checked={compactMode}
              onChange={setCompactMode}
          />
          {/* AI Custom Interface */}
          <div className="p-4 bg-gray-800/50 rounded-lg border border-purple-500/30">
            <h4 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-2">
              Tạo Giao diện bằng AI ✨
            </h4>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ví dụ: chủ đề hacker ma trận với chữ xanh lá, hoặc chủ đề conan..."
              className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-200"
              rows={2} disabled={isGenerating}
            />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            <div className="flex gap-4 mt-3">
              <button onClick={handleGenerateTheme} disabled={isGenerating || !aiPrompt.trim()} className="w-full flex justify-center py-2 px-4 rounded-lg font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 disabled:opacity-50">
                {isGenerating ? <Spinner /> : 'Tạo'}
              </button>
              <button onClick={() => setActiveThemeId(null)} disabled={!activeThemeId} className="w-full sm:w-auto px-4 py-2 font-semibold bg-gray-600 hover:bg-gray-500 rounded-lg disabled:opacity-50">
                Khôi phục Mặc định
              </button>
            </div>
            {/* Saved Themes */}
            {savedThemes.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                    <h5 className="font-semibold text-gray-300 mb-2">Giao diện đã lưu</h5>
                    <ul className="space-y-2 max-h-40 overflow-y-auto">
                        {savedThemes.map(theme => (
                            <li key={theme.id} className={`flex items-center p-2 rounded-lg transition-colors ${activeThemeId === theme.id ? 'bg-purple-900/50' : 'bg-gray-700/50'}`}>
                                <span className="flex-grow font-semibold truncate">{theme.name}</span>
                                <div className="flex-shrink-0 flex gap-1 ml-2">
                                    <button onClick={() => setActiveThemeId(theme.id)} className="p-1.5 text-xs bg-blue-600 rounded hover:bg-blue-500" title="Áp dụng">Áp dụng</button>
                                    <button onClick={() => handleRenameTheme(theme.id)} className="p-1.5 text-xs bg-gray-600 rounded hover:bg-gray-500" title="Đổi tên">Sửa</button>
                                    <button onClick={() => handleDeleteTheme(theme.id)} className="p-1.5 text-xs bg-red-800 rounded hover:bg-red-700" title="Xóa">Xóa</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
          </div>
          <SettingToggle
              label="Giảm chuyển động"
              description="Giảm các hiệu ứng chuyển động và hoạt ảnh."
              checked={reduceMotion}
              onChange={setReduceMotion}
          />
      </Section>

      {/* Data Management Section */}
      <Section title="Quản lý Dữ liệu" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>}>
            <SettingToggle
              label="Tự động lưu vào Lịch sử"
              description="Tự động lưu tất cả các tác phẩm đã tạo vào tab Lịch sử."
              checked={autoSave}
              onChange={setAutoSave}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={() => { if(confirm("Bạn có chắc muốn xóa lịch sử sáng tạo?")) clearHistory().then(() => alert("Đã xóa lịch sử.")); }} className="p-4 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 text-left transition-colors">
                    <h4 className="font-semibold text-gray-200">Xóa Lịch sử Sáng tạo</h4>
                    <p className="text-sm text-gray-400">Xóa toàn bộ ảnh và video đã tạo.</p>
                </button>
                <button onClick={exportHistory} className="p-4 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 text-left transition-colors">
                    <h4 className="font-semibold text-gray-200">Xuất Lịch sử</h4>
                    <p className="text-sm text-gray-400">Tải xuống lịch sử của bạn dưới dạng tệp JSON.</p>
                </button>
                <button onClick={handleClearThemes} className="p-4 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 text-left transition-colors">
                  <h4 className="font-semibold text-gray-200">Xóa Giao diện đã lưu</h4>
                  <p className="text-sm text-gray-400">Xóa tất cả các giao diện AI đã tạo.</p>
              </button>
                <button onClick={handleClearAllData} className="p-4 bg-red-900/30 rounded-lg hover:bg-red-900/50 text-left transition-colors">
                    <h4 className="font-semibold text-red-300">Xóa Toàn bộ Dữ liệu</h4>
                    <p className="text-sm text-gray-400">Đặt lại ứng dụng và xóa tất cả dữ liệu đã lưu.</p>
                </button>
            </div>
      </Section>
      
       {/* Account & Info Section */}
       <Section title="Giới thiệu & Trợ giúp" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}>
            <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-lg">
                <div>
                    <h4 className="font-semibold text-gray-200">Tài khoản & Thanh toán</h4>
                    <p className="text-sm text-gray-400">Quản lý chi tiết tài khoản và đăng ký.</p>
                </div>
                <button onClick={() => setCurrentView('account')} className="px-4 py-2 font-semibold bg-gray-600 hover:bg-gray-500 rounded-lg text-sm">Đi đến Tài khoản</button>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-lg">
                <div>
                    <h4 className="font-semibold text-gray-200">Xem Hướng dẫn</h4>
                    <p className="text-sm text-gray-400">Tìm hiểu các mẹo và thủ thuật để có kết quả tốt nhất.</p>
                </div>
                <button onClick={() => setCurrentView('tutorials')} className="px-4 py-2 font-semibold bg-gray-600 hover:bg-gray-500 rounded-lg text-sm">Xem Hướng dẫn</button>
            </div>
             <div className="p-4 bg-gray-800/50 rounded-lg text-sm text-gray-400">
                <p><strong>Phiên bản:</strong> 1.2.0</p>
                <p className="mt-1">Được xây dựng với <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">Google Gemini</a>.</p>
            </div>
       </Section>
    </div>
  );
};

export default SettingsView;
