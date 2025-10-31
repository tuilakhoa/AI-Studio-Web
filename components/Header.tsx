import React, { useState, useRef, useEffect } from 'react';
import { View, User } from '../types';
import UpgradeModal from './UpgradeModal';

interface HeaderProps {
  currentView: View;
  currentUser: User | null;
  onLogout: () => void;
  onLoginClick: () => void;
  setCurrentView: (view: View) => void;
  onToggleMobileSidebar: () => void;
}

const getTitleForView = (view: View): { title: string, subtitle: string } => {
  switch (view) {
    case 'landing':
      return { title: 'Trang chủ', subtitle: 'Chào mừng bạn đến với bộ công cụ sáng tạo AI' };
    case 'headshot':
      return { title: 'Tạo Headshot', subtitle: 'Tạo ảnh chân dung chuyên nghiệp' };
    case 'scene':
      return { title: 'Ghép vào Cảnh', subtitle: 'Đặt chủ thể của bạn vào một nền mới' };
    case 'blender':
      return { title: 'Trình ghép ảnh', subtitle: 'Kết hợp nhiều ảnh thành một tác phẩm độc đáo' };
    case 'freestyle':
      return { title: 'Sáng tạo Tự do', subtitle: 'Biến ý tưởng của bạn thành hình ảnh và video' };
    case 'video':
      return { title: 'Ghép vào Video', subtitle: 'Làm cho ảnh tĩnh của bạn chuyển động' };
    case 'history':
      return { title: 'Lịch sử', subtitle: 'Xem lại các tác phẩm đã tạo của bạn' };
    case 'restore':
      return { title: 'Khôi phục ảnh', subtitle: 'Mang lại sức sống mới cho những bức ảnh cũ' };
    case 'inspiration':
      return { title: 'Cảm hứng', subtitle: 'Khám phá những gì AI có thể làm' };
    case 'community':
      return { title: 'Triển lãm Cộng đồng', subtitle: 'Khám phá, học hỏi và sáng tạo cùng cộng đồng' };
    case 'tutorials':
      return { title: 'Hướng dẫn', subtitle: 'Mẹo và thủ thuật để có kết quả tốt nhất' };
    // New Creative Suite Views
    case 'fullbody':
      return { title: 'Tạo Nhân vật Toàn thân', subtitle: 'Sinh ảnh người từ mô tả chi tiết' };
    case 'outfit':
      return { title: 'Thử đồ AI', subtitle: 'Thay đổi trang phục bằng AI' };
    case 'pose':
      return { title: 'Chuyển đổi Dáng', subtitle: 'Áp dụng tư thế từ ảnh này sang ảnh khác' };
    case 'backgroundswap':
      return { title: 'Thay đổi Nền', subtitle: 'Tự động tách và thay thế nền' };
    case 'faceswap':
      return { title: 'Hoán đổi Gương mặt', subtitle: 'Trao đổi khuôn mặt giữa hai người' };
    case 'stylizer':
      return { title: 'Tạo Chân dung', subtitle: 'Biến ảnh của bạn thành tác phẩm nghệ thuật' };
    case 'animeConverter':
      return { title: 'Chuyển ảnh Anime', subtitle: 'Biến ảnh của bạn thành nhân vật anime' };
    case 'morph':
      return { title: 'Biến đổi Nghệ thuật', subtitle: 'Biến đổi động vật hoặc đồ vật thành người' };
    case 'outpainting':
        return { title: 'Vẽ Tiếp Khung Ảnh', subtitle: 'Mở rộng hình ảnh của bạn ra ngoài đường viền' };
    // New Advanced Tools
    case 'upscaler':
        return { title: 'Nâng cấp Ảnh', subtitle: 'Tăng độ phân giải và chi tiết cho ảnh' };
    case 'trainmodel':
        return { title: 'Huấn luyện Mô hình', subtitle: 'Tạo mô hình AI với hình ảnh của riêng bạn' };
    case 'texturegen':
        return { title: 'Tạo Texture 3D', subtitle: 'Tạo texture maps cho các dự án 3D' };
    // New Canvas Tools
    case 'realtimeCanvas':
        return { title: 'Bảng vẽ Thời gian thực', subtitle: 'Biến phác thảo thành tác phẩm nghệ thuật' };
    case 'canvasEditor':
        return { title: 'Trình chỉnh sửa Canvas', subtitle: 'Chỉnh sửa ảnh của bạn với các công cụ AI' };
    case 'flowstate':
        return { title: 'Flow State', subtitle: 'Một công cụ tạo video mạnh mẽ sắp ra mắt' };
    case 'account':
      return { title: 'Quản lý Tài khoản', subtitle: 'Xem chi tiết tài khoản và thanh toán của bạn' };
    case 'settings':
      return { title: 'Cài đặt', subtitle: 'Tùy chỉnh trải nghiệm của bạn' };
    default:
      return { title: 'Bảng điều khiển', subtitle: 'Chào mừng bạn đến với AI Studio' };
  }
};


const Header: React.FC<HeaderProps> = ({ currentView, currentUser, onLogout, onLoginClick, setCurrentView, onToggleMobileSidebar }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { title, subtitle } = getTitleForView(currentView);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileRef]);

  return (
    <>
      <header className="flex-shrink-0 flex justify-between items-center p-4 sm:p-6 w-full bg-black/10 backdrop-blur-lg border-b border-white/10 sticky top-0 z-20">
        <div className="flex items-center gap-4">
           <button onClick={onToggleMobileSidebar} className="p-1 text-gray-400 hover:text-white lg:hidden" aria-label="Mở menu">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
           </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">{title}</h1>
            <p className="text-sm text-gray-400 hidden sm:block">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 text-sm font-semibold rounded-lg shadow-lg transition-all duration-300 ease-in-out flex items-center justify-center
                      bg-gradient-to-r from-purple-500 to-indigo-500 text-white
                      hover:from-purple-600 hover:to-indigo-600 hover:shadow-purple-500/40 transform hover:scale-105
                      focus:outline-none focus:ring-4 focus:ring-purple-400 focus:ring-opacity-50"
          >
            Nâng cấp <span className="ml-2 hidden sm:inline">✨</span>
          </button>
           <div className="h-8 w-px bg-white/20"></div>
           {currentUser ? (
              <div className="relative" ref={profileRef}>
                <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-white/10">
                  <div title={currentUser.email} className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold text-sm uppercase">
                    {currentUser.email.charAt(0)}
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 origin-top-right bg-gray-800 border border-white/10 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-fade-in" style={{ animationDuration: '150ms' }}>
                    <div className="py-1">
                      <div className="px-4 py-2 border-b border-white/10">
                        <p className="text-sm text-gray-400">Đã đăng nhập với</p>
                        <p className="text-sm font-medium text-white truncate">{currentUser.email}</p>
                      </div>
                      <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('account'); setIsProfileOpen(false); }} className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white w-full text-left">Quản lý Tài khoản</a>
                      <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('settings'); setIsProfileOpen(false); }} className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white w-full text-left">Cài đặt</a>
                      <button onClick={() => { onLogout(); setIsProfileOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300">
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
           ) : (
             <button
                onClick={onLoginClick}
                className="px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-colors
                           bg-gray-700 hover:bg-gray-600 text-white
                           focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
                Đăng nhập / Đăng ký
            </button>
           )}
        </div>
      </header>
      {isModalOpen && <UpgradeModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
};

export default Header;