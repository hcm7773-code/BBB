import React from 'react';
import { UtensilsCrossed, ShoppingBag, Truck, MapPin, Clock, Table } from 'lucide-react';
import { OrderType } from '../types';

interface OrderTypeSelectorProps {
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  tableNumber: string;
  setTableNumber: (table: string) => void;
  pickupTime: string;
  setPickupTime: (time: string) => void;
  deliveryAddress: string;
  setDeliveryAddress: (addr: string) => void;
}

export const OrderTypeSelector: React.FC<OrderTypeSelectorProps> = ({
  orderType,
  setOrderType,
  tableNumber,
  setTableNumber,
  pickupTime,
  setPickupTime,
  deliveryAddress,
  setDeliveryAddress,
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-100 shadow-sm mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Type Segmented Buttons */}
        <div className="flex items-center p-1 bg-stone-100 rounded-xl w-full lg:w-auto">
          <button
            onClick={() => setOrderType('dine-in')}
            className={`flex-1 lg:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              orderType === 'dine-in'
                ? 'bg-white text-stone-900 shadow-xs border border-stone-200/80'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4 text-amber-600" />
            <span>內用點餐</span>
          </button>

          <button
            onClick={() => setOrderType('takeout')}
            className={`flex-1 lg:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              orderType === 'takeout'
                ? 'bg-white text-stone-900 shadow-xs border border-stone-200/80'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-amber-600" />
            <span>外帶自取</span>
          </button>

          <button
            onClick={() => setOrderType('delivery')}
            className={`flex-1 lg:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              orderType === 'delivery'
                ? 'bg-white text-stone-900 shadow-xs border border-stone-200/80'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Truck className="w-4 h-4 text-amber-600" />
            <span>外送服務</span>
          </button>
        </div>

        {/* Mode-Specific Sub Inputs */}
        <div className="flex-1 flex flex-wrap items-center gap-3 bg-amber-50/60 p-2.5 rounded-xl border border-amber-100/80">
          {orderType === 'dine-in' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Table className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="text-xs font-bold text-stone-700 shrink-0">選擇桌號:</span>
              <select
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              >
                {['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'VIP包廂'].map((tbl) => (
                  <option key={tbl} value={tbl}>
                    {tbl} 桌
                  </option>
                ))}
              </select>
              <span className="text-xs text-stone-500 ml-1">掃碼坐定，桌邊入座</span>
            </div>
          )}

          {orderType === 'takeout' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Clock className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="text-xs font-bold text-stone-700 shrink-0">預計自取時間:</span>
              <select
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              >
                <option value="ASAP (約 15 分鐘)">儘快取餐 (約 15 分鐘)</option>
                <option value="30 分鐘後">30 分鐘後</option>
                <option value="45 分鐘後">45 分鐘後</option>
                <option value="1 小時後">1 小時後</option>
                <option value="18:30 晚餐時段">18:30 晚餐時段</option>
                <option value="19:00 晚餐時段">19:00 晚餐時段</option>
              </select>
            </div>
          )}

          {orderType === 'delivery' && (
            <div className="flex items-center gap-2 w-full">
              <MapPin className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="text-xs font-bold text-stone-700 shrink-0">外送地址:</span>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="請輸入完整外送地址 (例: 台北市信義區信義路五段7號10樓)"
                className="flex-1 bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
              <span className="text-[11px] text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md font-medium shrink-0">
                滿 $400 免運
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
