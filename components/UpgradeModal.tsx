import React from 'react';

interface UpgradeModalProps {
  onClose: () => void;
}

const ProFeature: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li className="flex items-center gap-3">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
    <span>{children}</span>
  </li>
);

const UpgradeModal: React.FC<UpgradeModalProps> = ({ onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 border border-purple-500/30 rounded-2xl shadow-2xl w-full max-w-md p-8 text-white relative transform transition-all duration-300 scale-95 hover:scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          aria-label="Đóng"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
            Nâng cấp lên Pro
          </h2>
          <p className="mt-3 text-gray-400">Mở khóa các tính năng mạnh mẽ để đưa sáng tạo của bạn lên một tầm cao mới.</p>
        </div>

        <ul className="space-y-4 my-8 text-gray-300">
          <ProFeature>Tạo ảnh với chất lượng và độ phân giải cao hơn</ProFeature>
          <ProFeature>Xử lý hàng loạt cho nhiều ảnh cùng lúc</ProFeature>
          <ProFeature>Truy cập các phong cách và mẫu Pro độc quyền</ProFeature>
          <ProFeature>Tạo video dài hơn và chất lượng cao hơn</ProFeature>
          <ProFeature>Không có watermark trên sản phẩm</ProFeature>
        </ul>

        <div className="text-center bg-white/5 p-4 rounded-lg">
            <p className="text-4xl font-bold">$19<span className="text-lg font-medium text-gray-400">/tháng</span></p>
        </div>

        <button className="w-full mt-8 py-3 px-6 text-lg font-bold rounded-lg shadow-lg transition-all duration-300 ease-in-out
                           bg-gradient-to-r from-purple-600 to-indigo-600 text-white
                           hover:from-purple-700 hover:to-indigo-700 hover:shadow-purple-500/50
                           focus:outline-none focus:ring-4 focus:ring-purple-400 focus:ring-opacity-50">
          Đăng ký ngay
        </button>
      </div>
    </div>
  );
};

export default UpgradeModal;
