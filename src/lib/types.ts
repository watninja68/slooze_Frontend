
export type Role = "ADMIN" | "MANAGER" | "MEMBER";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  region?: string; // For MANAGER and MEMBER
  avatarUrl?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  category: string; // e.g., Appetizers, Main Courses, Desserts, Drinks
}

export interface MenuSection {
  id: string;
  name: string; // e.g. "Appetizers", "Main Courses"
  items: MenuItem[];
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  cuisine: string;
  region: string; // Used for RBAC filtering
  imageUrl?: string;
  rating?: number; // Optional: 1-5 stars
  menu: MenuSection[];
  dataAiHint?: string;
}

export interface OrderItem {
  menuItemId: string;
  name: string; // Copied from MenuItem for historical record
  quantity: number;
  price: number; // Price per item at time of order
}

export type OrderStatus =
  | "PENDING_CONFIRMATION"
  | "CONFIRMED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export interface Order {
  id: string;
  userId: string;
  userName?: string; // For display purposes
  restaurantId: string;
  restaurantName?: string; // For display purposes
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  orderDate: string; // ISO string
  deliveryAddress: string;
  notes?: string;
}

export interface PaymentMethod {
  id: string;
  type: "Credit Card" | "PayPal" | "Google Pay"; // Example types
  last4?: string; // For credit cards
  email?: string; // For PayPal/others
  isPrimary: boolean;
}
