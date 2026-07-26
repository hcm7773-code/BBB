import React, { useState } from 'react';
import { MenuItem, OrderType } from '../types';
import { Sparkles, X, Utensils, Send, RefreshCw, ChefHat, Check } from 'lucide-react';

interface AIRecommendWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  orderType: OrderType;
  onSelectItemByName: (name: string) => void;
}

const PRESET_MOODS = [
  { label: '輕食健康無負擔 🥗', prompt: '想要清爽輕負擔、熱量不高的健康美食' },
  { label: '澎湃飽足大餐 🥩', prompt: '肚子好餓！想要份量大、有肉有主食的澎湃超值組合' },
  { label: '香辣開胃下飯 🌶️', prompt: '想吃辣！想要香辣夠味、開胃解饞的餐點' },
  { label: '甜蜜下午茶解饞 🍰', prompt: '想吃甜點飲品放鬆，想要珍珠奶茶配精緻甜點' },
  { label: '主廚招牌初體驗 ⭐', prompt: '第一次來點餐，請推薦最熱銷招牌必吃的名物' },
];

export const AIRecommendWidget: React.FC<AIRecommendWidgetProps> = ({
  isOpen,
  onClose,
  menuItems,
  orderType,
  onSelectItemByName,
}) => {
  if (!isOpen) return null;

  const [customInput, setCustomInput] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(PRESET_MOODS[0].prompt);
  const [loading, setLoading] = useState(false);
  const [recommendResult, setRecommendResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerateRecommendation = async (promptToUse?: string) => {
    const preference = promptToUse || customInput || selectedPreset;
    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/ai-recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPreference: preference,
          orderType,
          menuItems,
        }),
      });

      if (!response.ok) {
        throw new Error('伺服器未提供 API 服務');
      }

      const data = await response.json();
      setRecommendResult(data.recommendation);
    } catch (err: any) {
      console.info('Static or API unavailable, using client-side AI recommendation engine:', err);
      // Smart static fallback for GitHub Pages / static hosting
      const fallbackText = generateLocalRecommendation(preference, orderType, menuItems);
      setRecommendResult(fallbackText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl overflow-hidden max-w-xl w-full my-8 shadow-2xl border border-stone-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 text-white p-5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">AI 美食聰明推薦助手</h2>
              <p className="text-xs text-amber-100">不知道今天想吃什麼？讓 AI 幫您量身搭餐！</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* Mood Presets */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-2">
              選擇您今天的心情或想吃的風格:
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_MOODS.map((mood) => {
                const isSelected = selectedPreset === mood.prompt && !customInput;
                return (
                  <button
                    key={mood.label}
                    onClick={() => {
                      setSelectedPreset(mood.prompt);
                      setCustomInput('');
                    }}
                    className={`text-xs px-3 py-2 rounded-xl font-medium border text-left transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-stone-900 border-amber-500 font-bold shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {mood.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Input */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              或是自行描述您的偏好/預算/禁忌:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="例如：預算 $250 內，想吃牛肉麵配涼的飲品..."
                className="flex-1 px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
              <button
                onClick={() => handleGenerateRecommendation()}
                disabled={loading}
                className="bg-stone-900 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-amber-600 transition-all flex items-center gap-1.5 shrink-0 shadow-xs disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>開始分析</span>
              </button>
            </div>
          </div>

          {/* AI Output Section */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-xl">
              ⚠️ {errorMsg}
            </div>
          )}

          {recommendResult && (
            <div className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-amber-900 text-xs font-bold border-b border-amber-200 pb-2">
                <ChefHat className="w-4 h-4 text-amber-700" />
                <span>AI 主廚為您量身規劃的菜單：</span>
              </div>

              <div className="text-xs text-stone-800 leading-relaxed whitespace-pre-line font-sans">
                {recommendResult}
              </div>

              <div className="pt-2 border-t border-amber-200/60 flex justify-between items-center text-xs">
                <span className="text-stone-500">喜歡這個推薦嗎？可直接至菜單選購！</span>
                <button
                  onClick={onClose}
                  className="bg-amber-500 hover:bg-amber-600 text-stone-900 font-bold px-3 py-1.5 rounded-lg transition-colors"
                >
                  去菜單點餐
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

function generateLocalRecommendation(preference: string, orderType: string, menuItems: MenuItem[]): string {
  const p = preference.toLowerCase();
  
  if (p.includes('輕食') || p.includes('健康') || p.includes('清爽') || p.includes('負擔')) {
    const main = menuItems.find(m => m.id === 'main-5') || menuItems[0];
    const drink = menuItems.find(m => m.id === 'drink-2') || menuItems[1];
    return `✨ 【輕盈無負擔活力組合】\n\n🍴 【建議餐點】\n• ${main.name} ($${main.price})\n• ${drink.name} ($${drink.price})\n\n💡 【推薦理由】\n清爽不油膩，高纖豐富，非常適合追求美味與輕盈無負擔的您！\n\n📌 【溫馨小貼士】\n四季春青茶建議無糖微冰，感受冷萃茶香與回甘韻味～`;
  }
  
  if (p.includes('飽足') || p.includes('肉') || p.includes('大餐') || p.includes('餓')) {
    const combo = menuItems.find(m => m.id === 'combo-1') || menuItems[0];
    const side = menuItems.find(m => m.id === 'side-1') || menuItems[1];
    return `🔥 【超霸氣澎湃飽足雙享組合】\n\n🍴 【建議餐點】\n• ${combo.name} ($${combo.price})\n• ${side.name} ($${side.price})\n\n💡 【推薦理由】\n大塊牛肉、香酥雞排配黑糖波霸鮮奶，份量爆棚，滿足大口吃肉的過癮滋味！\n\n📌 【溫馨小貼士】\n主餐可額外加購溏心蛋與起司片，美味層次更加倍！`;
  }

  if (p.includes('辣') || p.includes('香辣') || p.includes('麻辣')) {
    const noodle = menuItems.find(m => m.id === 'main-1') || menuItems[0];
    const side = menuItems.find(m => m.id === 'side-4') || menuItems[1];
    return `🌶️ 【川味香辣過癮熱血組合】\n\n🍴 【建議餐點】\n• ${noodle.name} ($${noodle.price})\n• ${side.name} ($${side.price})\n\n💡 【推薦理由】\n獨門秘製川味花椒與濃郁紅燒湯頭，麻辣香濃、超級開胃！\n\n📌 【溫馨小貼士】\n辣度可自由選擇微辣至大辣，建議搭配冰鎮冬瓜檸檬解辣效果絕佳～`;
  }

  if (p.includes('甜') || p.includes('下午茶') || p.includes('奶茶') || p.includes('放鬆')) {
    const boba = menuItems.find(m => m.id === 'drink-1') || menuItems[0];
    const dessert = menuItems.find(m => m.id === 'dessert-2') || menuItems[1];
    return `🧋 【悠閒療癒下午茶組合】\n\n🍴 【建議餐點】\n• ${boba.name} ($${boba.price})\n• ${dessert.name} ($${dessert.price})\n\n💡 【推薦理由】\n濃郁手炒黑糖珍珠鮮奶，搭配現烤酥脆焦糖布蕾，給您滿滿的幸福甜滋味！\n\n📌 【溫馨小貼士】\n珍珠鮮奶茶選擇少冰微糖最佳，甜而不膩口感最優！`;
  }

  // Default fallback recommendation
  return `⭐ 【主廚熱銷必吃招牌推薦】\n\n🍴 【建議餐點】\n• 職人特級紅燒牛肉麵 ($220)\n• 秘製台式酥脆鹽酥雞 ($85)\n• 手炒黑糖波霸鮮奶茶 ($70)\n\n💡 【推薦理由】\n嚴選店內人氣冠軍熱銷美食組合！牛肉軟嫩入味、鹽酥雞外酥內嫩，再搭配手炒黑糖波霸，體驗最道地的台味美味！\n\n📌 【溫馨小貼士】\n第一次來訪點這套絕對不踩雷，內用外帶都超適合！`;
}
