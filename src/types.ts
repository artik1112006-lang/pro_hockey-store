export interface Category {
  id: number;
  name: string;
}

export interface Brand {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  categoryId: number;
  brandId?: number | null;
  hasSpecs?: boolean;
  handOptions?: string; // e.g. "Левый (Left), Правый (Right)"
  curveOptions?: string; // e.g. "P28, P29, P92, W03"
  variants?: string; // e.g. "Flex 65, Flex 75, Flex 85, Flex 100" or sizes
}

export interface CartItem {
  cartId: string;
  productId: number;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  selectedHand?: string;
  selectedCurve?: string;
  selectedVariant?: string;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  city?: string;
  comment?: string;
}

export interface Order {
  id: number;
  customerName: string;
  phone: string;
  city?: string;
  comment?: string;
  items: string; // Summary string for compatibility with original app
  detailedItems?: CartItem[];
  total: number;
  createdAt: string;
  status: 'новый' | 'в обработке' | 'выполнен';
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
}
