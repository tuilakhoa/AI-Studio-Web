import React, { useState, useRef, useEffect } from 'react';
import { View } from '../types';

interface LandingPageProps {
  setCurrentView: (view: View) => void;
  onPromptSelect: (prompt: string) => void;
}

const timelineItems = [
    {
      title: '1. Khởi tạo & Sáng tạo Cơ bản',
      description: 'Bắt đầu với một lời nhắc đơn giản hoặc lấy cảm hứng từ cộng đồng. Biến bất kỳ ý tưởng nào thành hình ảnh hoặc video ban đầu.',
      tools: 'Công cụ: Sáng tạo Tự do, Cảm hứng, Triển lãm Cộng đồng',
      view: 'freestyle' as View,
    },
    {
      title: '2. Phát triển Chân dung & Nhân vật',
      description: 'Tạo ra các nhân vật chi tiết, từ ảnh chân dung chuyên nghiệp đến các nhân vật giả tưởng toàn thân hoặc theo phong cách anime.',
      tools: 'Công cụ: Tạo Headshot, Nhân vật Toàn thân, Chuyển ảnh Anime, Tạo Chân dung',
      view: 'headshot' as View,
    },
    {
      title: '3. Dàn dựng Cảnh & Bối cảnh',
      description: 'Đặt nhân vật của bạn vào bất kỳ bối cảnh nào, thay đổi nền một cách liền mạch, hoặc kết hợp nhiều ảnh thành một tác phẩm độc đáo.',
      tools: 'Công cụ: Ghép vào Cảnh, Thay đổi Nền, Trình ghép ảnh',
      view: 'scene' as View,
    },
    {
      title: '4. Chỉnh sửa & Biến đổi Nâng cao',
      description: 'Sử dụng bộ công cụ sáng tạo để thực hiện các thao tác phức tạp như thử đồ ảo, sao chép dáng, hoán đổi gương mặt, và mở rộng khung ảnh.',
      tools: 'Công cụ: Thử đồ AI, Chuyển đổi Dáng, Hoán đổi Gương mặt, Vẽ Tiếp Khung Ảnh, Biến đổi Nghệ thuật',
      view: 'canvasEditor' as View,
    },
    {
      title: '5. Hoàn thiện & Công cụ Chuyên nghiệp',
      description: 'Nâng cao chất lượng tác phẩm của bạn bằng cách tăng độ phân giải, khôi phục ảnh cũ, hoặc tạo texture PBR cho các dự án 3D.',
      tools: 'Công cụ: Nâng cấp Ảnh, Khôi phục ảnh, Tạo Texture 3D',
      view: 'upscaler' as View,
    },
    {
      title: '6. Chuyển động & Video',
      description: 'Thổi hồn vào những bức ảnh tĩnh của bạn, tạo ra các video clip ngắn từ một ý tưởng, và chờ đợi các công cụ video mạnh mẽ hơn.',
      tools: 'Công cụ: Ghép vào Video, Flow State (Sắp ra mắt)',
      view: 'video' as View,
    },
];

const TimelineItem: React.FC<{
    item: typeof timelineItems[0];
    setCurrentView: (view: View) => void;
}> = ({ item, setCurrentView }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    if (ref.current) {
                        observer.unobserve(ref.current);
                    }
                }
            }, { threshold: 0.1 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }
        return () => {
            if (ref.current) {
                // eslint-disable-next-line react-hooks/exhaustive-deps
                observer.unobserve(ref.current);
            }
        };
    }, []);

    return (
        <div ref={ref} className={`timeline-item ${isVisible ? 'is-visible' : ''}`}>
            <div className="timeline-dot"></div>
            <div className="timeline-content" onClick={() => setCurrentView(item.view)}>
                <h3 className="text-xl font-bold text-purple-400 mb-2">{item.title}</h3>
                <p className="text-gray-300">{item.description}</p>
                <div className="mt-3 text-xs text-gray-500">{item.tools}</div>
            </div>
        </div>
    );
};

