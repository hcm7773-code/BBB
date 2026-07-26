import React, { useState, useEffect } from 'react';
import { MenuItem, Category, DietaryTag, OrderType, CartItem, Order, OrderStatus, SelectedOption, PromoCode } from './types';
import { INITIAL_MENU_ITEMS } from './data/menuData';
import { Navbar } from './components/Navbar';
import { OrderTypeSelector } from './components/OrderTypeSelector';
import { CategoryNav } from './components/CategoryNav';
import { FoodCard } from './components/FoodCard';
import { FoodDetailModal } from './components/FoodDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { KitchenDashboardModal } from './components/KitchenDashboardModal';
import { AIRecommendWidget } from './components/AIRecommendWidget';
import { ShoppingBag, Utensils, Sparkles, Check, ChevronUp, AlertCircle, Phone, MapPin } from 'lucide-react';

export default function App() {
  // Menu Data State
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('tasty_menu_items');
    return saved ? JSON.parse(saved) : INITIAL_MENU_ITEMS;
  });

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('tasty_cart_items');
    return saved ? JSON.parse(saved) : [];
  });

  // Orders State (Pre-populate with sample orders if empty)
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('tasty_orders');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'ord_sample_1',
        orderNumber: '#A1088',
        items: [
          {
            cartItemId: 'sample_1',
            menuItem: INITIAL_MENU_ITEMS[0],
            quantity: 1,
            selectedOptions: [
              { groupId: 'spicy_level', groupTitle: '辣度選擇', optionId: 'spicy_mild', optionName: '微辣 🌶️', price: 0 },
              { groupId: 'main_addons', groupTitle: '美味加價購', optionId: 'add_egg', optionName: '溏心蛋 1顆', price: 20 },
            ],
            unitPrice: 240,
            totalPrice: 240,
          },
          {
            cartItemId: 'sample_2',
            menuItem: INITIAL_MENU_ITEMS[8], // 波霸鮮奶茶
            quantity: 1,
            selectedOptions: [
              { groupId: 'ice_level', groupTitle: '冰塊選擇', optionId: 'ice_less', optionName: '少冰 (7分)', price: 0 },
              { groupId: 'sugar_level', groupTitle: '甜度選擇', optionId: 'sugar_half', optionName: '半糖 (50%)', price: 0 },
            ],
            unitPrice: 70,
            totalPrice: 70,
          },
        ],
        orderType: 'dine-in',
        tableNumber: 'A1',
        customerName: '王大明',
        customerPhone: '0912-345-678',
        subtotal: 310,
        discount: 50,
        deliveryFee: 0,
        serviceFee: 15,
        total: 275,
        promoCodeApplied: 'TASTY50',
        paymentMethod: 'linepay',
        paymentStatus: 'paid',
        status: 'preparing',
        createdAt: '18:10',
        estimatedMinutes: 12,
      },
      {
        id: 'ord_sample_2',
        orderNumber: '#A1082',
        items: [
          {
            cartItemId: 'sample_3',
            menuItem: INITIAL_MENU_ITEMS[1], // 川味紅燒牛肉麵
            quantity: 1,
            selectedOptions: [
              { groupId: 'spicy_level', groupTitle: '辣度選擇', optionId: 'spicy_medium', optionName: '中辣 🌶️🌶️', price: 0 },
            ],
            unitPrice: 220,
            totalPrice: 220,
          },
        ],
        orderType: 'dine-in',
        tableNumber: 'B3',
        customerName: '李小姐',
        customerPhone: '0988-765-432',
        subtotal: 220,
        discount: 0,
        deliveryFee: 0,
        serviceFee: 10,
        total: 230,
        paymentMethod: 'credit',
        paymentStatus: 'paid',
        status: 'completed',
        createdAt: '17:20',
        estimatedMinutes: 0,
        review: {
          rating: 5,
          comment: '湯頭濃郁順口，牛肉燉得很軟嫩入味！出餐效率極佳，一定會再回訪！',
          createdAt: '17:55',
          tags: ['🍜 餐點極致美味', '⚡ 出餐迅速', '💰 CP值高物超所值'],
        },
      },
    ];
  });

  // Order Preferences
  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [tableNumber, setTableNumber] = useState<string>('A1');
  const [pickupTime, setPickupTime] = useState<string>('ASAP (約 15 分鐘)');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [selectedTag, setSelectedTag] = useState<DietaryTag | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals & Drawers
  const [selectedFoodItem, setSelectedFoodItem] = useState<MenuItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<Order | null>(null);
  const [isOrderTrackerOpen, setIsOrderTrackerOpen] = useState<boolean>(false);
  const [isKitchenOpen, setIsKitchenOpen] = useState<boolean>(false);
  const [isAIRecommendOpen, setIsAIRecommendOpen] = useState<boolean>(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('tasty_menu_items', JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem('tasty_cart_items', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('tasty_orders', JSON.stringify(orders));
  }, [orders]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Add Item to Cart
  const handleAddToCart = (
    item: MenuItem,
    quantity: number,
    selectedOptions: SelectedOption[],
    specialNotes: string
  ) => {
    const extraPrice = selectedOptions.reduce((sum, o) => sum + o.price, 0);
    const unitPrice = item.price + extraPrice;
    const totalPrice = unitPrice * quantity;

    const cartItemId = `${item.id}_${Date.now()}`;
    const newItem: CartItem = {
      cartItemId,
      menuItem: item,
      quantity,
      selectedOptions,
      specialNotes,
      unitPrice,
      totalPrice,
    };

    setCartItems((prev) => [...prev, newItem]);
    showToast(`已加入 ${quantity}x ${item.name} 到購物車！`);
  };

  const handleUpdateQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(cartItemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((i) =>
        i.cartItemId === cartItemId
          ? { ...i, quantity: newQty, totalPrice: i.unitPrice * newQty }
          : i
      )
    );
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Order created handler
  const handleOrderCreated = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    setLastCreatedOrder(newOrder);
    setCartItems([]);
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
    setIsSuccessModalOpen(true);
  };

  // Update order status (from tracker or kitchen)
  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    showToast(`訂單狀態已更新為：${newStatus === 'preparing' ? '烹調中' : newStatus === 'ready' ? '待出餐' : '已完成'}`);
  };

  // Submit order review
  const handleSubmitOrderReview = (
    orderId: string,
    rating: number,
    comment: string,
    tags: string[] = []
  ) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              review: {
                rating,
                comment,
                createdAt: timeStr,
                tags,
              },
            }
          : o
      )
    );
    showToast('🎉 感謝您的寶貴評價與用餐心得！');
  };

  // Toggle item availability (Out of Stock / In Stock)
  const handleToggleMenuItemAvailability = (itemId: string) => {
    setMenuItems((prev) =>
      prev.map((m) => (m.id === itemId ? { ...m, isAvailable: !m.isAvailable } : m))
    );
  };

  // Category counts
  const countsByCategory: Record<Category, number> = {
    all: menuItems.length,
    main: menuItems.filter((m) => m.category === 'main').length,
    combo: menuItems.filter((m) => m.category === 'combo').length,
    side: menuItems.filter((m) => m.category === 'side').length,
    drink: menuItems.filter((m) => m.category === 'drink').length,
    dessert: menuItems.filter((m) => m.category === 'dessert').length,
    special: menuItems.filter((m) => m.category === 'special').length,
  };

  // Filtered Menu Items
  const filteredMenuItems = menuItems.filter((item) => {
    // Category
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    // Tag
    if (selectedTag !== 'all' && !item.tags.includes(selectedTag)) return false;
    // Search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = item.name.toLowerCase().includes(term);
      const matchDesc = item.description.toLowerCase().includes(term);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  const cartTotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const activeOrdersCount = orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled').length;

  return (
    <div className="min-h-screen bg-stone-100 text-stone-800 font-sans antialiased selection:bg-amber-200 selection:text-amber-900 pb-20">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white font-bold text-xs px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 border border-stone-700 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        orderType={orderType}
        setOrderType={setOrderType}
        tableNumber={tableNumber}
        setTableNumber={setTableNumber}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenOrders={() => setIsOrderTrackerOpen(true)}
        onOpenKitchen={() => setIsKitchenOpen(true)}
        onOpenAIRecommend={() => setIsAIRecommendOpen(true)}
        activeOrdersCount={activeOrdersCount}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Dining Mode Selector & Sub Controls */}
        <OrderTypeSelector
          orderType={orderType}
          setOrderType={setOrderType}
          tableNumber={tableNumber}
          setTableNumber={setTableNumber}
          pickupTime={pickupTime}
          setPickupTime={setPickupTime}
          deliveryAddress={deliveryAddress}
          setDeliveryAddress={setDeliveryAddress}
        />

        {/* Category & Tag Filter Nav */}
        <CategoryNav
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedTag={selectedTag}
          setSelectedTag={setSelectedTag}
          countsByCategory={countsByCategory}
        />

        {/* Search status summary if searching */}
        {searchTerm && (
          <div className="mb-4 text-xs text-stone-500 flex items-center justify-between bg-white px-4 py-2 rounded-xl border border-stone-200">
            <span>
              搜尋 <b>「{searchTerm}」</b> 找到 <b>{filteredMenuItems.length}</b> 道餐點
            </span>
            <button
              onClick={() => setSearchTerm('')}
              className="text-amber-700 font-bold hover:underline"
            >
              顯示全部餐點
            </button>
          </div>
        )}

        {/* Menu Grid */}
        {filteredMenuItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 my-8 space-y-3">
            <Utensils className="w-12 h-12 mx-auto text-stone-300" />
            <h3 className="text-base font-bold text-stone-700">找不到符合條件的餐點</h3>
            <p className="text-xs text-stone-400">請嘗試清除關鍵字或切換其他菜單分類。</p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedTag('all');
                setSearchTerm('');
              }}
              className="mt-2 bg-stone-900 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-amber-600 transition-colors"
            >
              重設篩選條件
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredMenuItems.map((item) => (
              <FoodCard
                key={item.id}
                item={item}
                onSelectItem={(food) => setSelectedFoodItem(food)}
              />
            ))}
          </div>
        )}

      </main>

      {/* Floating Bottom Cart Bar for Mobile */}
      {cartCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 sm:hidden">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-gradient-to-r from-stone-900 to-stone-800 text-white font-extrabold p-3.5 rounded-2xl shadow-xl border border-stone-700 flex items-center justify-between active:scale-98 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="relative bg-amber-500 text-stone-900 p-2 rounded-xl">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 bg-stone-900 text-white font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center border border-amber-500">
                  {cartCount}
                </span>
              </div>
              <div className="text-left">
                <p className="text-xs text-stone-300">購物車小計</p>
                <p className="text-base font-black text-amber-400">${cartTotal}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-amber-500 text-stone-900 px-3.5 py-1.5 rounded-xl text-xs font-bold">
              <span>結帳</span>
              <ChevronUp className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Modals & Slide-over Panels */}
      <FoodDetailModal
        item={selectedFoodItem}
        onClose={() => setSelectedFoodItem(null)}
        onAddToCart={handleAddToCart}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        orderType={orderType}
        tableNumber={tableNumber}
        appliedPromo={appliedPromo}
        setAppliedPromo={setAppliedPromo}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        orderType={orderType}
        tableNumber={tableNumber}
        pickupTime={pickupTime}
        deliveryAddress={deliveryAddress}
        appliedPromo={appliedPromo}
        onOrderCreated={handleOrderCreated}
      />

      <OrderSuccessModal
        order={lastCreatedOrder}
        onClose={() => setIsSuccessModalOpen(false)}
        onOpenTracker={() => setIsOrderTrackerOpen(true)}
      />

      <OrderTrackerModal
        isOpen={isOrderTrackerOpen}
        onClose={() => setIsOrderTrackerOpen(false)}
        orders={orders}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onSubmitReview={handleSubmitOrderReview}
      />

      <KitchenDashboardModal
        isOpen={isKitchenOpen}
        onClose={() => setIsKitchenOpen(false)}
        orders={orders}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        menuItems={menuItems}
        onToggleMenuItemAvailability={handleToggleMenuItemAvailability}
      />

      <AIRecommendWidget
        isOpen={isAIRecommendOpen}
        onClose={() => setIsAIRecommendOpen(false)}
        menuItems={menuItems}
        orderType={orderType}
        onSelectItemByName={(name) => {
          const found = menuItems.find((m) => m.name.includes(name));
          if (found) setSelectedFoodItem(found);
        }}
      />

    </div>
  );
}
