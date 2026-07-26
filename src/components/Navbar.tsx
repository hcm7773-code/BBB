import React from 'react';
import { ShoppingBag, Utensils, Sparkles, ClipboardList, ChefHat, Search, MapPin, Clock } from 'lucide-react';
import { OrderType } from '../types';

interface NavbarProps {
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  tableNumber: string;
  setTableNumber: (val: string) => void;
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  onOpenOrders: () => void;
  onOpenKitchen: () => void;
  onOpenAIRecommend: () => void;
  activeOrdersCount: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  orderType,
  setOrderType,
  tableNumber,
  setTableNumber,
  cartCount,
  cartTotal,
  onOpenCart,
  onOpenOrders,
  onOpenKitchen,
  onOpenAIRecommend,
  activeOrdersCount,
  searchTerm,
  setSearchTerm,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-100 shadow-xs transition-all">
      {/* Top Notice Bar */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 text-white font-medium px-2 py-0.5 rounded-full text-[10px]">
              📢 現正優惠
            </span>
            <span>首購輸入優惠碼<b>「TASTY50」</b>滿 $300 現折 $50！外送滿 $400 免運</span>
          </div>
          <div className="flex items-center gap-4 text-amber-100 hidden sm:flex">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> 營業時間: 10:30 - 21:30
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> 台北市大安區美食街 88 號
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          
          {/* Logo & Store Status */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-stone-900">
                  饗點 <span className="text-amber-600 font-extrabold">TastyBite</span>
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  營業中
                </span>
              </div>
              <p className="text-xs text-stone-500 hidden sm:block">職人手作料理與精緻冷飲線上點餐</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md hidden md:block relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜尋美味餐點、牛肉麵、珍奶、鹽酥雞..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-stone-100/80 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600"
              >
                清除
              </button>
            )}
          </div>

          {/* Actions & Utilities */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* AI Assistant Button */}
            <button
              onClick={onOpenAIRecommend}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 transition-all shadow-2xs group"
              title="不知道吃什麼？讓 AI 幫你推薦！"
            >
              <Sparkles className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline font-semibold">AI 智慧推薦</span>
              <span className="sm:hidden font-semibold">AI點餐</span>
            </button>

            {/* My Orders Button */}
            <button
              onClick={onOpenOrders}
              className="relative p-2 sm:px-3 sm:py-2 rounded-xl text-stone-700 hover:bg-stone-100 border border-stone-200/80 transition-all flex items-center gap-1.5 text-xs sm:text-sm font-medium"
              title="查看訂單進度"
            >
              <ClipboardList className="w-4 h-4 text-stone-600" />
              <span className="hidden md:inline">訂單狀態</span>
              {activeOrdersCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 sm:relative sm:top-0 sm:right-0 bg-amber-500 text-white font-bold text-[10px] px-1.5 py-0.5 rounded-full animate-bounce">
                  {activeOrdersCount}
                </span>
              )}
            </button>

            {/* Staff / Kitchen Mode Button */}
            <button
              onClick={onOpenKitchen}
              className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-all border border-stone-200/60 hidden lg:flex items-center gap-1.5 text-xs"
              title="切換至廚房與店員接單系統"
            >
              <ChefHat className="w-4 h-4 text-orange-600" />
              <span>廚房接單</span>
            </button>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-stone-900 to-stone-800 text-white font-medium hover:from-amber-600 hover:to-orange-600 transition-all shadow-md shadow-stone-900/10 active:scale-95"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-500 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-stone-900">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-xs sm:text-sm font-semibold">
                ${cartTotal}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Search Input */}
        <div className="mt-2.5 md:hidden relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜尋牛肉麵、珍珠奶茶、鹽酥雞..."
            className="w-full pl-10 pr-4 py-1.5 text-xs bg-stone-100 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>
      </div>
    </header>
  );
};
