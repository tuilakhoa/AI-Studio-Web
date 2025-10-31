import React from 'react';

interface ComingSoonProps {
  featureName: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ featureName }) => (
    <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl animate-fade-in">
        <h2 className="text-3xl font-bold text-white mb-2">{featureName}</h2>
        <p className="text-gray-400 text-lg">✨ Sắp ra mắt ✨</p>
        <p className="text-gray-500 mt-2">Tính năng nâng cao này hiện đang được phát triển. Hãy theo dõi nhé!</p>
    </div>
);

export default ComingSoon;
