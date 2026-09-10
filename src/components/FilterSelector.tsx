import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { VideoFilter } from '../types';

interface FilterSelectorProps {
  isOpen: boolean;
  activeFilter: VideoFilter;
  onSelectFilter: (filter: VideoFilter) => void;
  onClose: () => void;
}

const FILTERS: { id: VideoFilter; name: string; icon: string; previewColor: string }[] = [
  { id: 'none', name: 'Original', icon: '✨', previewColor: 'from-neutral-700 to-neutral-900' },
  { id: 'beauty', name: 'Beauty Glow', icon: '🌸', previewColor: 'from-pink-500 to-rose-400' },
  { id: 'warm', name: 'Warm Sunset', icon: '🌅', previewColor: 'from-amber-500 to-orange-500' },
  { id: 'cool', name: 'Cool Studio', icon: '❄️', previewColor: 'from-blue-500 to-cyan-400' },
  { id: 'vintage', name: 'Vintage 90s', icon: '📼', previewColor: 'from-yellow-700 to-stone-600' },
  { id: 'vibrant', name: 'Ultra Vibrant', icon: '🎨', previewColor: 'from-fuchsia-500 to-purple-600' },
];

export const FilterSelector: React.FC<FilterSelectorProps> = ({
  isOpen,
  activeFilter,
  onSelectFilter,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="filter-selector-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end"
      onClick={onClose}
    >
      <div
        id="filter-selector-sheet"
        className="w-full max-w-lg mx-auto bg-neutral-900 border-t border-white/10 rounded-t-3xl p-4 shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-rose-400" />
            <span className="text-sm font-semibold text-white">Live Beauty & Camera Filters</span>
          </div>
          <button
            type="button"
            id="btn-close-filter-sheet"
            onClick={onClose}
            className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              id={`filter-btn-${f.id}`}
              onClick={() => onSelectFilter(f.id)}
              className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 border transition-all ${
                activeFilter === f.id
                  ? 'border-rose-500 bg-rose-500/20 shadow-lg shadow-rose-500/20 scale-102'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${f.previewColor} flex items-center justify-center text-lg shadow-md`}
              >
                {f.icon}
              </div>
              <span className="text-xs font-medium text-white">{f.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
