import type {
  Restaurant,
  User,
  Order,
  Role,
  OrderStatus,
  PaymentMethod,
  MenuItem,
  MenuSection,
} from "./types";

export const mockUsers: User[] = [
  {
    // Admin
    id: "user-nick-fury",
    name: "Nick Fury", // [cite: 1]
    email: "nick.fury@slooze.xyz", // Using consistent email domain
    role: "ADMIN",
    avatarUrl: "https://placehold.co/100x100.png",
    // Region not specified for Admin, implying org-wide access
  },
  {
    // Manager-India
    id: "user-captain-marvel",
    name: "Captain Marvel", // [cite: 1]
    email: "captain.marvel@slooze.xyz",
    role: "MANAGER",
    region: "India", // [cite: 1]
    avatarUrl: "https://placehold.co/100x100.png",
  },
  {
    // Manager-America
    id: "user-captain-america",
    name: "Captain America", // [cite: 2]
    email: "captain.america@slooze.xyz",
    role: "MANAGER",
    region: "America", // [cite: 2]
    avatarUrl: "https://placehold.co/100x100.png",
  },
  {
    // Team Member-India
    id: "user-thanos",
    name: "Thanos", // [cite: 1]
    email: "thanos@slooze.xyz",
    role: "MEMBER",
    region: "India", // [cite: 1]
    avatarUrl: "https://placehold.co/100x100.png",
  },
  {
    // Team Member - India
    id: "user-thor",
    name: "Thor", // [cite: 1]
    email: "thor@slooze.xyz",
    role: "MEMBER",
    region: "India", // [cite: 1]
    avatarUrl: "https://placehold.co/100x100.png",
  },
  {
    // Team Member-America
    id: "user-travis",
    name: "Travis", // [cite: 3]
    email: "travis@slooze.xyz",
    role: "MEMBER",
    region: "America", // [cite: 3]
    avatarUrl: "https://placehold.co/100x100.png",
  },
];
const sampleMenuItems: MenuItem[] = [
  {
    id: "item-1",
    name: "Margherita Pizza",
    description: "Classic cheese and tomato pizza.",
    price: 12.99,
    category: "Main Courses",
    imageUrl: "https://placehold.co/300x200.png",
  },
  {
    id: "item-2",
    name: "Caesar Salad",
    description: "Fresh romaine lettuce with Caesar dressing.",
    price: 8.5,
    category: "Appetizers",
    imageUrl: "https://placehold.co/300x200.png",
  },
  {
    id: "item-3",
    name: "Spaghetti Carbonara",
    description: "Creamy pasta with bacon and egg.",
    price: 15.0,
    category: "Main Courses",
    imageUrl: "https://placehold.co/300x200.png",
  },
  {
    id: "item-4",
    name: "Tiramisu",
    description: "Coffee-flavored Italian dessert.",
    price: 7.0,
    category: "Desserts",
    imageUrl: "https://placehold.co/300x200.png",
  },
  {
    id: "item-5",
    name: "Lemonade",
    description: "Freshly squeezed lemonade.",
    price: 3.5,
    category: "Drinks",
    imageUrl: "https://placehold.co/300x200.png",
  },
  {
    id: "item-6",
    name: "Bruschetta",
    description:
      "Grilled bread rubbed with garlic and topped with olive oil and salt.",
    price: 6.5,
    category: "Appetizers",
    imageUrl: "https://placehold.co/300x200.png",
  },
  {
    id: "item-7",
    name: "Grilled Salmon",
    description: "Served with asparagus and lemon butter sauce.",
    price: 18.99,
    category: "Main Courses",
    imageUrl: "https://placehold.co/300x200.png",
  },
  {
    id: "item-8",
    name: "Chocolate Lava Cake",
    description: "Warm chocolate cake with a gooey center.",
    price: 7.5,
    category: "Desserts",
    imageUrl: "https://placehold.co/300x200.png",
  },
];

