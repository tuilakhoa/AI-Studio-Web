import React from 'react';
import { View } from '../types';

interface Tutorial {
  title: string;
  image: string;
  content: React.ReactNode;
  linkTo: View;
  linkText: string;
}

const tutorials: Tutorial[] = [
  {
    title: 'Bí quyết cho một bức ảnh Headshot hoàn hảo',
    image: 'https://picsum.photos/seed/tut_headshot/600/400',
    linkTo: 'headshot',
    linkText: 'Thử Tạo Headshot',
    content: (
      <>
        <p>Bắt đầu với một bức ảnh selfie rõ nét, đủ sáng, khuôn mặt nhìn thẳng. AI sẽ tái tạo người trong ảnh dựa trên phong cách bạn chọn. Sử dụng các tùy chọn "Nâng cao" để tinh chỉnh ánh sáng và độ mờ nền để có kết quả chuyên nghiệp.</p>
      </>
    )
  },
  {
    title: 'Ghép chủ thể của bạn vào bất cứ đâu',
    image: 'https://picsum.photos/seed/tut_scene/600/400',
    linkTo: 'scene',
    linkText: 'Thử Ghép vào Cảnh',
    content: (
      <>
        <p>Đặt một người hoặc vật thể vào một bối cảnh hoàn toàn mới. AI sẽ điều chỉnh ánh sáng và bóng đổ. Để có kết quả tốt nhất, hãy chọn ảnh chủ thể có sự tách biệt rõ ràng với nền. Sử dụng tính năng "Vẽ để chọn vùng thay thế" để có sự ghép ảnh chính xác hơn.</p>
      </>
    )
  },
  {
    title: 'Sáng tạo không giới hạn với Trình ghép ảnh',
    image: 'https://picsum.photos/seed/tut_blender/600/400',
    linkTo: 'blender',
    linkText: 'Thử Trình ghép ảnh',
    content: (
      <>
        <p>Kết hợp từ hai đến bốn hình ảnh để tạo ra một tác phẩm nghệ thuật độc đáo. Viết một lời nhắc rõ ràng mô tả cách các hình ảnh nên được kết hợp. AI sẽ tự động đề xuất một lời nhắc để bạn bắt đầu!</p>
      </>
    )
  },
   {
    title: 'Từ ý tưởng đến hình ảnh và video',
    image: 'https://picsum.photos/seed/tut_freestyle/600/400',
    linkTo: 'freestyle',
    linkText: 'Thử Sáng tạo Tự do',
    content: (
      <>
        <p>Mô tả bất cứ điều gì bạn có thể tưởng tượng. Hãy thật chi tiết! Thay vì "một con chó", hãy thử "một chú chó con golden retriever đang chơi trên cánh đồng hoa lúc hoàng hôn, phong cách siêu thực". Sử dụng nút "Nâng cao Lời nhắc" để AI tự động thêm các chi tiết sống động.</p>
      </>
    )
  },
  {
    title: 'Phục hồi ký ức của bạn',
    image: 'https://picsum.photos/seed/tut_restore/600/400',
    linkTo: 'restore',
    linkText: 'Thử Khôi phục ảnh',
    content: (
      <>
        <p>Sửa chữa các vết trầy xước, phai màu và hư hỏng trên những bức ảnh cũ. Đánh dấu vào ô "Thêm màu" để AI tự động tô màu cho các bức ảnh đen trắng một cách chân thực.</p>
      </>
    )
  },
  {
    title: 'Khám phá Bộ Công cụ Sáng tạo',
    image: 'https://picsum.photos/seed/tut_suite/600/400',
    linkTo: 'outfit',
    linkText: 'Thử Bộ Công cụ Sáng tạo',
    content: (
      <>
        <p>Bộ công cụ này chứa các công cụ chuyên dụng để chỉnh sửa hình ảnh mạnh mẽ: Thử đồ, Chuyển đổi Dáng, Thay đổi Nền, Hoán đổi Gương mặt, và nhiều hơn nữa. Mỗi công cụ được thiết kế để thực hiện một tác vụ cụ thể với độ chính xác cao.</p>
      </>
    )
  },
  {
    title: 'Làm cho ảnh của bạn chuyển động',
    image: 'https://picsum.photos/seed/tut_video/600/400',
    linkTo: 'video',
    linkText: 'Thử Tạo Video',
    content: (
      <>
        <p>Tạo các video clip ngắn từ một hình ảnh tĩnh và một lời nhắc. Hãy nhớ rằng việc tạo video yêu cầu API Key của riêng bạn và có thể mất vài phút để xử lý. Mô tả chuyển động bạn muốn thấy, ví dụ: "mái tóc bay trong gió".</p>
      </>
    )
  },
];

const TutorialsView: React.FC<{ setCurrentView: (view: View) => void; }> = ({ setCurrentView }) => {
  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <p className="text-gray-400 mb-10 text-center">Nhận kết quả tốt nhất từ AI Studio với những lời khuyên chuyên nghiệp này.</p>
      <div className="space-y-6">
        {tutorials.map((tutorial, index) => (
          <div key={index} className="bg-white/5 rounded-lg overflow-hidden border border-white/10 transition-all duration-300 hover:bg-white/10 hover:shadow-2xl hover:border-purple-500/50">
            <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="p-6">
                    <h3 className="font-semibold text-xl text-gray-100 mb-3">{tutorial.title}</h3>
                    <div className="text-gray-300 prose prose-invert max-w-none prose-p:text-gray-300 prose-ul:text-gray-300 text-sm">
                        {tutorial.content}
                    </div>
                    <button 
                        onClick={() => setCurrentView(tutorial.linkTo)}
                        className="mt-6 px-4 py-2 text-sm font-semibold rounded-lg shadow-lg transition-all duration-300 ease-in-out flex items-center justify-center
                                  bg-gradient-to-r from-purple-600 to-indigo-600 text-white
                                  hover:from-purple-700 hover:to-indigo-700 hover:shadow-purple-500/40 transform hover:scale-105"
                    >
                        {tutorial.linkText}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </button>
                </div>
                 <div className="md:h-full h-48">
                    <img src={tutorial.image} alt={tutorial.title} className="w-full h-full object-cover"/>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TutorialsView;