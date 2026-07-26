import React from 'react';
import { Category, DietaryTag } from '../types';
import { Flame, Star, Sparkles, Leaf, Award, Compass, Utensils } from 'lucide-react';

interface CategoryNavProps {
  selectedCategory: Category;
  setSelectedCategory: (cat: Category) => void;
  selectedTag: DietaryTag | 'all';
  setSelectedTag: (tag: DietaryTag | 'all') => void;
  countsByCategory: Record<Category, number>;
}

const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: 'all', label: '全部美食', icon: '🍽️' },
  { id: 'main', label: '招牌主餐', icon: '🍜' },
  { id: 'combo', label: '超值套餐', icon: '🍱' },
  { id: 'side', label: '特色單點', icon: '🍗' },
  { id: 'drink', label: '職人特調', icon: '🧋' },
  { id: 'dessert', label: '精緻甜點', icon: '🍮' },
  { id: 'special', label: '本月特惠', icon: '🔥' },
];

const DIET_TAGS: { id: DietaryTag | 'all'; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: '不限標籤', icon: <Compass className="w-3.5 h-3.5" /> },
  { id: 'popular', label: '人氣熱銷', icon: <Flame className="w-3.5 h-3.5 text-orange-500" /> },
  { id: 'recommended', label: '主廚推薦', icon: <Award className="w-3.5 h-3.5 text-amber-500" /> },
  { id: 'spicy', label: '香辣美味', icon: <span className="text-xs">🌶️</span> },
  { id: 'vegetarian', label: '蔬食專區', icon: <Leaf className="w-3.5 h-3.5 text-emerald-500" /> },
  { id: 'limited', label: '限量特惠', icon: <Sparkles className="w-3.5 h-3.5 text-amber-500" /> },
];

export const CategoryNav: React.FC<CategoryNavProps> = ({
  selectedCategory,
  setSelectedCategory,
  selectedTag,
  setSelectedTag,
  countsByCategory,
}) => {
  return (
    <div className="space-y-4 mb-6">
      {/* Primary Category Horizontal Scroll */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          const count = countsByCategory[cat.id] || 0;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all snap-start ${
                isActive
                  ? 'bg-stone-900 text-white shadow-md shadow-stone-900/10 scale-102'
                  : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200/80'
              }`}
            >
              <span className="text-base">{cat.icon}</span>
              <span>{cat.label}</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-amber-500 text-stone-900' : 'bg-stone-100 text-stone-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sub Tag Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
        <span className="text-stone-400 font-medium shrink-0 text-xs">篩選標籤:</span>
        {DIET_TAGS.map((tag) => {
          const isActive = selectedTag === tag.id;
          return (
            <button
              key={tag.id}
              onClick={() => setSelectedTag(tag.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-amber-500 text-stone-900 font-bold shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
              }`}
            >
              {tag.icon}
              <span>{tag.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
