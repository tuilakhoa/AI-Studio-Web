import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full max-w-7xl mx-auto mt-auto py-6 px-4 sm:px-6 lg:px-8 border-t border-white/10 text-center text-gray-500 text-sm flex-shrink-0">
      <div className="flex justify-center gap-6 mb-4">
        <a href="#" className="hover:text-gray-300 transition-colors">Điều khoản Dịch vụ</a>
        <a href="#" className="hover:text-gray-300 transition-colors">Chính sách Bảo mật</a>
      </div>
      <p>&copy; {new Date().getFullYear()} AI Studio. Mọi quyền được bảo lưu.</p>
      <p className="mt-1">Một sản phẩm demo được tạo ra bởi Lê Phạm Quốc Khoa</p>
    </footer>
  );
};

export default Footer;