const groupItemsByCategory = (items: MenuItem[]): MenuSection[] => {
  const categories = Array.from(new Set(items.map((item) => item.category)));
  return categories.map((category, index) => ({
    id: `section-${index + 1}`,
    name: category,
    items: items.filter((item) => item.category === category),
  }));
};

export const mockRestaurants: Restaurant[] = [
  {
    id: "rest-1",
    name: "Bella Italia",
    address: "123 Main St, Northtown",
    cuisine: "Italian",
    region: "North",
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "italian food",
    rating: 4.5,
    menu: groupItemsByCategory(sampleMenuItems.slice(0, 4)),
  },
  {
    id: "rest-2",
    name: "Sushi World",
    address: "456 Oak Ave, Southville",
    cuisine: "Japanese",
    region: "South",
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "sushi platter",
    rating: 4.2,
    menu: groupItemsByCategory(sampleMenuItems.slice(2, 6)),
  },
  {
    id: "rest-3",
    name: "Burger Hub",
    address: "789 Pine Ln, Northtown",
    cuisine: "American",
    region: "North",
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "gourmet burger",
    rating: 4.0,
    menu: groupItemsByCategory(sampleMenuItems.slice(4, 8)),
  },
  {
    id: "rest-4",
    name: "Taco Fiesta",
    address: "101 Maple Dr, Westcity",
    cuisine: "Mexican",
    region: "West", // Admin can see this, others might not based on region
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "tacos variety",
    rating: 4.8,
    menu: groupItemsByCategory(sampleMenuItems.slice(0, 5).reverse()),
  },
];

export const mockOrders: Order[] = [
  {
    id: "order-1",
    userId: "user-member-north",
    userName: "Member North",
    restaurantId: "rest-1",
    restaurantName: "Bella Italia",
    items: [
      {
        menuItemId: "item-1",
        name: "Margherita Pizza",
        quantity: 1,
        price: 12.99,
      },
      { menuItemId: "item-5", name: "Lemonade", quantity: 2, price: 3.5 },
    ],
    totalAmount: 19.99,
    status: "DELIVERED",
    orderDate: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    deliveryAddress: "10 North Pole, Northtown",
    notes: "Extra cheese on pizza.",
  },
  {
    id: "order-2",
    userId: "user-member-south",
    userName: "Member South",
    restaurantId: "rest-2",
    restaurantName: "Sushi World",
    items: [
      // For demo purposes, this item is from the general sample menu, not specifically Sushi World's filtered menu.
      // In a real app, ensure item IDs match the specific restaurant's menu.
      {
        menuItemId:
          sampleMenuItems.find((item) => item.name === "Spaghetti Carbonara")
            ?.id || "item-3",
        name: "Spaghetti Carbonara",
        quantity: 1,
        price: 15.0,
      },
    ],
    totalAmount: 15.0,
    status: "PREPARING",
    orderDate: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    deliveryAddress: "20 South Bay, Southville",
  },
  {
    id: "order-3",
    userId: "user-admin", // Admin's own order
    userName: "Admin User",
    restaurantId: "rest-4",
    restaurantName: "Taco Fiesta",
    items: [
      {
        menuItemId: sampleMenuItems[0].id,
        name: sampleMenuItems[0].name,
        quantity: 2,
        price: sampleMenuItems[0].price,
      },
      {
        menuItemId: sampleMenuItems[1].id,
        name: sampleMenuItems[1].name,
        quantity: 1,
        price: sampleMenuItems[1].price,
      },
    ],
    totalAmount: sampleMenuItems[0].price * 2 + sampleMenuItems[1].price,
    status: "PENDING_CONFIRMATION",
    orderDate: new Date().toISOString(),
    deliveryAddress: "Admin HQ, Universal City",
    notes: "No spicy sauce please.",
  },
];

export const mockPaymentMethods: PaymentMethod[] = [
  { id: "pm-1", type: "Credit Card", last4: "4242", isPrimary: true },
  { id: "pm-2", type: "PayPal", email: "admin@slloze.com", isPrimary: false },
];
