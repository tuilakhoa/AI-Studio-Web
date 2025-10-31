import React from 'react';
import { View } from '../types';

interface AccountViewProps {
  setCurrentView: (view: View) => void;
}

const AccountView: React.FC<AccountViewProps> = ({ setCurrentView }) => {
  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
        <div className="p-6 sm:p-8 bg-white/5 border border-white/10 rounded-2xl shadow-lg">
          <h2 className="text-3xl font-bold text-white mb-2">Quản lý Tài khoản</h2>
          <p className="text-gray-400 mb-6">
            Tại đây bạn có thể quản lý chi tiết tài khoản, thông tin thanh toán và các đăng ký của mình.
          </p>
          <div className="space-y-6">
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-200">Email</h3>
              <p className="text-gray-400">user@example.com</p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-200">Gói hiện tại</h3>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-gray-400">Gói Miễn phí</p>
                <button className="px-3 py-1 text-sm font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors">Nâng cấp lên Pro</button>
              </div>
            </div>
             <div className="p-4 bg-gray-800/50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-200">Thanh toán</h3>
              <p className="text-gray-400 mt-1">Không có phương thức thanh toán nào được lưu.</p>
            </div>
             <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <h3 className="text-lg font-semibold text-red-300">Xóa Tài khoản</h3>
              <p className="text-gray-400 mt-1 text-sm">Hành động này không thể hoàn tác. Tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn.</p>
               <button className="mt-3 px-3 py-1 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">Yêu cầu Xóa</button>
            </div>
          </div>
        </div>
    </div>
  );
};

export default AccountView;