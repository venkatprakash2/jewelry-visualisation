import React, { useState, useMemo } from 'react';
import { Search, Plus } from 'lucide-react';
import { JewelryItem, JewelryCategory } from '../types';

interface ProductCodeSearchProps {
  catalog: JewelryItem[];
  selectedItem: JewelryItem;
  onSelectItem: (item: JewelryItem) => void;
  onOpenUploadOrnament?: () => void;
}

const CATEGORIES: { id: JewelryCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'necklace', label: 'Necklaces' },
  { id: 'choker', label: 'Chokers' },
  { id: 'earrings', label: 'Jhumkas' },
  { id: 'bangles', label: 'Bangles' },
  { id: 'ring', label: 'Rings' },
];

export const ProductCodeSearch: React.FC<ProductCodeSearchProps> = ({
  catalog,
  selectedItem,
  onSelectItem,
  onOpenUploadOrnament,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<JewelryCategory | 'all'>('all');

  const filteredItems = useMemo(() => {
    return catalog.filter((item) => {
      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      const q = query.trim().toLowerCase();
      if (!q) return matchesCat;
      return (
        matchesCat &&
        (item.code.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.collection.toLowerCase().includes(q))
      );
    });
  }, [catalog, query, selectedCategory]);

  return (
    <section className="bg-[#1F0A0E] border border-[#540813] rounded-2xl p-4 shadow-md space-y-3">
      {/* Search Input */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-[#D4AF37] absolute left-3.5 pointer-events-none" />
        <input
          id="product-code-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter GRT SKU (e.g. GRT-NK-1049, GRT-ER-2041)..."
          className="w-full bg-[#120406] border border-[#D4AF37]/30 rounded-xl pl-10 pr-10 py-2.5 text-xs text-[#FAF6EE] placeholder-stone-400 focus:outline-none focus:border-[#D4AF37]"
        />

        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 text-stone-400 hover:text-white text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Category Pills with generous spacing */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap text-xs transition-colors ${
              selectedCategory === cat.id
                ? 'bg-[#D4AF37] text-[#3D040C] font-bold shadow-xs'
                : 'bg-[#140306] text-stone-300 hover:bg-[#280B10] border border-[#3E0810]'
            }`}
          >
            {cat.label}
          </button>
        ))}

        {onOpenUploadOrnament && (
          <button
            type="button"
            onClick={onOpenUploadOrnament}
            className="px-2.5 py-1.5 rounded-full whitespace-nowrap text-xs text-[#E5C06E] hover:text-white flex items-center gap-1 ml-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add SKU</span>
          </button>
        )}
      </div>

      {/* Spaced Catalog Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto pr-1">
        {filteredItems.map((item) => {
          const isSelected = selectedItem.id === item.id;
          return (
            <div
              key={item.id}
              onClick={() => onSelectItem(item)}
              className={`cursor-pointer rounded-xl p-2 border flex flex-col justify-between transition-all ${
                isSelected
                  ? 'bg-[#3A0A10] border-[#D4AF37] ring-1 ring-[#D4AF37]'
                  : 'bg-[#140306] hover:bg-[#25080E] border-[#3E0810]'
              }`}
            >
              <div className="w-full aspect-square rounded-lg bg-black flex items-center justify-center p-1.5 overflow-hidden mb-1.5 border border-white/5">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              <div>
                <span className="font-mono text-[10px] text-[#D4AF37] font-bold block truncate">
                  {item.code}
                </span>
                <span className="text-[11px] text-white font-semibold block">
                  ₹{(item.price / 1000).toFixed(0)}k
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
