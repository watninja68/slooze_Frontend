
"use client";

import { useState, useEffect } from 'react';
import type { Order, Restaurant } from '@/lib/types'; // Added Restaurant type
import { useAuth } from '@/contexts/AuthContext';
import { fetchApi, ApiError } from '@/lib/apiClient'; // Import fetchApi and ApiError
import { OrderCard } from '@/components/features/orders/OrderCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, ListOrdered, AlertTriangle } from 'lucide-react'; // Removed ListFilter, Added AlertTriangle
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export default function OrdersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pageTitle = user?.role === 'MEMBER' ? "My Orders" : 
                    user?.role === 'MANAGER' ? `Orders in ${user.region || 'Your'} Region` : "All Orders";
  
  const orderStatuses: (Order['status'] | 'all')[] = ['all', 'PENDING_CONFIRMATION', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

  useEffect(() => {
    if (authLoading) {
      setPageLoading(true);
      return;
    }
    if (!user) {
      setPageLoading(false);
      // Redirect is handled by AuthProvider or layout
      return;
    }

    const loadOrders = async () => {
      setPageLoading(true);
      setError(null);
      try {
        // API is expected to return orders based on user role and permissions (e.g., user's orders, manager's region orders, all for admin)
        let fetchedOrders = await fetchApi<Order[]>('/api/v1/orders', 'GET');

        // If user is MANAGER and API doesn't pre-filter by region (or additional client-side check is desired),
        // we might need to fetch their restaurants to confirm region, though ideally API handles this.
        // For this iteration, we'll assume the /api/v1/orders endpoint correctly scopes orders for managers.
        // If specific client-side region filtering for managers against a list of *all* restaurants were still needed:
        // if (user.role === 'MANAGER' && user.region) {
        //   const allRestaurants = await fetchApi<Restaurant[]>('/api/v1/restaurants', 'GET');
        //   const managerRegionRestaurantIds = allRestaurants
        //     .filter(r => r.region === user.region)
        //     .map(r => r.id);
        //   fetchedOrders = fetchedOrders.filter(o => managerRegionRestaurantIds.includes(o.restaurantId));
        // }
        
        fetchedOrders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
        setOrders(fetchedOrders);
      } catch (err) {
        const errorMessage = err instanceof ApiError ? err.message : 'Failed to load orders.';
        setError(errorMessage);
        toast({ title: "Error Loading Orders", description: errorMessage, variant: "destructive" });
        setOrders([]);
      } finally {
        setPageLoading(false);
      }
    };

    loadOrders();
  }, [user, authLoading, toast]);

  const displayedOrders = orders
    .filter(o => 
      o.restaurantName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) || // Order ID might be too long for simple includes
      o.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())) // Search in item names
    )
    .filter(o => statusFilter === 'all' || o.status === statusFilter);

  if (authLoading || (pageLoading && orders.length === 0 && !error)) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-card rounded-lg shadow">
          <Skeleton className="h-9 w-1/3" />
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <Skeleton className="h-10 w-full sm:w-auto md:min-w-[250px] flex-grow" />
            <Skeleton className="h-10 w-full sm:w-[200px]" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => ( // Increased skeleton items
             <Card className="overflow-hidden" key={i}>
              <CardHeader><Skeleton className="h-7 w-3/4" /><Skeleton className="h-5 w-1/2 mt-1" /></CardHeader>
              <CardContent><Skeleton className="h-4 w-full mb-2" /><Skeleton className="h-4 w-1/3" /><Skeleton className="h-4 w-1/2 mt-1" /></CardContent>
              <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-card rounded-lg shadow">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2 text-destructive">Error Loading Orders</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <p className="text-sm text-muted-foreground">Please try refreshing. Contact support if the issue persists.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-card rounded-lg shadow">
        <h1 className="text-3xl font-bold">{pageTitle}</h1>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-auto flex-grow md:min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search ID, Restaurant, Customer, Items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as Order['status'] | 'all')}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {orderStatuses.map(status => (
                <SelectItem key={status} value={status} className="capitalize">
                  {status === 'all' ? 'All Statuses' : status.replace(/_/g, ' ').toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {(!pageLoading || orders.length > 0) && displayedOrders.length > 0 && !error ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      ) : (!pageLoading && displayedOrders.length === 0 && !error) ? (
        <div className="text-center py-12 bg-card rounded-lg shadow">
          <ListOrdered className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No Orders Found</h2>
          <p className="text-muted-foreground">
            Try adjusting your search or filter criteria.
            {user?.role === 'MEMBER' && " You may not have placed any orders yet."}
            {user?.role === 'MANAGER' && ` No orders found for restaurants in the ${user.region || 'assigned'} region.`}
          </p>
        </div>
      ) : null }
      {/* Error and loading states are handled by their own dedicated blocks above */}
    </div>
  );
}

// Minimal Card definition for Skeleton - Assuming these are defined as in previous files for consistency.
const Card = ({ className, children }: { className?: string, children: React.ReactNode }) => <div className={`border bg-card text-card-foreground shadow-sm rounded-lg ${className}`}>{children}</div>;
const CardHeader = ({ children }: { children: React.ReactNode }) => <div className="flex flex-col space-y-1.5 p-6">{children}</div>;
const CardContent = ({ children }: { children: React.ReactNode }) => <div className="p-6 pt-0">{children}</div>;
const CardFooter = ({ children }: { children: React.ReactNode }) => <div className="flex items-center p-6 pt-0">{children}</div>;
