
"use client";

import { useState, useEffect } from 'react';
import type { Order } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { mockOrders, mockRestaurants } from '@/lib/data';
import { OrderCard } from '@/components/features/orders/OrderCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, ListFilter, ListOrdered } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function OrdersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');
  const [pageLoading, setPageLoading] = useState(true);

  const pageTitle = user?.role === 'MEMBER' ? "My Orders" : 
                    user?.role === 'MANAGER' ? `Orders in ${user.region} Region` : "All Orders";
  
  const orderStatuses: (Order['status'] | 'all')[] = ['all', 'PENDING_CONFIRMATION', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

  useEffect(() => {
    if (!authLoading && user) {
      let filteredOrders = [...mockOrders]; // Create a copy to avoid mutating global mockOrders
      if (user.role === 'MEMBER') {
        filteredOrders = filteredOrders.filter(o => o.userId === user.id);
      } else if (user.role === 'MANAGER') {
        const managerRegionRestaurants = mockRestaurants.filter(r => r.region === user.region).map(r => r.id);
        filteredOrders = filteredOrders.filter(o => managerRegionRestaurants.includes(o.restaurantId));
      }
      
      filteredOrders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
      setOrders(filteredOrders);
      setPageLoading(false);
    } else if (!authLoading && !user) {
      setPageLoading(false);
    }
  }, [user, authLoading]);

  const displayedOrders = orders
    .filter(o => 
      o.restaurantName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.userName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(o => statusFilter === 'all' || o.status === statusFilter);

  if (pageLoading || authLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-card rounded-lg shadow">
          <Skeleton className="h-9 w-1/3" />
          <div className="flex gap-4 w-full md:w-auto">
            <Skeleton className="h-10 w-full md:w-[250px]" />
            <Skeleton className="h-10 w-full md:w-[200px]" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
             <Card className="overflow-hidden" key={i}>
              <CardHeader><Skeleton className="h-7 w-3/4" /><Skeleton className="h-5 w-1/2 mt-1" /></CardHeader>
              <CardContent><Skeleton className="h-4 w-full mb-2" /><Skeleton className="h-4 w-1/3" /></CardContent>
              <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
            </Card>
          ))}
        </div>
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
              placeholder="Search ID, Restaurant, Customer..."
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

      {displayedOrders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-lg shadow">
          <ListOrdered className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No Orders Found</h2>
          <p className="text-muted-foreground">
            Try adjusting your search or filter criteria. 
            {user?.role === 'MEMBER' && " You may not have any orders yet."}
          </p>
        </div>
      )}
    </div>
  );
}

// Minimal Card definition for Skeleton
const Card = ({ className, children }: { className?: string, children: React.ReactNode }) => <div className={className}>{children}</div>;
const CardHeader = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
const CardContent = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
const CardFooter = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