const LandingPage: React.FC<LandingPageProps> = ({ setCurrentView, onPromptSelect }) => {
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const moreRef = useRef<HTMLDivElement>(null);

    const handleFeatureClick = (view: View) => {
        setCurrentView(view);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
                setIsMoreOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const featureBarItems = [
        { view: 'realtimeCanvas', title: 'Bảng vẽ', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg> },
        { view: 'flowstate', title: 'Flow State', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" /></svg> },
        { view: 'video', title: 'Video', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg> },
        { view: 'freestyle', title: 'Ảnh', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg> },
        { view: 'upscaler', title: 'Nâng cấp', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg> },
        { view: 'canvasEditor', title: 'Sửa Canvas', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.5 1.591L5.25 15.5 M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591l3.5 3.5m-3.5-3.5a24.301 24.301 0 004.5 0m0 0v5.714c0 .597.237 1.17.659 1.591l3.5 3.5M9.75 3.104c2.51 0 4.725.75 6.429 2.067M5.25 15.5A24.301 24.301 0 0012 18.75m0 0c2.51 0 4.725-.75 6.429-2.067M12 18.75v-5.714c0-.597-.237-1.17-.659-1.591L7.5 8.25m3.5 10.5c-2.51 0-4.725-.75-6.429-2.067" /></svg> },
    ] as const;

    const moreDropdownItems = [
        { view: 'freestyle', title: 'Sáng tạo Tự do', description: 'Tạo ảnh tuyệt đẹp với công nghệ của chúng tôi.' },
        { view: 'trainmodel', title: 'Huấn luyện Mô hình', description: 'Mở khóa tiềm năng sáng tạo bằng cách sử dụng hình ảnh của riêng bạn.' },
        { view: 'texturegen', title: 'Tạo Texture 3D', description: 'Tải lên một mô hình 3D để tạo và tải xuống texture maps.' },
    ] as const;

    const marqueeImages = Array.from({ length: 20 }, (_, i) => `https://picsum.photos/seed/marquee${i}/400/300`);

    return (
        <div className="w-full">
            {/* Hero Section */}
            <section
                className="relative flex flex-col items-center justify-center h-[70vh] min-h-[600px] text-center p-4 overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-purple-500/10"
            >
                 <div className="absolute inset-0 opacity-10 z-0 pointer-events-none filter blur-sm">
                    <div className="h-1/2 flex items-center gap-4 animate-marquee whitespace-nowrap">
                        {marqueeImages.slice(0, 10).map((src, i) => <img key={i} src={src} className="h-48 w-auto rounded-lg" alt="" />)}
                        {marqueeImages.slice(0, 10).map((src, i) => <img key={`dup-${i}`} src={src} className="h-48 w-auto rounded-lg" alt="" />)}
                    </div>
                     <div className="h-1/2 flex items-center gap-4 animate-marquee-reverse whitespace-nowrap">
                        {marqueeImages.slice(10).map((src, i) => <img key={i+10} src={src} className="h-48 w-auto rounded-lg" alt="" />)}
                        {marqueeImages.slice(10).map((src, i) => <img key={`dup-${i+10}`} src={src} className="h-48 w-auto rounded-lg" alt="" />)}
                    </div>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-indigo-950/50 to-transparent"></div>
                <div className="relative z-10 flex flex-col items-center animate-slow-float">
                    <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight max-w-4xl">
                      Gặp gỡ AI Studio: Sáng tạo Video Thế hệ mới
                    </h1>
                    <p className="mt-4 text-lg md:text-xl text-gray-300 max-w-2xl">
                        Biến ý tưởng thành những thế giới điện ảnh đắm chìm với chuyển động chân thực và âm thanh được đồng bộ hoàn hảo.
                    </p>
                    <button
                        onClick={() => handleFeatureClick('video')}
                        className="mt-8 px-8 py-3 text-lg font-bold rounded-lg shadow-lg transition-all duration-300 ease-in-out bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:shadow-purple-500/50 transform hover:scale-105"
                    >
                        Thử Ngay
                    </button>
                    <div className="mt-24">
                        <nav className="feature-bar">
                            {featureBarItems.map((item, index) => (
                                <button key={item.view} onClick={() => handleFeatureClick(item.view)} className={`feature-bar-item ${index === 3 ? 'central' : ''}`}>
                                    {item.icon}
                                    <span className="text-sm font-semibold">{item.title}</span>
                                </button>
                            ))}
                             <div ref={moreRef} className="relative">
                                <button onClick={() => setIsMoreOpen(v => !v)} className="feature-bar-item">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>
                                    <span className="text-sm font-semibold">Thêm</span>
                                </button>
                                {isMoreOpen && (
                                     <div className="more-dropdown absolute bottom-full right-0 mb-3 w-72 origin-bottom-right animate-fade-in" style={{ animationDuration: '150ms' }}>
                                        <div className="p-2">
                                            {moreDropdownItems.map(item => (
                                                <button key={item.view} onClick={() => { handleFeatureClick(item.view); setIsMoreOpen(false); }} className="w-full text-left p-3 rounded-lg hover:bg-white/10 flex items-start gap-3">
                                                    <div>
                                                        <p className="font-semibold text-white">{item.title}</p>
                                                        <p className="text-sm text-gray-400">{item.description}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </nav>
                    </div>
                </div>
            </section>
            
            {/* Creative Workflow Timeline Section */}
            <section className="py-24 px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-white mb-4">Quy trình Sáng tạo Hoàn chỉnh của Bạn</h2>
                    <p className="text-lg text-gray-400 max-w-3xl mx-auto">
                      Từ tia lửa ý tưởng đầu tiên đến tác phẩm hoàn thiện cuối cùng, AI Studio cung cấp mọi công cụ bạn cần.
                    </p>
                </div>

                <div className="timeline-container">
                    <div className="timeline-line"></div>
                    {timelineItems.map((item, index) => (
                      <TimelineItem
                        key={index}
                        item={item}
                        setCurrentView={setCurrentView}
                      />
                    ))}
                </div>
            </section>
        </div>
    );
};

export default LandingPage;