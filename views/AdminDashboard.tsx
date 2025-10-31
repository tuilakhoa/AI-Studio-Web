import React, { useState } from 'react';
import { User, FeatureFlag, SeoSetting } from '../types';

interface AdminDashboardProps {
  currentUser: User | null;
}

// Mock data, in a real app this would come from an API
const MOCK_FEATURES: FeatureFlag[] = [
    { id: 1, feature_key: 'video_composer', name: 'Trình tạo Video', is_enabled: true, description: 'Cho phép người dùng tạo video từ ảnh và lời nhắc.' },
    { id: 2, feature_key: 'outfit_try_on', name: 'Thử đồ AI', is_enabled: true, description: 'Tính năng thử trang phục ảo.' },
    { id: 3, feature_key: 'pose_transfer', name: 'Chuyển đổi Dáng', is_enabled: true, description: 'Sao chép dáng từ ảnh này sang ảnh khác.' },
    { id: 4, feature_key: 'texture_generator', name: 'Tạo Texture 3D', is_enabled: false, description: 'Tính năng đang thử nghiệm, tạo texture maps cho mô hình 3D.' },
];

const MOCK_SEO: SeoSetting[] = [
    { id: 1, page_key: 'landing', name: 'Trang chủ', meta_title: 'Chuyên Gia Headshot AI | AI Studio', meta_description: 'Tải lên ảnh selfie, chọn phong cách, và để AI tạo ra một bức ảnh chân dung chuyên nghiệp cho bạn.', meta_keywords: 'AI headshot, chuyên gia headshot AI, tạo ảnh chân dung' },
    { id: 2, page_key: 'headshot', name: 'Tạo Headshot', meta_title: 'Tạo Headshot Chuyên nghiệp | AI Studio', meta_description: 'Sử dụng AI để tạo ảnh headshot doanh nghiệp, nghệ thuật, và nhiều hơn nữa.', meta_keywords: 'tạo headshot, ảnh chân dung AI, ảnh đại diện' },
];


const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser }) => {
    const [features, setFeatures] = useState<FeatureFlag[]>(MOCK_FEATURES);
    const [seoSettings, setSeoSettings] = useState<SeoSetting[]>(MOCK_SEO);
    const [editingSeo, setEditingSeo] = useState<SeoSetting | null>(null);

    if (currentUser?.role !== 1) {
        return (
            <div className="text-center py-20 bg-red-900/20 border border-red-500/30 rounded-2xl animate-fade-in">
                <h2 className="text-3xl font-bold text-red-300 mb-2">Truy cập bị từ chối</h2>
                <p className="text-gray-400 text-lg">Bạn không có quyền truy cập trang này.</p>
            </div>
        );
    }
    
    // Handlers for features
    const toggleFeature = (id: number) => {
        setFeatures(features.map(f => f.id === id ? { ...f, is_enabled: !f.is_enabled } : f));
        // In a real app: API call to update feature flag
    };

    // Handlers for SEO
    const handleSeoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!editingSeo) return;
        setEditingSeo({ ...editingSeo, [e.target.name]: e.target.value });
    };

    const saveSeo = () => {
        if (!editingSeo) return;
        setSeoSettings(seoSettings.map(s => s.id === editingSeo.id ? editingSeo : s));
        setEditingSeo(null);
        // In a real app: API call to update SEO settings
    };

    return (
        <div className="animate-fade-in max-w-5xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-white">Bảng điều khiển Admin</h1>
            
            {/* Feature Flags Section */}
            <section className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                <h2 className="text-2xl font-semibold text-white mb-4">Quản lý Tính năng</h2>
                <div className="space-y-4">
                    {features.map(feature => (
                         <div key={feature.id} className="flex justify-between items-center p-4 bg-gray-800/50 rounded-lg">
                            <div>
                                <h4 className={`font-semibold ${feature.is_enabled ? 'text-gray-200' : 'text-gray-500 line-through'}`}>{feature.name}</h4>
                                <p className="text-sm text-gray-400">{feature.description}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={feature.is_enabled} onChange={() => toggleFeature(feature.id)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                        </div>
                    ))}
                </div>
            </section>

            {/* SEO Settings Section */}
            <section className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                <h2 className="text-2xl font-semibold text-white mb-4">Quản lý SEO</h2>
                <div className="space-y-4">
                    {seoSettings.map(setting => (
                         <div key={setting.id} className="p-4 bg-gray-800/50 rounded-lg">
                             <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="font-semibold text-gray-200">Trang: {setting.name}</h4>
                                    <p className="text-sm text-gray-400 truncate">Title: {setting.meta_title}</p>
                                </div>
                                <button onClick={() => setEditingSeo(setting)} className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-500 rounded-md">Chỉnh sửa</button>
                             </div>
                        </div>
                    ))}
                </div>
            </section>
            
            {/* SEO Editing Modal */}
            {editingSeo && (
                 <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setEditingSeo(null)}>
                    <div className="w-full max-w-2xl bg-gray-900 rounded-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white">Chỉnh sửa SEO cho trang: {editingSeo.name}</h3>
                        <div>
                            <label className="text-sm font-medium text-gray-300">Meta Title</label>
                            <input type="text" name="meta_title" value={editingSeo.meta_title} onChange={handleSeoChange} className="mt-1 w-full p-2 bg-gray-800 border border-gray-600 rounded-md"/>
                        </div>
                         <div>
                            <label className="text-sm font-medium text-gray-300">Meta Description</label>
                            <textarea name="meta_description" value={editingSeo.meta_description} onChange={handleSeoChange} rows={3} className="mt-1 w-full p-2 bg-gray-800 border border-gray-600 rounded-md"/>
                        </div>
                         <div>
                            <label className="text-sm font-medium text-gray-300">Meta Keywords (cách nhau bởi dấu phẩy)</label>
                            <input type="text" name="meta_keywords" value={editingSeo.meta_keywords} onChange={handleSeoChange} className="mt-1 w-full p-2 bg-gray-800 border border-gray-600 rounded-md"/>
                        </div>
                        <div className="flex justify-end gap-4 pt-4">
                            <button onClick={() => setEditingSeo(null)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg">Hủy</button>
                            <button onClick={saveSeo} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg">Lưu</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
