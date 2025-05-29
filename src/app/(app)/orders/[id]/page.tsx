
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Order, Restaurant } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { mockOrders, mockRestaurants } from '@/lib/data';
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

  useEffect(() => {
    if (authLoading) return;

    const foundOrder = mockOrders.find(o => o.id === orderId);
    if (foundOrder) {
      const canView = 
        user?.role === 'ADMIN' ||
        (user?.role === 'MEMBER' && foundOrder.userId === user.id) ||
        (user?.role === 'MANAGER' && mockRestaurants.find(r => r.id === foundOrder.restaurantId)?.region === user.region);

      if (canView) {
        setOrder(foundOrder);
        const foundRestaurant = mockRestaurants.find(r => r.id === foundOrder.restaurantId);
        setRestaurant(foundRestaurant || null);
      } else {
        toast({ title: "Access Denied", description: "You do not have permission to view this order.", variant: "destructive" });
        router.replace('/orders');
      }
    } else {
      toast({ title: "Not Found", description: "Order not found.", variant: "destructive" });
      router.replace('/orders');
    }
    setPageLoading(false);
  }, [orderId, user, authLoading, router, toast]);

  const handleCancelOrder = () => {
    if (order && (user?.role === 'ADMIN' || user?.role === 'MANAGER')) {
      const updatedOrder = { ...order, status: 'CANCELLED' as const };
      const orderIndex = mockOrders.findIndex(o => o.id === order.id);
      if (orderIndex !== -1) {
        mockOrders[orderIndex] = updatedOrder; // Update global mock data
      }
      setOrder(updatedOrder); // Update local state
      toast({ title: "Order Cancelled", description: `Order #${order.id.substring(order.id.length - 6)} has been cancelled.` });
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

  if (pageLoading || authLoading || (!order && !pageLoading) ) { // Added !order && !pageLoading to catch not found after loading
    return (
      <div className="container mx-auto px-0 md:px-4 py-8">
        <Skeleton className="h-9 w-32 mb-6" />
        <Card className="shadow-xl animate-pulse">
          <CardHeader className="bg-muted/30">
            <div className="flex justify-between items-start">
              <Skeleton className="h-9 w-3/5" />
              <Skeleton className="h-7 w-1/4" />
            </div>
            <Skeleton className="h-5 w-2/5 mt-1" />
          </CardHeader>
          <CardContent className="pt-6 grid md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-1/3 mb-3" />
              <div className="flex items-start gap-4">
                <Skeleton className="w-20 h-20 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </div>
             <div className="space-y-4">
              <Skeleton className="h-6 w-1/3 mb-3" />
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
              <Skeleton className="h-px w-full my-2" />
              <Skeleton className="h-8 w-1/2 ml-auto" />
            </div>
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-6 w-1/4 mb-3" />
              {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-16 rounded-md" />)}
            </div>
          </CardContent>
           <CardFooter className="border-t pt-6">
            <Skeleton className="h-10 w-36" />
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (!order) { // This case handles if order is truly not found after loading attempts
     return (
        <div className="container mx-auto px-4 py-8 text-center">
            <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
            <h1 className="text-2xl font-semibold">Order Not Found</h1>
            <p className="text-muted-foreground mb-6">This order might not exist or you may not have access.</p>
            <Button onClick={() => router.push('/orders')}>Go to Orders</Button>
        </div>
      )
  }


  const canCancelOrder = (user.role === 'ADMIN' || (user.role === 'MANAGER' && restaurant?.region === user.region)) 
                         && order.status !== 'DELIVERED' && order.status !== 'CANCELLED';


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
            {restaurant && (
              <div className="flex items-start gap-4">
                {restaurant.imageUrl && 
                  <Image src={restaurant.imageUrl} alt={restaurant.name} width={80} height={80} className="rounded-lg object-cover" data-ai-hint={restaurant.dataAiHint || "restaurant exterior"} />
                }
                <div>
                  <p className="text-lg font-medium flex items-center gap-2"><Utensils className="h-5 w-5"/> {restaurant.name}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4"/> {restaurant.address}</p>
                  <p className="text-sm text-muted-foreground">Cuisine: {restaurant.cuisine}</p>
                </div>
              </div>
            )}
            {!restaurant && <p className="text-muted-foreground">Restaurant details not available.</p>}
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-primary border-b pb-2 mb-3">Order Summary</h3>
            <p className="flex justify-between"><span>Order Date:</span> <span className="font-medium flex items-center gap-2"><CalendarDays className="h-4 w-4"/>{format(parseISO(order.orderDate), "PPpp")}</span></p>
            <p className="flex justify-between"><span>Customer:</span> <span className="font-medium flex items-center gap-2"><UserIcon className="h-4 w-4"/>{order.userName || 'N/A'}</span></p>
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

        {canCancelOrder && (
          <CardFooter className="border-t pt-6">
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto">
                  <XCircle className="mr-2 h-4 w-4" /> Cancel Order
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
                  <AlertDialogAction onClick={handleCancelOrder} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                    Confirm Cancellation
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
