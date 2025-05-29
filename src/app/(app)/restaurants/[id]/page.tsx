
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Restaurant, MenuItem, OrderItem, Order } from '@/lib/types'; // User type removed as not directly used
import { useAuth } from '@/contexts/AuthContext';
import { fetchApi, ApiError } from '@/lib/apiClient'; // Import fetchApi and ApiError
import { mockOrders as globalMockOrders } from '@/lib/data'; // Keep mockOrders for order placement
import { MenuItemCard } from '@/components/features/restaurants/MenuItemCard';
import { OrderSummary } from '@/components/features/orders/OrderSummary';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { ArrowLeft, MapPin, Star, Utensils, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
// CardDescription, CardHeader, CardTitle are not directly used for the main restaurant card, CardContent is.
import { Card, CardContent } from '@/components/ui/card'; 
import { Skeleton } from '@/components/ui/skeleton';

export default function RestaurantMenuPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const restaurantId = params.id as string;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isConfirmingOrder, setIsConfirmingOrder] = useState(false); // This will be used for the API call
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); 

  useEffect(() => {
    if (authLoading) {
      setPageLoading(true); // Ensure loading is true while auth is resolving
      return;
    }
    // No need to check for !user explicitly, AuthProvider handles redirection.
    // The API call will fail if user is not authenticated and endpoint is protected.

    const loadRestaurantMenu = async () => {
      if (!restaurantId) {
        setError("Restaurant ID is missing from the URL.");
        toast({ title: "Error", description: "Restaurant ID is missing.", variant: "destructive" });
        setPageLoading(false);
        return;
      }
      setPageLoading(true);
      setError(null);
      try {
        // API is expected to handle RBAC (e.g. user can only access restaurants in their region if not ADMIN)
        // and return the full restaurant object including its menu.
        const fetchedRestaurant = await fetchApi<Restaurant>(`/api/v1/restaurants/${restaurantId}/menu`, 'GET');
        setRestaurant(fetchedRestaurant);
      } catch (err) {
        const apiError = err as ApiError;
        let errorMessage = "Failed to load restaurant details. Please try again.";
        if (apiError.status === 403) {
          errorMessage = "Access Denied: You don't have permission to view this restaurant.";
        } else if (apiError.status === 404) {
          errorMessage = "Restaurant not found. It might have been removed or the ID is incorrect.";
        } else if (apiError.message) {
          errorMessage = apiError.message; // Use message from ApiError if available
        }
        
        setError(errorMessage);
        toast({ title: "Loading Error", description: errorMessage, variant: "destructive" });
        setRestaurant(null); // Clear any existing restaurant data
        // Redirecting on 403/404 can be an option, but displaying message is also acceptable.
        // For now, we'll display the message on the page.
        // if (apiError.status === 404 || apiError.status === 403) router.push('/restaurants');
      } finally {
        setPageLoading(false);
      }
    };

    if (restaurantId) {
      loadRestaurantMenu();
    }
    // Removed router from dependencies as it's stable from Next.js
  }, [restaurantId, user, authLoading, toast]);

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

  const handleConfirmOrder = async () => {
    if (!user || !restaurant) {
      toast({ title: "Error", description: "User or restaurant data missing for order confirmation.", variant: "destructive" });
      return;
    }
    if (cart.length === 0) {
      toast({ title: "Empty Cart", description: "Please add items to your cart before confirming the order.", variant: "default" });
      return;
    }

    setIsConfirmingOrder(true);

    const newOrderPayload = {
      restaurantId: restaurant.id,
      items: cart.map(item => ({ menuItemId: item.menuItemId, quantity: item.quantity })), // Backend expects menuItemId and quantity
      // deliveryAddress: user.deliveryAddress || '123 Default Address, City', // Ideally from user profile
      deliveryAddress: '123 Mocked Address, City', // Using mock for now as per previous logic
      notes: '', // Add a way to capture notes if needed in UI
    };

    try {
      // POST /api/v1/orders with payload. Expects Order in response.
      const createdOrder = await fetchApi<Order>('/api/v1/orders', 'POST', newOrderPayload);
      
      // If API call succeeds (even if it's a 2xx response from a 501 stub that still returns a body)
      toast({ title: "Order Placed Successfully!", description: `Order #${createdOrder.id.substring(createdOrder.id.length -6)} is now PENDING_CONFIRMATION.` });
      setCart([]); // Clear cart
      router.push(`/orders/${createdOrder.id}`); // Navigate to the new order's detail page

    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.status === 501) {
        // Specific handling for 501: Inform user, do NOT clear cart or redirect.
        toast({ 
          title: "Feature Coming Soon", 
          description: "Order placement is not yet fully implemented on the server. Your order was not saved. (Stubbed 501)", 
          variant: "info",
          duration: 7000,
        });
        // Do NOT clear cart or redirect here, as the order wasn't actually created.
      } else {
        // Generic error handling for other API errors
        toast({ 
          title: "Order Placement Failed", 
          description: apiError.message || "An unexpected error occurred while placing your order.", 
          variant: "destructive" 
        });
      }
    } finally {
      setIsConfirmingOrder(false);
    }
  };

  // Show skeleton if auth is loading OR (page is loading AND no restaurant data yet AND no error has occurred)
  if (authLoading || (pageLoading && !restaurant && !error)) {
    return (
      <div className="container mx-auto px-0 md:px-4 py-8 animate-pulse">
        <Skeleton className="h-9 w-36 mb-6" /> {/* Back button skeleton */}
        <Card className="mb-8 shadow-xl overflow-hidden bg-card">
          <Skeleton className="w-full h-48 md:h-64" /> {/* Image skeleton */}
          <CardContent className="pt-6">
            <Skeleton className="h-8 md:h-10 w-3/4 mb-2" /> {/* Restaurant name skeleton */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 items-center mb-4 text-muted-foreground">
                <Skeleton className="h-5 w-24" /> {/* Cuisine skeleton */}
                <Skeleton className="h-5 w-32" /> {/* Address skeleton */}
                <Skeleton className="h-5 w-16" /> {/* Rating skeleton */}
                <Skeleton className="h-6 w-20 rounded-md" /> {/* Badge skeleton */}
            </div>
            <Skeleton className="h-4 w-full" /> {/* Description skeleton */}
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-8 w-1/3 mb-4" /> {/* Section title skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1,2,3].map(i => <Skeleton key={i} className="h-72 rounded-lg"/>)} {/* Menu item card skeleton */}
            </div>
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-96 rounded-lg sticky top-20"/> {/* Order summary skeleton */}
          </div>
        </div>
      </div>
    );
  }
  
  // Display error message if an error occurred and no restaurant data is available
  // This takes precedence over "Not Found" if error is set.
  if (error && !restaurant) {
      return (
        <div className="container mx-auto px-4 py-8 text-center">
            <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
            <h1 className="text-2xl font-semibold text-destructive mb-2">Error Loading Restaurant</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => router.push('/restaurants')}>Go to Restaurants List</Button>
        </div>
      );
  }
  
  // Display "Not Found" if loading is complete, no error, but restaurant is still null
  if (!pageLoading && !restaurant && !error) {
      return (
        <div className="container mx-auto px-4 py-8 text-center">
            <AlertTriangle className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-semibold">Restaurant Not Found</h1>
            <p className="text-muted-foreground mb-6">The restaurant you are looking for does not exist or you may not have access.</p>
            <Button onClick={() => router.push('/restaurants')}>Go to Restaurants List</Button>
        </div>
      );
  }
  
  // If restaurant data is available (even if pageLoading is true for a refresh, show current data)
  if (!restaurant) {
    // This should ideally not be reached if skeletons and error states are handled correctly above.
    // Acts as a fallback.
    return <div className="container mx-auto px-4 py-8 text-center">Loading or data issue...</div>;
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
