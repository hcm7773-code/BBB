import React, { useState } from 'react';
import { CartItem, OrderType, Order, PromoCode } from '../types';
import { X, CheckCircle, CreditCard, Smartphone, DollarSign, ShieldCheck, Truck, Utensils, Clock, Receipt } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  orderType: OrderType;
  tableNumber: string;
  pickupTime: string;
  deliveryAddress: string;
  appliedPromo: PromoCode | null;
  onOrderCreated: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  orderType,
  tableNumber,
  pickupTime,
  deliveryAddress,
  appliedPromo,
  onOrderCreated,
}) => {
  if (!isOpen) return null;

  const [customerName, setCustomerName] = useState('陳小明');
  const [customerPhone, setCustomerPhone] = useState('0912-345-678');
  const [invoiceCarrier, setInvoiceCarrier] = useState('/ABC1234');
  const [paymentMethod, setPaymentMethod] = useState<'linepay' | 'credit' | 'cash' | 'applepay' | 'jkopay'>('linepay');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculations
  const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const deliveryFee = orderType === 'delivery' ? (subtotal >= 400 || appliedPromo?.discountType === 'free_shipping' ? 0 : 40) : 0;
  const serviceFee = orderType === 'dine-in' ? Math.round(subtotal * 0.05) : 0;

  let discount = 0;
  if (appliedPromo) {
    if (appliedPromo.discountType === 'amount') discount = appliedPromo.discountValue;
    else if (appliedPromo.discountType === 'percentage') discount = Math.round(subtotal * (appliedPromo.discountValue / 100));
  }

  const grandTotal = Math.max(0, subtotal + deliveryFee + serviceFee - discount);

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const orderNum = `#A${Math.floor(1000 + Math.random() * 9000)}`;
      const newOrder: Order = {
        id: `ord_${Date.now()}`,
        orderNumber: orderNum,
        items: [...cartItems],
        orderType,
        tableNumber: orderType === 'dine-in' ? (tableNumber || 'A1') : undefined,
        pickupTime: orderType === 'takeout' ? (pickupTime || '約 15 分鐘') : undefined,
        deliveryAddress: orderType === 'delivery' ? (deliveryAddress || '台北市大安區新生南路一段1號') : undefined,
        customerName: customerName || '貴賓',
        customerPhone: customerPhone || '0900000000',
        subtotal,
        discount,
        deliveryFee,
        serviceFee,
        total: grandTotal,
        promoCodeApplied: appliedPromo?.code,
        paymentMethod,
        paymentStatus: paymentMethod === 'cash' ? 'unpaid' : 'paid',
        status: 'received',
        createdAt: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
        estimatedMinutes: 15,
      };

      setIsSubmitting(false);
      onOrderCreated(newOrder);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl overflow-hidden max-w-xl w-full my-8 shadow-2xl border border-stone-200 animate-scaleUp">
        
        {/* Header */}
        <div className="bg-stone-900 text-white p-5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold">確認結帳與配送資料</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmitOrder} className="p-5 sm:p-6 space-y-6">
          
          {/* Order Mode Info Summary */}
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-900">
              <span className="flex items-center gap-1.5">
                {orderType === 'dine-in' ? <Utensils className="w-4 h-4 text-amber-700" /> : orderType === 'takeout' ? <Clock className="w-4 h-4 text-amber-700" /> : <Truck className="w-4 h-4 text-amber-700" />}
                {orderType === 'dine-in' ? '內用點餐' : orderType === 'takeout' ? '外帶自取' : '外送服務'}
              </span>
              <span className="bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">
                預估完成時間: 15-20 分鐘
              </span>
            </div>

            <p className="text-xs text-stone-700">
              {orderType === 'dine-in' && `桌號: ${tableNumber || 'A1'} 桌 (現場桌邊服務)`}
              {orderType === 'takeout' && `取餐時間: ${pickupTime || '約 15 分鐘後'}`}
              {orderType === 'delivery' && `外送地址: ${deliveryAddress || '台北市大安區新生南路一段1號'}`}
            </p>
          </div>

          {/* Customer Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-stone-900 border-b pb-1">
              顧客聯絡資料
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  訂購人姓名 *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="請輸入姓名"
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  行動電話 (取餐/簡訊通知) *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0912345678"
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">
                雲端發票手機條碼載具 (選填)
              </label>
              <input
                type="text"
                value={invoiceCarrier}
                onChange={(e) => setInvoiceCarrier(e.target.value)}
                placeholder="/ABC1234"
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 uppercase"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-stone-900 border-b pb-1">
              選擇支付方式
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'linepay', name: 'LINE Pay', icon: '💚', desc: '即時掃碼支付' },
                { id: 'applepay', name: 'Apple Pay', icon: '🍎', desc: '快速指紋/面容認證' },
                { id: 'credit', name: '信用卡支付', icon: '💳', desc: 'VISA/MasterCard' },
                { id: 'jkopay', name: '街口支付', icon: '🔴', desc: '享街口幣回饋' },
                { id: 'cash', name: '現場現金支付', icon: '💵', desc: '到店/取餐時付現' },
              ].map((m) => {
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base">{m.icon}</span>
                      {isSelected && <CheckCircle className="w-4 h-4 text-amber-400" />}
                    </div>
                    <div className="mt-2">
                      <p className="font-bold text-xs">{m.name}</p>
                      <p className={`text-[10px] ${isSelected ? 'text-stone-300' : 'text-stone-400'}`}>
                        {m.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Itemized Total Summary Box */}
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs space-y-1.5">
            <div className="flex justify-between text-stone-600">
              <span>餐點總計 ({cartItems.length} 項)</span>
              <span>${subtotal}</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between text-stone-600">
                <span>外送服務費</span>
                <span>${deliveryFee}</span>
              </div>
            )}
            {serviceFee > 0 && (
              <div className="flex justify-between text-stone-600">
                <span>內用服務費</span>
                <span>${serviceFee}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between text-rose-600 font-semibold">
                <span>優惠折扣</span>
                <span>-${discount}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-stone-900 pt-2 border-t border-stone-300">
              <span>應付總額</span>
              <span className="text-amber-600 text-lg">${grandTotal}</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-stone-900 font-black text-base py-3.5 px-6 rounded-2xl shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-stone-900 border-t-transparent rounded-full animate-spin"></div>
                <span>訂單處理中，請稍候...</span>
              </div>
            ) : (
              <span>確認送出點餐・${grandTotal}</span>
            )}
          </button>

          <p className="text-[11px] text-center text-stone-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            金流安全加密傳輸・送出後可隨時即時查看廚房製作進度
          </p>

        </form>
      </div>
    </div>
  );
};
