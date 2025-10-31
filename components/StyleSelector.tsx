import React from 'react';
import { HEADSHOT_STYLES } from '../constants';
import { HeadshotStyle } from '../types';

interface StyleSelectorProps {
  selectedStyle: HeadshotStyle | null;
  onStyleSelect: (style: HeadshotStyle) => void;
}

const StyleSelector: React.FC<StyleSelectorProps> = ({ selectedStyle, onStyleSelect }) => {
  return (
    <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md">
      <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">2. Chọn một phong cách</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {HEADSHOT_STYLES.map((style) => (
          <button
            key={style.id}
            onClick={() => onStyleSelect(style)}
            className={`relative group rounded-lg overflow-hidden aspect-square focus:outline-none transition-all duration-300 ease-in-out transform hover:scale-105
              ${selectedStyle?.id === style.id ? 'ring-4 ring-purple-500 shadow-2xl' : 'ring-2 ring-transparent hover:ring-purple-400'}`}
          >
            <img src={style.thumbnail} alt={style.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2">
              <span className="text-white text-sm font-semibold text-left">{style.name}</span>
            </div>
            {selectedStyle?.id === style.id && (
              <div className="absolute top-2 right-2 bg-purple-500 text-white rounded-full p-1.5 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default StyleSelector;