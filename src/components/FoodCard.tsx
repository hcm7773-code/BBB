import React from 'react';
import { MenuItem } from '../types';
import { Plus, Flame, Sparkles, Clock, AlertCircle } from 'lucide-react';

interface FoodCardProps {
  item: MenuItem;
  onSelectItem: (item: MenuItem) => void;
  onToggleAvailability?: (id: string) => void;
  isKitchenView?: boolean;
}

export const FoodCard: React.FC<FoodCardProps> = ({
  item,
  onSelectItem,
  onToggleAvailability,
  isKitchenView = false,
}) => {
  return (
    <div
      onClick={() => item.isAvailable && onSelectItem(item)}
      className={`group bg-white rounded-2xl overflow-hidden border border-stone-200/80 shadow-xs hover:shadow-md hover:border-amber-300 transition-all cursor-pointer flex flex-col relative ${
        !item.isAvailable ? 'opacity-60 grayscale' : ''
      }`}
    >
      {/* Image Header with Badges */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-stone-100">
        <img
          src={item.image}
          alt={item.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
          {item.tags.includes('popular') && (
            <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full shadow-xs flex items-center gap-0.5">
              <Flame className="w-3 h-3 fill-white" /> 熱銷
            </span>
          )}
          {item.tags.includes('recommended') && (
            <span className="bg-stone-900/90 text-amber-300 font-bold text-[10px] px-2 py-0.5 rounded-full shadow-xs backdrop-blur-xs">
              ★ 主廚推薦
            </span>
          )}
          {item.tags.includes('limited') && (
            <span className="bg-rose-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full shadow-xs flex items-center gap-0.5">
              <Sparkles className="w-3 h-3" /> 期間限定
            </span>
          )}
          {item.tags.includes('vegetarian') && (
            <span className="bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full shadow-xs">
              🥬 蛋奶素
            </span>
          )}
        </div>

        {/* Prep time badge */}
        {item.prepTime && (
          <div className="absolute bottom-2.5 right-2.5 bg-stone-900/75 text-white text-[10px] px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1 font-medium">
            <Clock className="w-3 h-3 text-amber-400" />
            {item.prepTime}
          </div>
        )}

        {/* Out of Stock Overlay */}
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center text-white font-bold text-sm">
            <div className="flex items-center gap-1.5 bg-stone-900/90 px-3 py-1.5 rounded-xl border border-stone-700">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              本日已售罄
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-stone-900 text-base group-hover:text-amber-700 transition-colors line-clamp-1">
              {item.name}
            </h3>
          </div>

          <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed mb-3">
            {item.description}
          </p>
        </div>

        {/* Footer: Spicy level, Calories, Price & Add button */}
        <div>
          <div className="flex items-center gap-3 text-[11px] text-stone-400 mb-2.5">
            {item.spicyLevel !== undefined && item.spicyLevel > 0 && (
              <span className="text-rose-600 font-medium flex items-center gap-0.5">
                {'🌶️'.repeat(item.spicyLevel)} {item.spicyLevel === 1 ? '微辣' : item.spicyLevel === 2 ? '中辣' : '大辣'}
              </span>
            )}
            {item.calories && (
              <span>{item.calories} kcal</span>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-stone-100">
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-amber-600">
                ${item.price}
              </span>
              {item.originalPrice && (
                <span className="text-xs text-stone-400 line-through">
                  ${item.originalPrice}
                </span>
              )}
            </div>

            {isKitchenView && onToggleAvailability ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleAvailability(item.id);
                }}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium border transition-all ${
                  item.isAvailable
                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                {item.isAvailable ? '設為完售' : '恢復供應'}
              </button>
            ) : (
              <button
                disabled={!item.isAvailable}
                className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-stone-900 font-bold text-xs px-3 py-1.5 rounded-xl transition-all shadow-xs active:scale-95 disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>{item.customOptionGroups && item.customOptionGroups.length > 0 ? '選購規格' : '點餐'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
