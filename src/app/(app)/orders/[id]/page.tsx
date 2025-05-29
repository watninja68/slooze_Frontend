
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Order, Restaurant } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { fetchApi, ApiError } from '@/lib/apiClient'; // Import fetchApi and ApiError
// mockOrders is kept temporarily for the handleCancelOrder function.
// mockRestaurants will be removed as restaurant details will be fetched.
import { mockOrders } from '@/lib/data'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CalendarDays, MapPin, ShoppingBag, User as UserIcon, Utensils, XCircle, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false); // Added for checkout loading

  useEffect(() => {
    if (authLoading) {
      setPageLoading(true);
      return;
    }
    if (!user) { // Should be handled by AuthProvider, but good for safety
        setPageLoading(false);
        setError("User not authenticated."); // Set an error or rely on redirect
        // router.push('/login'); // AuthProvider should handle this
        return;
    }

    const loadOrderDetails = async () => {
      if (!orderId) {
        setError("Order ID is missing from URL.");
        toast({ title: "Error", description: "Order ID missing.", variant: "destructive" });
        setPageLoading(false);
        return;
      }
      setPageLoading(true);
      setError(null);
      setOrder(null); // Reset previous order state
      setRestaurant(null); // Reset previous restaurant state

      try {
        // API is expected to handle RBAC for viewing orders
        const fetchedOrder = await fetchApi<Order>(`/api/v1/orders/${orderId}`, 'GET');
        setOrder(fetchedOrder);

        if (fetchedOrder && fetchedOrder.restaurantId) {
          try {
            // Fetch full restaurant details. API for restaurant details should be public or check user perms if needed.
            const fetchedRestaurant = await fetchApi<Restaurant>(`/api/v1/restaurants/${fetchedOrder.restaurantId}`, 'GET');
            setRestaurant(fetchedRestaurant);
          } catch (restaurantError) {
            const rError = restaurantError as ApiError;
            console.warn(`Could not fetch details for restaurant ${fetchedOrder.restaurantId}:`, rError.message);
            toast({ title: "Partial Data", description: `Could not load full restaurant details. Displaying available info. Error: ${rError.message}`, variant: "default" });
            // Fallback: use restaurantName from order if available, and create a partial restaurant object
            if (fetchedOrder.restaurantName) {
              setRestaurant({
                id: fetchedOrder.restaurantId,
                name: fetchedOrder.restaurantName,
                address: 'Details not available', // Placeholder
                cuisine: 'Details not available', // Placeholder
                region: 'Details not available',  // Placeholder
                menu: [], // Placeholder
                imageUrl: undefined, // Placeholder
              });
            }
          }
        } else if (fetchedOrder && !fetchedOrder.restaurantId) {
           console.warn("Order details fetched but restaurantId is missing.");
           toast({ title: "Data Incomplete", description: "Order is missing restaurant ID. Cannot fetch restaurant details.", variant: "default" });
        }
      } catch (err) {
        const apiError = err as ApiError;
        let errorMessage = "Failed to load order details. Please try again.";
        if (apiError.status === 403) {
          errorMessage = "Access Denied: You don't have permission to view this order.";
        } else if (apiError.status === 404) {
          errorMessage = "Order not found. It might have been removed or the ID is incorrect.";
        } else if (apiError.message) {
          errorMessage = apiError.message;
        }
        setError(errorMessage);
        toast({ title: "Loading Error", description: errorMessage, variant: "destructive" });
        // router.push('/orders'); // Optional: redirect on critical errors after showing toast
      } finally {
        setPageLoading(false);
      }
    };

    loadOrderDetails();
  }, [orderId, user, authLoading, toast]); // Removed router from deps

  const handleCancelOrder = async () => {
    if (!order) return;

    // Permission check (client-side, API should also enforce)
    if (!(user?.role === 'ADMIN' || (user?.role === 'MANAGER' && restaurant?.region === user.region))) {
      toast({ title: "Permission Denied", description: "You do not have permission to cancel this order.", variant: "destructive" });
      return;
    }
    if (order.status === 'CANCELLED' || order.status === 'DELIVERED') {
      toast({ title: "Action Not Allowed", description: `Order is already ${order.status.toLowerCase()}.`, variant: "default" });
      return;
    }

    setIsCancellingOrder(true);
    try {
      // The endpoint is /api/v1/orders/{order.id}/cancel with POST method
      // It's expected to return 501, but we'll attempt the call.
      // fetchApi will throw an ApiError for non-ok responses, including 501.
      await fetchApi(`/api/v1/orders/${order.id}/cancel`, 'POST');
      
      // If the API call itself doesn't error out (e.g., if 501 was handled differently by fetchApi, which it isn't)
      // or if we want to optimistically update even on 501 for this specific stubbed case:
      // For now, we assume a 501 will throw an error and be caught in the catch block.
      // If the API were to return 200 OK *before* full implementation, this would be the success path.
      const updatedOrder = { ...order, status: 'CANCELLED' as const };
      setOrder(updatedOrder);
      toast({ title: "Order Cancelled", description: `Order #${order.id.substring(order.id.length - 6)} has been marked as cancelled.` });

    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.status === 501) {
        toast({ title: "Feature Coming Soon", description: "Order cancellation is not yet fully implemented on the server. (Stubbed 501)", variant: "info" });
        // Optimistically update UI for 501 as per instructions for some actions
        const updatedOrder = { ...order, status: 'CANCELLED' as const };
        setOrder(updatedOrder);
      } else {
        toast({ title: "Cancellation Failed", description: apiError.message || "An unexpected error occurred.", variant: "destructive" });
      }
    } finally {
      setIsCancellingOrder(false);
    }
  };

  const handleCheckoutOrder = async () => {
    if (!order) return;

    if (!canCheckoutOrder) {
      toast({ title: "Action Not Allowed", description: "This order cannot proceed to checkout at its current status.", variant: "default" });
      return;
    }

    setIsCheckingOut(true);
    try {
      // Endpoint /api/v1/orders/{order.id}/checkout with POST
      // Expected to return 501.
      await fetchApi(`/api/v1/orders/${order.id}/checkout`, 'POST');

      // If API were to succeed (not 501):
      // Potentially update order status, navigate, or show success.
      // For now, 501 error will be caught.
      toast({ title: "Checkout Initiated (Mock)", description: "Order checkout process started.", variant: "success" }); 
      // Example: setOrder({ ...order, status: 'PAYMENT_PENDING' }); // if there was such a status

    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.status === 501) {
        toast({ title: "Feature Coming Soon", description: "Order checkout is not yet fully implemented on the server. (Stubbed 501)", variant: "info" });
        // No optimistic update for checkout usually, as it's a multi-step process.
      } else {
        toast({ title: "Checkout Failed", description: apiError.message || "An unexpected error occurred during checkout.", variant: "destructive" });
      }
    } finally {
      setIsCheckingOut(false);
    }
  };
  
  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'PENDING_CONFIRMATION': return 'bg-yellow-500';
      case 'CONFIRMED': return 'bg-blue-500';
      case 'PREPARING': return 'bg-indigo-500';
      case 'READY_FOR_PICKUP':
      case 'OUT_FOR_DELIVERY': return 'bg-purple-500';
      case 'DELIVERED': return 'bg-green-500';
      case 'CANCELLED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Show skeleton if initial auth is loading OR (page is loading AND no order yet AND no error)
  if (authLoading || (pageLoading && !order && !error)) {
    return (
      <div className="container mx-auto px-0 md:px-4 py-8">
        <Skeleton className="h-9 w-32 mb-6" /> {/* Back button skeleton */}
        <Card className="shadow-xl animate-pulse bg-card">
          <CardHeader className="bg-muted/30">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <Skeleton className="h-9 w-48" /> {/* Order Details title */}
                <Skeleton className="h-5 w-36 mt-1" /> {/* Order ID */}
              </div>
              <Skeleton className="h-7 w-28 rounded-md" /> {/* Badge skeleton */}
            </div>
          </CardHeader>
          <CardContent className="pt-6 grid md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-4"> {/* Restaurant Info skeleton */}
              <Skeleton className="h-6 w-1/3 mb-3" /> {/* Section title */}
              <div className="flex items-start gap-4">
                <Skeleton className="w-20 h-20 rounded-lg" /> {/* Restaurant image */}
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-3/4" /> {/* Restaurant name */}
                  <Skeleton className="h-4 w-full" /> {/* Restaurant address */}
                  <Skeleton className="h-4 w-1/2" /> {/* Restaurant cuisine */}
                </div>
              </div>
            </div>
             <div className="space-y-4"> {/* Order Summary skeleton */}
              <Skeleton className="h-6 w-1/3 mb-3" /> {/* Section title */}
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-5 w-full mb-1" />)} {/* Summary lines */}
              <Skeleton className="h-px w-full my-2" /> {/* Separator */}
              <Skeleton className="h-8 w-1/2 ml-auto" /> {/* Total Amount */}
            </div>
            <div className="md:col-span-2 space-y-4"> {/* Items Ordered skeleton */}
              <Skeleton className="h-6 w-1/4 mb-3" /> {/* Section title */}
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                  <div className="space-y-1 flex-1"> <Skeleton className="h-5 w-1/2"/> <Skeleton className="h-4 w-1/4"/> </div>
                  <Skeleton className="h-6 w-1/5"/>
                </div>
              ))}
            </div>
          </CardContent>
           <CardFooter className="border-t pt-6 flex justify-between"> {/* Updated Footer for multiple buttons */}
            <Skeleton className="h-10 w-36" /> {/* Cancel button skeleton */}
            <Skeleton className="h-10 w-40" /> {/* Checkout button skeleton */}
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Display error if loading is complete, an error occurred, and no order data is available
  if (!pageLoading && error && !order) {
     return (
        <div className="container mx-auto px-4 py-8 text-center">
            <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
            <h1 className="text-2xl font-semibold text-destructive mb-2">Error Loading Order</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => router.push('/orders')}>Go to Orders List</Button>
        </div>
      );
  }

  // Display "Not Found" if loading is complete, no error, but order is still null
  if (!pageLoading && !order && !error) {
     return (
        <div className="container mx-auto px-4 py-8 text-center">
            <AlertTriangle className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-semibold">Order Not Found</h1>
            <p className="text-muted-foreground mb-6">The order you are looking for does not exist or you may not have access.</p>
            <Button onClick={() => router.push('/orders')}>Go to Orders List</Button>
        </div>
      );
  }
  
  // If order data is not yet available (but no error and not initial load), show a generic loading.
  // This primarily handles the case where `order` is null briefly before being set by `useEffect`.
  if (!order) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading order details...</div>;
  }

  // API should enforce cancellation rules. Client-side check is for UX.
  const canCancelOrder = (
    user?.role === 'ADMIN' || 
    (user?.role === 'MANAGER' && restaurant && restaurant.region === user.region)
  ) && order.status !== 'DELIVERED' && order.status !== 'CANCELLED';

  const canCheckoutOrder = order.status === 'PENDING_CONFIRMATION' || order.status === 'CONFIRMED';


  return (
    <div className="container mx-auto px-0 md:px-4 py-8">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <Card className="shadow-xl bg-card">
        <CardHeader className="bg-muted/30">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle className="text-3xl flex items-center gap-2">
                <ShoppingBag className="h-7 w-7 text-primary" /> Order Details
              </CardTitle>
              <CardDescription className="text-md mt-1">
                Order ID: <span className="font-semibold text-foreground">#{order.id.substring(order.id.length-6)}</span>
              </CardDescription>
            </div>
            <Badge className={`text-sm px-3 py-1 text-white ${getStatusColor(order.status)} capitalize`}>
              {order.status.replace(/_/g, ' ').toLowerCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6 grid md:grid-cols-2 gap-x-8 gap-y-6">
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-primary border-b pb-2 mb-3">Restaurant Information</h3>
            {restaurant ? (
              <div className="flex items-start gap-4">
                {restaurant.imageUrl && 
                  <Image src={restaurant.imageUrl} alt={restaurant.name || order.restaurantName || ''} width={80} height={80} className="rounded-lg object-cover" data-ai-hint={restaurant.dataAiHint || "restaurant exterior"} />
                }
                {/* Fallback icon if no image URL but restaurant object exists */}
                {!restaurant.imageUrl && (restaurant.name || order.restaurantName) &&
                  <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                    <Utensils className="w-10 h-10 text-muted-foreground" />
                  </div>
                }
                <div>
                  <p className="text-lg font-medium flex items-center gap-2"><Utensils className="h-5 w-5"/> {restaurant.name || order.restaurantName || 'N/A'}</p>
                  {restaurant.address && restaurant.address !== 'Details not available' && <p className="text-sm text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4"/> {restaurant.address}</p> }
                  {restaurant.cuisine && restaurant.cuisine !== 'Details not available' && <p className="text-sm text-muted-foreground">Cuisine: {restaurant.cuisine}</p>}
                </div>
              </div>
            ) : order.restaurantName ? ( // Fallback if full restaurant object failed to load but order has name
                 <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                       <Utensils className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-lg font-medium flex items-center gap-2"><Utensils className="h-5 w-5"/> {order.restaurantName}</p>
                        <p className="text-sm text-muted-foreground">Full restaurant details could not be loaded.</p>
                    </div>
                 </div>
            ) : ( // Fallback if no restaurant info at all
                <p className="text-muted-foreground">Restaurant details are currently unavailable.</p>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-primary border-b pb-2 mb-3">Order Summary</h3>
            <p className="flex justify-between"><span>Order Date:</span> <span className="font-medium flex items-center gap-2"><CalendarDays className="h-4 w-4"/>{format(parseISO(order.orderDate), "PPpp")}</span></p>
            <p className="flex justify-between"><span>Customer:</span> <span className="font-medium flex items-center gap-2"><UserIcon className="h-4 w-4"/>{order.userName || user?.name || 'N/A'}</span></p>
            <p className="flex justify-between"><span>Delivery Address:</span> <span className="font-medium text-right">{order.deliveryAddress}</span></p>
            {order.notes && <p className="flex justify-between items-start"><span>Notes:</span> <span className="font-medium text-right max-w-[70%]">{order.notes}</span></p>}
            <Separator/>
            <p className="flex justify-between text-2xl font-bold"><span>Total Amount:</span> <span className="text-primary">${order.totalAmount.toFixed(2)}</span></p>
          </div>

          <div className="md:col-span-2 space-y-4">
            <h3 className="text-xl font-semibold text-primary border-b pb-2 mb-3">Items Ordered</h3>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-t pt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
            {canCancelOrder && (
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto" disabled={isCancellingOrder || isCheckingOut}>
                  {isCancellingOrder ? "Cancelling..." : <><XCircle className="mr-2 h-4 w-4" /> Cancel Order</>}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to cancel this order?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The order status will be set to 'CANCELLED'.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Order</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleCancelOrder} 
                    disabled={isCancellingOrder}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    {isCancellingOrder ? "Cancelling..." : "Confirm Cancellation"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {canCheckoutOrder && (
            <Button 
              className="w-full sm:w-auto" 
              onClick={handleCheckoutOrder} 
              disabled={isCheckingOut || isCancellingOrder || order.status === 'CANCELLED' || order.status === 'DELIVERED'}
            >
              {isCheckingOut ? "Processing..." : "Proceed to Checkout"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
