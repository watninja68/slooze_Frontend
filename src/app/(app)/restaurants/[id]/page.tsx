
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Restaurant, MenuItem, OrderItem, Order, User } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { mockRestaurants, mockOrders as globalMockOrders } from '@/lib/data';
import { MenuItemCard } from '@/components/features/restaurants/MenuItemCard';
import { OrderSummary } from '@/components/features/orders/OrderSummary';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { ArrowLeft, MapPin, Star, Utensils, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function RestaurantMenuPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const restaurantId = params.id as string;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isConfirmingOrder, setIsConfirmingOrder] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    const foundRestaurant = mockRestaurants.find(r => r.id === restaurantId);
    if (foundRestaurant) {
      if (user?.role === 'ADMIN' || (user?.region === foundRestaurant.region)) {
        setRestaurant(foundRestaurant);
      } else {
        toast({ title: "Access Denied", description: "You do not have permission to view this restaurant.", variant: "destructive" });
        router.replace('/restaurants');
      }
    } else {
      toast({ title: "Not Found", description: "Restaurant not found.", variant: "destructive" });
      router.replace('/restaurants');
    }
    setPageLoading(false);
  }, [restaurantId, user, authLoading, router, toast]);

  const handleAddToCart = (menuItem: MenuItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.menuItemId === menuItem.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.menuItemId === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { menuItemId: menuItem.id, name: menuItem.name, quantity: 1, price: menuItem.price }];
    });
    toast({ title: `${menuItem.name} added to cart!`, description: "You can adjust quantity in the order summary." });
  };

  const handleUpdateQuantity = (menuItemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(menuItemId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item => (item.menuItemId === menuItemId ? { ...item, quantity: newQuantity } : item))
    );
  };

  const handleRemoveItem = (menuItemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.menuItemId !== menuItemId));
    toast({ title: `Item removed from cart.`, variant: "default" });
  };

  const handleConfirmOrder = () => {
    if (!user || !restaurant) {
      toast({ title: "Error", description: "User or restaurant data missing.", variant: "destructive" });
      return;
    }
    setIsConfirmingOrder(true);

    setTimeout(() => {
      const newOrder: Order = {
        id: `order-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        items: cart,
        totalAmount: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
        status: 'PENDING_CONFIRMATION',
        orderDate: new Date().toISOString(),
        deliveryAddress: '123 User Address, City', 
      };
      
      globalMockOrders.unshift(newOrder); 
      
      toast({ title: "Order Placed!", description: "Your order is pending confirmation." });
      setCart([]);
      setIsConfirmingOrder(false);
      router.push(`/orders/${newOrder.id}`);
    }, 1500);
  };

  if (pageLoading || authLoading) {
    return (
      <div className="container mx-auto px-0 md:px-4 py-8 animate-pulse">
        <Skeleton className="h-9 w-36 mb-6" />
        <Card className="mb-8 shadow-xl overflow-hidden">
          <Skeleton className="w-full h-48 md:h-64" />
          <CardContent className="pt-6">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-4" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-8 w-1/3 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1,2,3].map(i => <Skeleton key={i} className="h-72 rounded-lg"/>)}
            </div>
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-96 rounded-lg sticky top-20"/>
          </div>
        </div>
      </div>
    );
  }
  
  if(!restaurant) {
      return (
        <div className="container mx-auto px-4 py-8 text-center">
            <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
            <h1 className="text-2xl font-semibold">Restaurant Not Found</h1>
            <p className="text-muted-foreground mb-6">This restaurant might not exist or you may not have access.</p>
            <Button onClick={() => router.push('/restaurants')}>Go to Restaurants</Button>
        </div>
      )
  }


  return (
    <div className="container mx-auto px-0 md:px-4 py-8">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <Card className="mb-8 shadow-xl overflow-hidden bg-card">
        <div className="relative w-full h-48 md:h-64">
            <Image
            src={restaurant.imageUrl || `https://placehold.co/1200x400.png?text=${restaurant.name.replace(/\s/g,"+")}`}
            alt={restaurant.name}
            fill={true}
            style={{objectFit:"cover"}}
            priority
            sizes="(max-width: 768px) 100vw, 1200px"
            data-ai-hint={restaurant.dataAiHint || restaurant.cuisine.toLowerCase()}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
                <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">{restaurant.name}</h1>
            </div>
        </div>
        <CardContent className="pt-6">
            <div className="flex flex-wrap gap-x-6 gap-y-2 items-center mb-4 text-muted-foreground">
                <span className="flex items-center gap-2"><Utensils className="h-5 w-5 text-primary" /> {restaurant.cuisine}</span>
                <span className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> {restaurant.address}</span>
                {restaurant.rating && <span className="flex items-center gap-2"><Star className="h-5 w-5 text-yellow-400 fill-yellow-400" /> {restaurant.rating.toFixed(1)}</span>}
                <Badge variant="secondary" className="text-sm">{restaurant.region}</Badge>
            </div>
            <p className="text-muted-foreground">Explore the delicious offerings from {restaurant.name}. Add items to your cart and proceed to checkout when ready.</p>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {restaurant.menu.map(section => (
            <div key={section.id}>
              <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2 border-primary">{section.name}</h2>
              {section.items.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {section.items.map(item => (
                    <MenuItemCard key={item.id} item={item} onAddToCart={handleAddToCart} />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No items in this section yet.</p>
              )}
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <OrderSummary
            items={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onConfirmOrder={handleConfirmOrder}
            isConfirming={isConfirmingOrder}
          />
        </div>
      </div>
    </div>
  );
}
