import React from 'react';
import { View } from '../types';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  isMobileOpen: boolean;
}

const NavItem: React.FC<{
  viewName: View;
  currentView: View;
  setCurrentView: (view: View) => void;
  icon: React.ReactElement;
  text: string;
  isExpanded: boolean;
}> = ({ viewName, currentView, setCurrentView, icon, text, isExpanded }) => {
  const isActive = currentView === viewName;
  return (
    <div className="relative group px-2">
      <button
        onClick={() => setCurrentView(viewName)}
        className={`relative flex items-center w-full p-3 my-1 rounded-lg transition-colors duration-200 ease-in-out ${
          isExpanded ? 'justify-start' : 'justify-center'
        } ${
          isActive
            ? 'bg-purple-600/30 text-white'
            : 'text-gray-400 hover:bg-white/10 hover:text-white'
        }`}
        aria-current={isActive ? 'page' : undefined}
      >
        {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-purple-400 rounded-r-full"></div>}
        {/* FIX: Explicitly pass 'any' as a generic type to React.cloneElement to resolve an overly strict type-checking issue with the 'className' prop. */}
        {React.cloneElement<any>(icon, { className: "h-6 w-6 flex-shrink-0" })}
        <span
          className={`font-semibold whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? 'max-w-xs ml-4 opacity-100' : 'max-w-0 ml-0 opacity-0'
          }`}
        >
          {text}
        </span>
      </button>
      {/* Tooltip for collapsed state */}
      {!isExpanded && (
        <span
          className="absolute left-full ml-3 px-3 py-1.5 text-sm font-medium text-white bg-gray-800 border border-white/10 rounded-md shadow-lg
                     opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-300 pointer-events-none z-50 whitespace-nowrap"
        >
          {text}
        </span>
      )}
    </div>
  );
};

const NavSection: React.FC<{ title: string, isExpanded: boolean }> = ({ title, isExpanded }) => {
    if (isExpanded) {
        return (
            <div className={`w-full px-4 mt-6 mb-1 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
            </div>
        );
    }
    // Render a subtle divider when collapsed, but not for the very first section
    if (title !== 'Công cụ Chính') {
       return <div className="w-full my-3 px-8"><div className="w-full h-px bg-white/10"></div></div>;
    }
    return null;
};


const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isExpanded, setIsExpanded, isMobileOpen }) => {
  // FIX: Use 'as const' to infer the literal types for viewName, making them assignable to the 'View' type instead of the broader 'string' type.
  const allNavItems = [
    { section: 'Công cụ Chính', items: [
      { viewName: 'headshot', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, text: 'Tạo Headshot' },
      { viewName: 'scene', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, text: 'Ghép vào Cảnh' },
      { viewName: 'blender', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5" /></svg>, text: 'Trình ghép ảnh' },
      { viewName: 'freestyle', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.293 2.293M17.707 5.293L15.414 7.586m-5.121 5.121l-2.293 2.293M8.414 15.414L6.121 17.707m11.314-5.121l-2.293-2.293m2.293 2.293L15.414 8.414" /></svg>, text: 'Sáng tạo Tự do' },
      { viewName: 'restore', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>, text: 'Khôi phục ảnh' },
    ]},
     { section: 'Công cụ Canvas', items: [
      { viewName: 'realtimeCanvas', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>, text: 'Bảng vẽ Thời gian thực' },
      { viewName: 'canvasEditor', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>, text: 'Trình chỉnh sửa Canvas' },
    ]},
    { section: 'Bộ Công cụ Sáng tạo', items: [
      { viewName: 'fullbody', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>, text: 'Nhân vật Toàn thân' },
      { viewName: 'outfit', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" transform="scale(1, -1) translate(0, -24)" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6" transform="scale(1, -1) translate(0, -24)" /></svg>, text: 'Thử đồ AI' },
      { viewName: 'pose', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>, text: 'Chuyển đổi Dáng' },
      { viewName: 'backgroundswap', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /><path strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 3" d="M7.5 16.5L21 3" /></svg>, text: 'Thay đổi Nền' },
      { viewName: 'faceswap', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h.01M12 7h.01M16 7h.01M9 17h6M10 13a2 2 0 104 0 2 2 0 00-4 0zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, text: 'Hoán đổi Gương mặt' },
      { viewName: 'stylizer', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12.5a2 2 0 002-2v-6.5a2 2 0 00-2-2H7" /></svg>, text: 'Tạo Chân dung' },
      { viewName: 'animeConverter', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M17.5 5.5l1 1M20.5 5.5l-1 1M19 4v2.5M19 9v-2.5" /></svg>, text: 'Chuyển ảnh Anime' },
      { viewName: 'morph', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>, text: 'Biến đổi Nghệ thuật' },
      { viewName: 'outpainting', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="7" y="7" width="10" height="10" rx="1" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 12h4m10 0h4M12 3v4m0 10v4" /></svg>, text: 'Vẽ Tiếp Khung Ảnh' },
    ]},
    { section: 'Video & Chuyển động', items: [
      { viewName: 'video', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>, text: 'Ghép vào Video' },
    ]},
    { section: 'Công cụ Nâng cao', items: [
      { viewName: 'upscaler', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 10l-2 2m2-2l2 2m-2-2l-2-2m2 2l2-2" /></svg>, text: 'Nâng cấp Ảnh' },
      { viewName: 'trainmodel', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>, text: 'Huấn luyện Mô hình' },
      { viewName: 'texturegen', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>, text: 'Tạo Texture 3D' },
    ]},
    { section: 'Thư viện', items: [
      { viewName: 'history', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, text: 'Lịch sử' },
      { viewName: 'inspiration', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>, text: 'Cảm hứng' },
      { viewName: 'community', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>, text: 'Cộng đồng' },
      { viewName: 'tutorials', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6-2.292m0 0v14.25" /></svg>, text: 'Hướng dẫn' },
    ]},
  ] as const;

  return (
    <aside className={`fixed top-0 left-0 h-full bg-black/50 backdrop-blur-xl border-r border-white/10 flex flex-col z-40 transition-transform duration-300 ease-in-out overflow-x-hidden 
      ${isExpanded ? 'lg:w-64' : 'lg:w-24'}
      ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
    `}>
      <button onClick={() => setCurrentView('landing')} className="text-center mb-6 w-full flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg p-2 mt-6">
         <div className="w-10 h-10 mx-auto bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" />
            </svg>
         </div>
         <h1 className={`text-2xl font-bold text-white mt-4 whitespace-nowrap overflow-hidden transition-opacity ${isExpanded ? 'opacity-100 duration-300 delay-200' : 'opacity-0'}`}>AI Studio</h1>
      </button>

      <nav className="w-full flex-grow overflow-y-auto">
        {allNavItems.map(section => (
          <React.Fragment key={section.section}>
            <NavSection title={section.section} isExpanded={isExpanded} />
            {section.items.map(item => (
              <NavItem
                key={item.viewName}
                viewName={item.viewName}
                currentView={currentView}
                setCurrentView={setCurrentView}
                icon={item.icon}
                text={item.text}
                isExpanded={isExpanded}
              />
            ))}
          </React.Fragment>
        ))}
      </nav>
      
       <div className="mt-auto p-2 flex-shrink-0 border-t border-white/10 hidden lg:block">
        <div className="relative group px-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`flex items-center w-full p-3 my-1 rounded-lg transition-colors duration-200 ease-in-out text-gray-400 hover:bg-white/10 hover:text-white ${isExpanded ? 'justify-start' : 'justify-center'}`}
            >
              {isExpanded ? 
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg> :
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
              }
              <span
                className={`font-semibold whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
                  isExpanded ? 'max-w-xs ml-4 opacity-100' : 'max-w-0 ml-0 opacity-0'
                }`}
              >
                Thu gọn
              </span>
            </button>
         </div>
      </div>
    </aside>
  );
};

export default Sidebar;