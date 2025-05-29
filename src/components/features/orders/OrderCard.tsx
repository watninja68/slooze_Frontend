
import type { Order } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, ShoppingBag, Utensils } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'PENDING_CONFIRMATION': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'CONFIRMED': return 'bg-blue-500 hover:bg-blue-600';
      case 'PREPARING': return 'bg-indigo-500 hover:bg-indigo-600';
      case 'READY_FOR_PICKUP':
      case 'OUT_FOR_DELIVERY': return 'bg-purple-500 hover:bg-purple-600';
      case 'DELIVERED': return 'bg-green-500 hover:bg-green-600';
      case 'CANCELLED': return 'bg-red-500 hover:bg-red-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col bg-card">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-xl flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-primary"/> Order #{order.id.substring(order.id.length - 6)}
                </CardTitle>
                <CardDescription className="flex items-center gap-1 text-sm mt-1">
                    <Utensils className="h-3 w-3 text-primary"/> {order.restaurantName || 'N/A'}
                </CardDescription>
            </div>
            <Badge className={`text-xs text-white ${getStatusColor(order.status)} px-2 py-1`}>
                {order.status.replace(/_/g, ' ').toLowerCase()}
            </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          <span>{format(parseISO(order.orderDate), "MMM d, yyyy 'at' h:mm a")}</span>
        </div>
        
        <p className="font-semibold text-lg">Total: ${order.totalAmount.toFixed(2)}</p>
        <p className="text-sm text-muted-foreground">Items: {order.items.reduce((acc, item) => acc + item.quantity, 0)}</p>
        
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href={`/orders/${order.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
