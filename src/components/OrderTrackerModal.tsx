import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import { X, Clock, CheckCircle2, ChefHat, PackageCheck, Utensils, Printer, RefreshCw, Star, MessageSquare, Send, Edit3, Sparkles } from 'lucide-react';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onSubmitReview: (orderId: string, rating: number, comment: string, tags?: string[]) => void;
}

const STATUS_STEPS: { status: OrderStatus; label: string; desc: string; icon: React.ReactNode }[] = [
  { status: 'received', label: '已接單', desc: '系統已轉交至門市廚房', icon: <Utensils className="w-4 h-4" /> },
  { status: 'preparing', label: '製作中', desc: '主廚用心料理美味餐點中', icon: <ChefHat className="w-4 h-4" /> },
  { status: 'ready', label: '待出餐/取餐', desc: '餐點完成，請至櫃檯或桌邊', icon: <PackageCheck className="w-4 h-4" /> },
  { status: 'completed', label: '已完成', desc: '祝您用餐愉快！', icon: <CheckCircle2 className="w-4 h-4" /> },
];

const QUICK_TAG_OPTIONS = [
  '🍜 餐點極致美味',
  '⚡ 出餐迅速',
  '✨ 包裝衛生乾淨',
  '❤️ 服務親切打動人心',
  '💰 CP值高物超所值',
];

const RATING_LABELS: Record<number, string> = {
  1: '1分 - 不太滿意',
  2: '2分 - 尚有改善空間',
  3: '3分 - 普通平實',
  4: '4分 - 滿意值得推薦',
  5: '5分 - 極致美味！極力推薦',
};

interface OrderReviewSectionProps {
  order: Order;
  onSubmitReview: (orderId: string, rating: number, comment: string, tags?: string[]) => void;
}

