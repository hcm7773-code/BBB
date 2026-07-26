import React, { useState } from 'react';
import { CartItem, OrderType, PromoCode } from '../types';
import { PROMO_CODES } from '../data/promos';
import { X, Trash2, Plus, Minus, Tag, ArrowRight, ShoppingBag, Utensils, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (cartItemId: string, newQty: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  orderType: OrderType;
  tableNumber: string;
  appliedPromo: PromoCode | null;
  setAppliedPromo: (promo: PromoCode | null) => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  orderType,
  tableNumber,
  appliedPromo,
  setAppliedPromo,
  onProceedToCheckout,
}) => {
  if (!isOpen) return null;

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');

  // Calculations
  const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);

  // Delivery fee calculation
  const deliveryFee = orderType === 'delivery' ? (subtotal >= 400 || appliedPromo?.discountType === 'free_shipping' ? 0 : 40) : 0;

  // Service fee (e.g. 5% for dine-in)
  const serviceFee = orderType === 'dine-in' ? Math.round(subtotal * 0.05) : 0;

  // Promo Discount Calculation
  let discount = 0;
  if (appliedPromo) {
    if (appliedPromo.discountType === 'amount') {
      discount = appliedPromo.discountValue;
    } else if (appliedPromo.discountType === 'percentage') {
      discount = Math.round(subtotal * (appliedPromo.discountValue / 100));
    } else if (appliedPromo.discountType === 'free_shipping') {
      discount = 0; // Handled in deliveryFee calculation
    }
  }

  const grandTotal = Math.max(0, subtotal + deliveryFee + serviceFee - discount);

  const handleApplyPromo = () => {
    setPromoError('');
    setPromoSuccess('');
    const codeUpper = promoInput.trim().toUpperCase();
    const found = PROMO_CODES.find((p) => p.code === codeUpper);

    if (!found) {
      setPromoError('無效的折扣碼，請重新輸入 (試試 TASTY50)');
      return;
    }

    if (subtotal < found.minSpend) {
      setPromoError(`此優惠碼需消費滿 $${found.minSpend} 才能使用`);
      return;
    }

    setAppliedPromo(found);
    setPromoSuccess(`折扣碼已成功套用: ${found.description}`);
    setPromoInput('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-4 sm:p-5 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold">點餐購物車</h2>
              <span className="bg-amber-500 text-stone-900 text-xs font-bold px-2 py-0.5 rounded-full">
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)} 項
              </span>
            </div>
            <div className="flex items-center gap-2">
              {cartItems.length > 0 && (
                <button
                  onClick={onClearCart}
                  className="text-xs text-stone-400 hover:text-rose-400 px-2 py-1 transition-colors"
                >
                  清空購物車
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mode Indicator Banner */}
          <div className="bg-amber-50 px-4 py-2.5 border-b border-amber-100 flex items-center justify-between text-xs text-stone-700">
            <span className="font-semibold text-amber-900 flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-amber-600" />
              就餐模式: {orderType === 'dine-in' ? `內用 (${tableNumber || 'A1'} 桌)` : orderType === 'takeout' ? '外帶自取' : '外送服務'}
            </span>
            <span className="text-stone-500 text-[11px]">可於主選單切換</span>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400 space-y-3">
                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-300">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <p className="text-sm font-semibold text-stone-600">購物車目前是空的</p>
                <p className="text-xs text-stone-400 max-w-xs">
                  點擊菜單上的「選購規格」或「點餐」按鈕將美味餐點加入購物車！
                </p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.cartItemId}
                  className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200/80 flex gap-3 relative group"
                >
                  <img
                    src={item.menuItem.image}
                    alt={item.menuItem.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-xl object-cover shrink-0"
                  />

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-bold text-stone-900 text-sm">
                          {item.menuItem.name}
                        </h4>
                        <button
                          onClick={() => onRemoveItem(item.cartItemId)}
                          className="text-stone-400 hover:text-rose-500 p-1"
                          title="移除品項"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Selected Options Summary */}
                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <div className="text-[11px] text-stone-500 mt-1 flex flex-wrap gap-1">
                          {item.selectedOptions.map((opt, idx) => (
                            <span
                              key={idx}
                              className="bg-white border border-stone-200 px-1.5 py-0.5 rounded-md"
                            >
                              {opt.optionName} {opt.price > 0 ? `(+$${opt.price})` : ''}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Special Remarks */}
                      {item.specialNotes && (
                        <p className="text-[11px] text-amber-700 mt-1 italic">
                          ✍️ 備註: {item.specialNotes}
                        </p>
                      )}
                    </div>

                    {/* Price & Quantity Controls */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-200/60">
                      <span className="font-black text-amber-600 text-sm">
                        ${item.totalPrice}
                      </span>

                      <div className="flex items-center gap-2 bg-white rounded-lg border border-stone-200 px-1 py-0.5">
                        <button
                          onClick={() => onUpdateQuantity(item.cartItemId, item.quantity - 1)}
                          className="w-6 h-6 rounded flex items-center justify-center text-stone-600 hover:bg-stone-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-bold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
                          className="w-6 h-6 rounded flex items-center justify-center text-stone-600 hover:bg-stone-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Promo Code Input & Summary Footer */}
          {cartItems.length > 0 && (
            <div className="p-4 bg-stone-50 border-t border-stone-200 space-y-3 shrink-0">
              
              {/* Promo Input */}
              <div className="space-y-1">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder="輸入優惠碼 (例: TASTY50)"
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 uppercase"
                    />
                  </div>
                  <button
                    onClick={handleApplyPromo}
                    className="bg-stone-900 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl hover:bg-amber-600 transition-colors"
                  >
                    套用
                  </button>
                </div>

                {promoError && (
                  <p className="text-[11px] text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {promoError}
                  </p>
                )}

                {appliedPromo && (
                  <div className="flex items-center justify-between text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1.5 rounded-xl">
                    <span className="font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      優惠：{appliedPromo.code} ({appliedPromo.description})
                    </span>
                    <button
                      onClick={() => setAppliedPromo(null)}
                      className="text-emerald-700 hover:text-rose-600 text-xs underline"
                    >
                      取消
                    </button>
                  </div>
                )}
              </div>

              {/* Order Cost Breakdown */}
              <div className="space-y-1.5 text-xs text-stone-600 pt-2 border-t border-stone-200/80">
                <div className="flex justify-between">
                  <span>小計 Subtotal</span>
                  <span className="font-semibold text-stone-900">${subtotal}</span>
                </div>

                {orderType === 'dine-in' && (
                  <div className="flex justify-between text-stone-500">
                    <span>內用服務費 (5%)</span>
                    <span>${serviceFee}</span>
                  </div>
                )}

                {orderType === 'delivery' && (
                  <div className="flex justify-between">
                    <span>外送運費</span>
                    <span>
                      {deliveryFee === 0 ? (
                        <span className="text-emerald-600 font-bold">免費</span>
                      ) : (
                        `$${deliveryFee}`
                      )}
                    </span>
                  </div>
                )}

                {discount > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>優惠券折抵</span>
                    <span>-${discount}</span>
                  </div>
                )}

                <div className="flex justify-between text-base font-black text-stone-900 pt-2 border-t border-stone-300">
                  <span>實付總金額</span>
                  <span className="text-amber-600 text-lg">${grandTotal}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={onProceedToCheckout}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-stone-900 font-extrabold text-sm py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <span>前往結帳單</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
