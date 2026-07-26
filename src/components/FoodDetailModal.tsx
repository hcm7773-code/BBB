import React, { useState, useEffect } from 'react';
import { MenuItem, SelectedOption } from '../types';
import { X, Plus, Minus, ShoppingBag, Check, Flame, Clock } from 'lucide-react';

interface FoodDetailModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (item: MenuItem, quantity: number, selectedOptions: SelectedOption[], specialNotes: string) => void;
}

export const FoodDetailModal: React.FC<FoodDetailModalProps> = ({ item, onClose, onAddToCart }) => {
  if (!item) return null;

  const [quantity, setQuantity] = useState<number>(1);
  const [selectedOptionsMap, setSelectedOptionsMap] = useState<Record<string, SelectedOption[]>>({});
  const [specialNotes, setSpecialNotes] = useState<string>('');

  // Initialize default options
  useEffect(() => {
    if (item && item.customOptionGroups) {
      const initialMap: Record<string, SelectedOption[]> = {};
      
      item.customOptionGroups.forEach((group) => {
        if (group.required) {
          const defaultOpt = group.options.find((o) => o.isDefault) || group.options[0];
          if (defaultOpt) {
            initialMap[group.id] = [{
              groupId: group.id,
              groupTitle: group.title,
              optionId: defaultOpt.id,
              optionName: defaultOpt.name,
              price: defaultOpt.price,
            }];
          }
        } else {
          initialMap[group.id] = [];
        }
      });
      setSelectedOptionsMap(initialMap);
    } else {
      setSelectedOptionsMap({});
    }
    setQuantity(1);
    setSpecialNotes('');
  }, [item]);

  // Handle radio / single-select option selection
  const handleSingleSelect = (groupId: string, groupTitle: string, optId: string, optName: string, price: number) => {
    setSelectedOptionsMap((prev) => ({
      ...prev,
      [groupId]: [{
        groupId,
        groupTitle,
        optionId: optId,
        optionName: optName,
        price,
      }],
    }));
  };

  // Handle multi-select option (checkboxes)
  const handleMultiSelectToggle = (groupId: string, groupTitle: string, optId: string, optName: string, price: number, maxSelect?: number) => {
    setSelectedOptionsMap((prev) => {
      const current = prev[groupId] || [];
      const exists = current.some((o) => o.optionId === optId);

      if (exists) {
        return {
          ...prev,
          [groupId]: current.filter((o) => o.optionId !== optId),
        };
      } else {
        if (maxSelect && current.length >= maxSelect) {
          return prev; // limit reached
        }
        return {
          ...prev,
          [groupId]: [
            ...current,
            { groupId, groupTitle, optionId: optId, optionName: optName, price },
          ],
        };
      }
    });
  };

  // Flatten all selected options
  const allSelectedOptions: SelectedOption[] = Object.keys(selectedOptionsMap).reduce(
    (acc: SelectedOption[], key: string) => acc.concat(selectedOptionsMap[key] || []),
    []
  );

  // Extra price calculation
  const extraPrice = allSelectedOptions.reduce((sum, opt) => sum + opt.price, 0);
  const unitPrice = item.price + extraPrice;
  const totalPrice = unitPrice * quantity;

  const handleConfirmAdd = () => {
    onAddToCart(item, quantity, allSelectedOptions, specialNotes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl overflow-hidden max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 animate-scaleUp">
        
        {/* Header Image & Close */}
        <div className="relative h-56 sm:h-64 w-full bg-stone-100 shrink-0">
          <img
            src={item.image}
            alt={item.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-stone-900/70 hover:bg-stone-900 text-white p-2 rounded-full transition-all backdrop-blur-xs"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-4 bg-stone-900/80 text-amber-300 text-xs font-bold px-3 py-1 rounded-full backdrop-blur-xs flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>預估製作時間: {item.prepTime || '10-15 分鐘'}</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Title & Description */}
          <div>
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
                {item.name}
              </h2>
              <span className="text-xl font-black text-amber-600 shrink-0">
                ${item.price}
              </span>
            </div>
            <p className="text-stone-600 text-xs sm:text-sm mt-2 leading-relaxed">
              {item.description}
            </p>

            {item.calories && (
              <p className="text-xs text-stone-400 mt-2">
                🔥 卡路里熱量估計: ~{item.calories} kcal
              </p>
            )}
          </div>

          {/* Custom Option Groups */}
          {item.customOptionGroups && item.customOptionGroups.length > 0 && (
            <div className="space-y-5 pt-4 border-t border-stone-100">
              {item.customOptionGroups.map((group) => {
                const isSingle = group.maxSelect === 1 || group.required;
                const currentSelections = selectedOptionsMap[group.id] || [];

                return (
                  <div key={group.id} className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-stone-900">
                          {group.title}
                        </span>
                        {group.required ? (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                            必選
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-stone-400">
                            可選 (最多 {group.maxSelect || '無限制'} 項)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {group.options.map((opt) => {
                        const isSelected = currentSelections.some((o) => o.optionId === opt.id);

                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              if (isSingle) {
                                handleSingleSelect(group.id, group.title, opt.id, opt.name, opt.price);
                              } else {
                                handleMultiSelectToggle(group.id, group.title, opt.id, opt.name, opt.price, group.maxSelect);
                              }
                            }}
                            className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold border text-left transition-all ${
                              isSelected
                                ? 'bg-amber-500 text-stone-900 border-amber-500 shadow-xs'
                                : 'bg-stone-50 text-stone-700 border-stone-200/80 hover:bg-stone-100'
                            }`}
                          >
                            <span className="line-clamp-1">{opt.name}</span>
                            <span className="text-[11px] opacity-80 shrink-0">
                              {opt.price > 0 ? `+$${opt.price}` : '免費'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Special Notes / Custom Remarks */}
          <div className="pt-4 border-t border-stone-100">
            <label className="block text-xs font-bold text-stone-700 mb-2">
              特殊需求備註 (選填)
            </label>
            <input
              type="text"
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              placeholder="例：不要香菜、少醬汁、辣另外包、去洋蔥..."
              className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>
        </div>

        {/* Modal Footer: Quantity & Add to Cart CTA */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200/80 flex items-center justify-between gap-4 shrink-0">
          
          {/* Quantity Selector */}
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-stone-200">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-600 hover:bg-stone-100 active:scale-95 transition-all"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center text-sm font-bold text-stone-900">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-600 hover:bg-stone-100 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add CTA */}
          <button
            onClick={handleConfirmAdd}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-stone-900 font-extrabold text-sm py-3 px-5 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-md active:scale-98"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>加入購物車・${totalPrice}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