const OrderReviewSection: React.FC<OrderReviewSectionProps> = ({ order, onSubmitReview }) => {
  const existingReview = order.review;
  const [isEditing, setIsEditing] = useState<boolean>(!existingReview);
  const [rating, setRating] = useState<number>(existingReview ? existingReview.rating : 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>(existingReview ? existingReview.comment : '');
  const [selectedTags, setSelectedTags] = useState<string[]>(existingReview?.tags || []);

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) return;
    onSubmitReview(order.id, rating, comment, selectedTags);
    setIsEditing(false);
  };

  // If already reviewed and not currently editing:
  if (existingReview && !isEditing) {
    return (
      <div className="bg-gradient-to-r from-amber-50 to-orange-50/50 rounded-2xl p-4 border border-amber-200/80 space-y-3 animate-fadeIn">
        <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-amber-500">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= existingReview.rating
                      ? 'fill-amber-400 text-amber-500'
                      : 'text-stone-300'
                  }`}
                />
              ))}
            </div>
            <span className="font-extrabold text-stone-900 text-sm">
              {existingReview.rating}.0
            </span>
            <span className="text-xs text-amber-800/80 font-medium bg-amber-100 px-2 py-0.5 rounded-full">
              已完成評價
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-stone-400">{existingReview.createdAt}</span>
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 bg-white border border-stone-200 px-2.5 py-1 rounded-lg transition-all shadow-2xs"
            >
              <Edit3 className="w-3 h-3 text-amber-600" />
              <span>修改評價</span>
            </button>
          </div>
        </div>

        {/* Tags */}
        {existingReview.tags && existingReview.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {existingReview.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-medium bg-amber-100/80 text-amber-900 px-2.5 py-0.5 rounded-md border border-amber-200/60"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Comment */}
        {existingReview.comment ? (
          <div className="bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-amber-200/50 text-xs text-stone-700 italic flex items-start gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-normal">“{existingReview.comment}”</span>
          </div>
        ) : (
          <p className="text-xs text-stone-400 italic">無填寫文字心得</p>
        )}
      </div>
    );
  }

  // Review Form
  return (
    <form
      onSubmit={handleSubmit}
      className="bg-stone-900 text-white rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg border border-stone-800 animate-fadeIn"
    >
      <div className="flex items-center justify-between border-b border-stone-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-stone-100">
              {existingReview ? '修改用餐心得與評分' : '享用完畢！請給予滿意度評分與心得'}
            </h4>
            <p className="text-[11px] text-stone-400">您的意見是廚房團隊進步的最佳動力</p>
          </div>
        </div>

        {existingReview && (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-xs text-stone-400 hover:text-stone-200 underline"
          >
            取消修改
          </button>
        )}
      </div>

      {/* Interactive Stars */}
      <div className="space-y-1.5">
        <label className="text-xs text-stone-300 font-medium block">點擊星級評分：</label>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = star <= (hoverRating || rating);
              return (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 text-stone-600 hover:scale-125 transition-transform focus:outline-none"
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      active
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-stone-600'
                    }`}
                  />
                </button>
              );
            })}
          </div>
          <span className="text-xs font-bold text-amber-400 pl-2">
            {RATING_LABELS[hoverRating || rating]}
          </span>
        </div>
      </div>

      {/* Quick Tag Pills */}
      <div className="space-y-1.5">
        <label className="text-xs text-stone-300 font-medium block">快速心得標籤（可多選）：</label>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_TAG_OPTIONS.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => handleToggleTag(tag)}
                className={`text-xs px-2.5 py-1 rounded-xl transition-all border ${
                  isSelected
                    ? 'bg-amber-500 text-stone-950 font-bold border-amber-400'
                    : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dining Comment Text Area */}
      <div className="space-y-1.5">
        <label className="text-xs text-stone-300 font-medium block">用餐心得評語：</label>
        <textarea
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="分享美味餐點感受、口味偏好，或是給主廚的鼓勵與建議..."
          className="w-full bg-stone-800 border border-stone-700 rounded-xl p-3 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all resize-none"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
      >
        <Send className="w-3.5 h-3.5" />
        <span>{existingReview ? '更新用餐心得評分' : '送出用餐心得評分'}</span>
      </button>
    </form>
  );
};

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  orders,
  onUpdateOrderStatus,
  onSubmitReview,
}) => {
  if (!isOpen) return null;

  const handlePrintReceipt = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>饗點 TastyBite - 銷貨明細收據 ${order.orderNumber}</title>
          <style>
            body { font-family: monospace; padding: 20px; max-width: 320px; margin: 0 auto; }
            h2 { text-align: center; margin-bottom: 5px; }
            .center { text-align: center; font-size: 12px; margin-bottom: 15px; }
            .line { border-top: 1px dashed #000; margin: 10px 0; }
            .row { display: flex; justify-content: space-between; font-size: 13px; margin: 4px 0; }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>饗點 TastyBite</h2>
          <div class="center">
            台北市大安區美食街 88 號<br/>
            單號: ${order.orderNumber} | ${order.createdAt}<br/>
            類型: ${order.orderType === 'dine-in' ? `內用 ${order.tableNumber} 桌` : order.orderType === 'takeout' ? '外帶自取' : '外送'}
          </div>
          <div class="line"></div>
          ${order.items.map(i => `
            <div class="row">
              <span>${i.quantity}x ${i.menuItem.name}</span>
              <span>$${i.totalPrice}</span>
            </div>
            ${i.selectedOptions.map(o => `<div class="row" style="font-size:11px; color:#555; padding-left:10px;">+ ${o.optionName}</div>`).join('')}
          `).join('')}
          <div class="line"></div>
          <div class="row"><span>小計:</span><span>$${order.subtotal}</span></div>
          ${order.discount ? `<div class="row"><span>折扣:</span><span>-$${order.discount}</span></div>` : ''}
          <div class="row bold" style="font-size:15px;"><span>總計:</span><span>$${order.total}</span></div>
          <div class="line"></div>
          <div class="center">感謝您的蒞臨與支持！</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full my-8 shadow-2xl border border-stone-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-stone-900 text-white p-5 flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold">即時訂單追蹤與歷史紀錄</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Orders Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-8 flex-1">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-stone-400 space-y-3">
              <Clock className="w-12 h-12 mx-auto text-stone-300" />
              <p className="text-sm font-semibold text-stone-600">目前尚無進行中的訂單</p>
              <p className="text-xs text-stone-400">點餐送出後即可在此即時追蹤廚房接單與製作進度。</p>
            </div>
          ) : (
            orders.map((order) => {
              const currentStepIndex = STATUS_STEPS.findIndex((s) => s.status === order.status);

              return (
                <div
                  key={order.id}
                  className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-5"
                >
                  {/* Order Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/80 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-stone-900 text-base">
                          {order.orderNumber}
                        </span>
                        <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-md">
                          {order.orderType === 'dine-in' ? `內用 ${order.tableNumber} 桌` : order.orderType === 'takeout' ? `外帶 (${order.pickupTime})` : '外送'}
                        </span>
                        <span className="text-xs text-stone-400">{order.createdAt}</span>
                      </div>
                      <p className="text-xs text-stone-500 mt-1">
                        顧客: {order.customerName} ({order.customerPhone})
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePrintReceipt(order)}
                        className="flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 bg-white border border-stone-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>列印明細</span>
                      </button>

                      {/* Demo Simulate next state button */}
                      {order.status !== 'completed' && (
                        <button
                          onClick={() => {
                            const nextStatus: OrderStatus =
                              order.status === 'received'
                                ? 'preparing'
                                : order.status === 'preparing'
                                ? 'ready'
                                : 'completed';
                            onUpdateOrderStatus(order.id, nextStatus);
                          }}
                          className="flex items-center gap-1 text-xs text-amber-800 bg-amber-100 hover:bg-amber-200 font-bold px-3 py-1.5 rounded-xl transition-all"
                          title="展示示範: 手動推進至下一階段"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>推進進度</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Status Timeline Progress Bar */}
                  <div className="py-2">
                    <div className="grid grid-cols-4 gap-2 relative">
                      {STATUS_STEPS.map((step, idx) => {
                        const isDone = idx <= currentStepIndex;
                        const isCurrent = idx === currentStepIndex;

                        return (
                          <div key={step.status} className="flex flex-col items-center text-center space-y-1.5">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                                isDone
                                  ? isCurrent
                                    ? 'bg-amber-500 text-stone-900 ring-4 ring-amber-200 font-bold scale-110'
                                    : 'bg-stone-900 text-white'
                                  : 'bg-stone-200 text-stone-400'
                              }`}
                            >
                              {step.icon}
                            </div>
                            <span className={`text-xs font-bold ${isDone ? 'text-stone-900' : 'text-stone-400'}`}>
                              {step.label}
                            </span>
                            <span className="text-[10px] text-stone-400 hidden sm:block">
                              {step.desc}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Itemized summary */}
                  <div className="bg-white p-3.5 rounded-xl border border-stone-200 text-xs space-y-1.5">
                    <div className="font-bold text-stone-800 pb-1 border-b border-stone-100 flex justify-between">
                      <span>餐點項目</span>
                      <span>金額</span>
                    </div>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-stone-600">
                        <span>
                          {item.quantity}x {item.menuItem.name}
                          {item.selectedOptions.length > 0 && (
                            <span className="text-stone-400 text-[11px] block pl-2">
                              {item.selectedOptions.map((o) => o.optionName).join(', ')}
                            </span>
                          )}
                        </span>
                        <span className="font-medium">${item.totalPrice}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-stone-100 flex justify-between font-black text-stone-900 text-sm">
                      <span>實付總金額 ({order.paymentMethod.toUpperCase()} 已付款)</span>
                      <span className="text-amber-600">${order.total}</span>
                    </div>
                  </div>

                  {/* Review Module (Shown when order status is 'completed') */}
                  {order.status === 'completed' && (
                    <OrderReviewSection
                      order={order}
                      onSubmitReview={onSubmitReview}
                    />
                  )}

                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};

