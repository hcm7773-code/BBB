export type OrderType = 'dine-in' | 'takeout' | 'delivery';

export type DietaryTag = 'popular' | 'spicy' | 'vegetarian' | 'recommended' | 'limited' | 'chef';

export type Category = 'all' | 'main' | 'combo' | 'side' | 'drink' | 'dessert' | 'special';

export interface OptionItem {
  id: string;
  name: string;
  price: number;
  isDefault?: boolean;
}

export interface CustomOptionGroup {
  id: string;
  title: string;
  required: boolean;
  maxSelect?: number; // 1 for radio, >1 for multi-select
  options: OptionItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: Category;
  image: string;
  tags: DietaryTag[];
  spicyLevel?: number; // 0 to 3
  calories?: number;
  prepTime?: string; // e.g. "10-15 分鐘"
  customOptionGroups?: CustomOptionGroup[];
  isAvailable: boolean;
}

export interface SelectedOption {
  groupId: string;
  groupTitle: string;
  optionId: string;
  optionName: string;
  price: number;
}

export interface CartItem {
  cartItemId: string;
  menuItem: MenuItem;
  quantity: number;
  selectedOptions: SelectedOption[];
  specialNotes?: string;
  unitPrice: number;
  totalPrice: number;
}

export type OrderStatus = 'received' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface OrderReview {
  rating: number; // 1 to 5 stars
  comment: string;
  createdAt: string;
  tags?: string[];
}

export interface Order {
  id: string;
  orderNumber: string;
  items: CartItem[];
  orderType: OrderType;
  tableNumber?: string;
  pickupTime?: string;
  deliveryAddress?: string;
  customerName: string;
  customerPhone: string;
  notes?: string;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  promoCodeApplied?: string;
  paymentMethod: 'linepay' | 'credit' | 'cash' | 'applepay' | 'jkopay';
  paymentStatus: 'paid' | 'unpaid';
  status: OrderStatus;
  createdAt: string;
  estimatedMinutes: number;
  review?: OrderReview;
}

export interface PromoCode {
  code: string;
  description: string;
  discountType: 'amount' | 'percentage' | 'free_shipping';
  discountValue: number;
  minSpend: number;
}
