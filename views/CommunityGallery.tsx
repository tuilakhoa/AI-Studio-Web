import React, { useState } from 'react';
import { CommunityPost } from '../types';

interface CommunityGalleryProps {
  onPromptSelect: (prompt: string) => void;
}

// Dữ liệu giả lập cho triển lãm. Trong một ứng dụng thực, dữ liệu này sẽ được lấy từ backend.
const MOCK_COMMUNITY_POSTS: CommunityPost[] = [
    { id: 'comm1', imageUrl: 'https://picsum.photos/seed/comm_a/500/750', prompt: 'A hyper-realistic full body portrait of a wise old elf wizard with a long white beard, holding a glowing staff, in an enchanted forest, fantasy art.', author: 'CreativeWizard', likes: 128, type: 'freestyle' },
    { id: 'comm2', imageUrl: 'https://picsum.photos/seed/comm_b/500/600', prompt: 'A futuristic eco-city with buildings covered in lush vertical gardens and waterfalls, clean energy, utopian, solarpunk aesthetic.', author: 'FutureScapes', likes: 256, type: 'freestyle' },
    { id: 'comm3', imageUrl: 'https://picsum.photos/seed/comm_c/500/800', prompt: 'A professional headshot of a female software engineer, dramatic lighting, modern tech office background with bokeh.', author: 'AI_Portraits', likes: 95, type: 'headshot' },
    { id: 'comm4', imageUrl: 'https://picsum.photos/seed/comm_d/500/500', prompt: 'A fierce female orc warrior with tribal tattoos and a heavy battle axe, standing on a rocky outcrop at sunset, cinematic lighting, detailed armor.', author: 'FantasyFan', likes: 312, type: 'fullbody' },
    { id: 'comm5', imageUrl: 'https://picsum.photos/seed/comm_e/500/650', prompt: 'A person converted into a vibrant, high-quality Japanese anime style, standing in a cherry blossom garden.', author: 'AnimeLover22', likes: 189, type: 'animeConverter' },
    { id: 'comm6', imageUrl: 'https://picsum.photos/seed/comm_f/500/700', prompt: 'An astronaut character transferred into a dancing pose from a reference image, set on the surface of the moon.', author: 'PoseMaster', likes: 76, type: 'pose' },
    { id: 'comm7', imageUrl: 'https://picsum.photos/seed/comm_g/500/850', prompt: 'A majestic dragonborn paladin in shining platinum armor, wielding a holy sword that radiates light, epic character concept art.', author: 'DND_Creator', likes: 450, type: 'fullbody' },
    { id: 'comm8', imageUrl: 'https://picsum.photos/seed/comm_h/500/600', prompt: 'A person wearing an elaborate cyberpunk jacket made of neon tubes and chrome, described by a text prompt.', author: 'CyberFashion', likes: 210, type: 'outfit' },
];


const CommunityGallery: React.FC<CommunityGalleryProps> = ({ onPromptSelect }) => {
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  
  const handleCopyPrompt = () => {
    if(!selectedPost || copied) return;
    navigator.clipboard.writeText(selectedPost.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleUsePrompt = () => {
      if(!selectedPost) return;
      onPromptSelect(selectedPost.prompt);
  }

  const DetailModal = () => {
    if (!selectedPost) return null;
    return (
      <div onClick={() => setSelectedPost(null)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in">
        <div onClick={(e) => e.stopPropagation()} className="bg-gray-900 border border-purple-500/30 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
          <div className="bg-black flex items-center justify-center">
            <img src={selectedPost.imageUrl} alt={selectedPost.prompt} className="w-full h-full object-contain max-h-[50vh] lg:max-h-[90vh]" />
          </div>
          <div className="p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold text-white">Lời nhắc</h3>
                    <p className="text-sm text-gray-400">bởi {selectedPost.author}</p>
                </div>
                 <div className="flex items-center gap-1 text-red-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                    <span className="font-semibold">{selectedPost.likes}</span>
                </div>
            </div>
            <p className="text-gray-300 flex-grow overflow-y-auto mb-4 bg-gray-800 p-3 rounded-lg text-sm">{selectedPost.prompt}</p>
            <div className="flex flex-col sm:flex-row gap-3">
               <button onClick={handleUsePrompt} className="w-full py-3 px-4 text-md font-bold rounded-lg shadow-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700">
                Dùng Lời nhắc này
              </button>
              <button onClick={handleCopyPrompt} className="w-full sm:w-auto px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                 {copied ? 'Đã sao chép!' : 'Sao chép'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <DetailModal />
      <div className="animate-fade-in">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-2">Triển lãm Cộng đồng</h2>
          <p className="text-gray-400 max-w-3xl mx-auto">
            Xem những gì người khác đang tạo, học hỏi từ lời nhắc của họ và khơi nguồn cảm hứng cho tác phẩm tiếp theo của bạn.
          </p>
        </div>
        
        <div className="columns-2 sm:columns-3 md:columns-4 gap-6 space-y-6">
          {MOCK_COMMUNITY_POSTS.map((post) => (
            <div 
              key={post.id} 
              onClick={() => setSelectedPost(post)} 
              className="group relative rounded-lg overflow-hidden shadow-lg border border-white/10 break-inside-avoid cursor-pointer transform transition-transform duration-300 hover:scale-105"
            >
              <img 
                src={post.imageUrl} 
                alt={post.prompt} 
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end">
                <p className="text-white text-sm font-semibold line-clamp-3">{post.prompt}</p>
                <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-300">bởi {post.author}</p>
                    <div className="flex items-center gap-1 text-red-400 text-xs">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                        <span>{post.likes}</span>
                    </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default CommunityGallery;