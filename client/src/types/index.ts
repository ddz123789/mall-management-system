export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  avatar?: string;
  status: string;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  parentId?: number;
  parent?: Category;
  children?: Category[];
  sort: number;
  createdAt: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  images: string;
  categoryId: number;
  category?: Category;
  stock: number;
  sales: number;
  status: string;
  createdAt: string;
  reviews?: Review[];
}

export interface CartItem {
  id: number;
  userId: number;
  productId: number;
  product: Product;
  quantity: number;
  createdAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  product: Product;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  orderNo: string;
  userId: number;
  user?: User;
  totalAmount: number;
  status: string;
  address: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  items?: OrderItem[];
  logistics?: Logistics;
  reviews?: Review[];
}

export interface Review {
  id: number;
  userId: number;
  user?: User;
  productId: number;
  product?: Product;
  orderId?: number;
  rating: number;
  content?: string;
  images: string;
  createdAt: string;
}

export interface Coupon {
  id: number;
  name: string;
  type: string;
  value: number;
  minAmount: number;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
}

export interface UserCoupon {
  id: number;
  userId: number;
  couponId: number;
  coupon: Coupon;
  status: string;
  usedAt?: string;
}

export interface Logistics {
  id: number;
  orderId: number;
  order?: Order;
  company: string;
  trackingNo: string;
  status: string;
  records: string;
  createdAt: string;
}

export interface InventoryLog {
  id: number;
  productId: number;
  product?: Product;
  quantity: number;
  type: string;
  remark?: string;
  createdAt: string;
}

export interface PaginatedResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DashboardStats {
  userCount: number;
  productCount: number;
  orderCount: number;
  pendingOrders: number;
  totalSales: number;
}

export interface SalesTrend {
  date: string;
  amount: number;
  count: number;
}
