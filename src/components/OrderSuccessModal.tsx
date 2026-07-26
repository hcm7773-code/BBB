import React, { useEffect } from 'react';
import { Order } from '../types';
import confetti from 'canvas-confetti';
import { CheckCircle2, Clock, MapPin, Receipt, ArrowRight, Utensils, PhoneCall, ExternalLink } from 'lucide-react';

interface OrderSuccessModalProps {
  order: Order | null;
  onClose: () => void;
  onOpenTracker: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({ order, onClose, onOpenTracker }) => {
  if (!order) return null;

  useEffect(() => {
    // Fire confetti on launch
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#f97316', '#10b981', '#3b82f6'],
      });
    } catch (e) {
      console.error(e);
    }
  }, [order]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl overflow-hidden max-w-md w-full shadow-2xl border border-stone-200 text-stone-800 p-6 sm:p-8 animate-scaleUp text-center space-y-6">
        
        {/* Animated Check Icon */}
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
          <CheckCircle2 className="w-12 h-12 stroke-[2.5] animate-pulse" />
        </div>

        <div>
          <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
            廚房已成功收到您的訂單！
          </span>
          <h2 className="text-2xl font-black text-stone-900 mt-2">
            點餐成功！
          </h2>
          <p className="text-stone-500 text-xs mt-1">
            訂單編號: <span className="font-mono font-bold text-stone-900 text-sm">{order.orderNumber}</span>
          </p>
        </div>

        {/* Order Info Card */}
        <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200/80 text-left text-xs space-y-2">
          <div className="flex justify-between items-center pb-2 border-b border-amber-200">
            <span className="font-bold text-amber-900 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              預估製作時間:
            </span>
            <span className="font-black text-amber-900 text-sm">約 {order.estimatedMinutes} 分鐘</span>
          </div>

          <div className="flex justify-between items-center text-stone-700">
            <span>用餐方式:</span>
            <span className="font-semibold">
              {order.orderType === 'dine-in' ? `內用 (${order.tableNumber} 桌)` : order.orderType === 'takeout' ? `外帶 (${order.pickupTime})` : `外送 (${order.deliveryAddress})`}
            </span>
          </div>

          <div className="flex justify-between items-center text-stone-700">
            <span>付款金額:</span>
            <span className="font-black text-amber-700 text-sm">${order.total} ({order.paymentMethod.toUpperCase()})</span>
          </div>
        </div>

        {/* Item Brief Summary */}
        <div className="text-left bg-stone-50 p-3.5 rounded-2xl border border-stone-200 text-xs space-y-1">
          <p className="font-bold text-stone-700 mb-1">餐點明細 ({order.items.length} 項):</p>
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-stone-600">
              <span className="truncate max-w-[220px]">
                {item.quantity}x {item.menuItem.name}
              </span>
              <span className="font-medium">${item.totalPrice}</span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={() => {
              onClose();
              onOpenTracker();
            }}
            className="w-full bg-gradient-to-r from-stone-900 to-stone-800 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
          >
            <span>即時查看廚房接單與製作進度</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs py-2.5 px-4 rounded-xl transition-all"
          >
            返回主菜單繼續瀏覽
          </button>
        </div>

      </div>
    </div>
  );
};
