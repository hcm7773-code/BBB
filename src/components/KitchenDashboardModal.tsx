import React, { useState } from 'react';
import { Order, OrderStatus, MenuItem } from '../types';
import { X, ChefHat, CheckCircle, Clock, AlertCircle, TrendingUp, DollarSign, Package, Power, Star, MessageSquare } from 'lucide-react';

interface KitchenDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  menuItems: MenuItem[];
  onToggleMenuItemAvailability: (id: string) => void;
}

export const KitchenDashboardModal: React.FC<KitchenDashboardModalProps> = ({
  isOpen,
  onClose,
  orders,
  onUpdateOrderStatus,
  menuItems,
  onToggleMenuItemAvailability,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'orders' | 'stock'>('orders');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'active' | 'all'>('active');

  // Today metrics
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalOrdersCount = orders.length;
  const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return o.status !== 'completed' && o.status !== 'cancelled';
    return o.status === filterStatus;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl overflow-hidden max-w-4xl w-full my-6 shadow-2xl border border-stone-200 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-stone-900 text-white p-5 flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-900 flex items-center justify-center font-black">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                店員與廚房 KDS 接單系統
                <span className="bg-amber-500 text-stone-900 text-xs px-2 py-0.5 rounded-full font-extrabold">
                  LIVE
                </span>
              </h2>
              <p className="text-xs text-stone-400">即時處理顧客線上點餐、控管餐點庫存與接單狀態</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Metrics Row */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-stone-100 border-b border-stone-200 shrink-0 text-xs">
          <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-2xs flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-stone-400">今日營業總額</p>
              <p className="text-lg font-black text-stone-900">${totalRevenue}</p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-2xs flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-100 text-orange-800">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-stone-400">累積點餐筆數</p>
              <p className="text-lg font-black text-stone-900">{totalOrdersCount} 筆</p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-2xs flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-stone-400">平均客單價</p>
              <p className="text-lg font-black text-stone-900">${avgOrderValue}</p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-stone-200 px-6 pt-3 bg-white shrink-0 gap-4 text-sm font-bold">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>即時接單看板 ({orders.filter(o => o.status !== 'completed').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('stock')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'stock'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>菜單上下架 / 售罄管理</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-stone-50 space-y-4">
          
          {/* TAB 1: ORDERS KDS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {/* Filter pills */}
              <div className="flex items-center gap-2 text-xs overflow-x-auto pb-1">
                {[
                  { id: 'active', label: '進行中訂單' },
                  { id: 'received', label: '待處理 (已接單)' },
                  { id: 'preparing', label: '烹調中' },
                  { id: 'ready', label: '待出餐' },
                  { id: 'completed', label: '已完成' },
                  { id: 'all', label: '全部訂單' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilterStatus(f.id as any)}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                      filterStatus === f.id
                        ? 'bg-stone-900 text-white'
                        : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Order Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredOrders.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-stone-400">
                    <p className="text-sm font-semibold">此分類目前沒有訂單</p>
                  </div>
                ) : (
                  filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex flex-col justify-between space-y-3"
                    >
                      {/* Top Bar */}
                      <div className="flex items-center justify-between border-b pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-stone-900 text-lg">
                            {order.orderNumber}
                          </span>
                          <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-md">
                            {order.orderType === 'dine-in' ? `內用 ${order.tableNumber}桌` : order.orderType === 'takeout' ? '外帶' : '外送'}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          {order.status === 'received' ? '待備餐' : order.status === 'preparing' ? '烹調中' : order.status === 'ready' ? '待出餐' : '已完成'}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="space-y-2 text-xs flex-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="bg-stone-50 p-2 rounded-xl border border-stone-100">
                            <div className="flex justify-between font-bold text-stone-900">
                              <span>{item.quantity}x {item.menuItem.name}</span>
                              <span>${item.totalPrice}</span>
                            </div>
                            {item.selectedOptions.length > 0 && (
                              <p className="text-[11px] text-stone-500 mt-0.5">
                                {item.selectedOptions.map((o) => o.optionName).join(', ')}
                              </p>
                            )}
                            {item.specialNotes && (
                              <p className="text-[11px] text-amber-700 font-semibold mt-0.5">
                                備註: {item.specialNotes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Customer Review if available */}
                      {order.review && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 space-y-1 text-xs">
                          <div className="flex items-center justify-between text-amber-900 font-bold">
                            <span className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                              顧客評價: {order.review.rating}.0 分
                            </span>
                            <span className="text-[10px] text-amber-700">{order.review.createdAt}</span>
                          </div>
                          {order.review.tags && order.review.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 py-0.5">
                              {order.review.tags.map((t) => (
                                <span key={t} className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                          {order.review.comment && (
                            <p className="text-[11px] text-stone-700 italic">“{order.review.comment}”</p>
                          )}
                        </div>
                      )}

                      {/* Bottom Controls */}
                      <div className="pt-2 border-t flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-stone-900">
                          總計: ${order.total}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {order.status === 'received' && (
                            <button
                              onClick={() => onUpdateOrderStatus(order.id, 'preparing')}
                              className="bg-amber-500 hover:bg-amber-600 text-stone-900 font-extrabold text-xs px-3 py-1.5 rounded-xl transition-all shadow-2xs"
                            >
                              開始烹調
                            </button>
                          )}
                          {order.status === 'preparing' && (
                            <button
                              onClick={() => onUpdateOrderStatus(order.id, 'ready')}
                              className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl transition-all shadow-2xs"
                            >
                              餐點出餐
                            </button>
                          )}
                          {order.status === 'ready' && (
                            <button
                              onClick={() => onUpdateOrderStatus(order.id, 'completed')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl transition-all shadow-2xs"
                            >
                              完成核銷
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: STOCK MANAGEMENT */}
          {activeTab === 'stock' && (
            <div className="space-y-3">
              <p className="text-xs text-stone-500">
                若食材耗盡，點擊「設為售罄」可立即於前台點餐畫面停售該品項：
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {menuItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-3 rounded-2xl border border-stone-200 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-xl object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-stone-900 text-xs truncate">
                          {item.name}
                        </h4>
                        <p className="text-[11px] text-amber-600 font-bold">
                          ${item.price}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onToggleMenuItemAvailability(item.id)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                        item.isAvailable
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      {item.isAvailable ? '設為售罄' : '恢復供應'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
