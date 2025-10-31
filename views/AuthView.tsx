import React, { useState } from 'react';
import Spinner from '../components/Spinner';
import { User } from '../types';

interface AuthViewProps {
  onLoginSuccess: (user: User) => void;
  onClose: () => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess, onClose }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isLoginView) {
      // Logic đăng nhập (mô phỏng)
      // TODO: Thay thế bằng API call thực tế: fetch('/api/auth/login', ...)
      if (!email || !password) {
        setError("Vui lòng nhập email và mật khẩu.");
        return;
      }
    } else {
      // Logic đăng ký (mô phỏng)
      // TODO: Thay thế bằng API call thực tế: fetch('/api/auth/register', ...)
      if (password !== confirmPassword) {
        setError('Mật khẩu không khớp.');
        return;
      }
    }
    
    // Mô phỏng lời gọi API
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // Giả sử đăng nhập/đăng ký thành công và nhận về một đối tượng user từ backend
      const mockUser: User = {
        id: 'user-123-abc', // UUID từ database
        email: email,
        token: 'fake-jwt-token-for-demonstration' // JWT từ backend
      };
      onLoginSuccess(mockUser);
    }, 1500);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md p-8 space-y-6 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl relative"
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
          <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Chào mừng đến với AI Studio</h1>
          <p className="text-gray-400 mt-2">{isLoginView ? 'Đăng nhập để tiếp tục' : 'Tạo tài khoản mới'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-300">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-300">Mật khẩu</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isLoginView ? "current-password" : "new-password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="••••••••"
            />
          </div>
          {!isLoginView && (
            <div>
              <label htmlFor="confirm-password" className="text-sm font-medium text-gray-300">Xác nhận Mật khẩu</label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="••••••••"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {isLoading ? <Spinner /> : (isLoginView ? 'Đăng nhập' : 'Đăng ký')}
            </button>
          </div>
        </form>

        <div className="text-sm text-center">
          <button onClick={() => { setIsLoginView(!isLoginView); setError(null); }} className="font-medium text-purple-400 hover:text-purple-300">
            {isLoginView ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthView;