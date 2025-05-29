
"use client";

import type { OrderItem, MenuItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';

interface OrderSummaryProps {
  items: OrderItem[];
  onUpdateQuantity: (menuItemId: string, newQuantity: number) => void;
  onRemoveItem: (menuItemId: string) => void;
  onConfirmOrder: () => void;
  isConfirming?: boolean;
}

export function OrderSummary({ items, onUpdateQuantity, onRemoveItem, onConfirmOrder, isConfirming = false }: OrderSummaryProps) {
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (items.length === 0) {
    return (
      <Card className="sticky top-20 shadow-lg bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" /> Your Order
          </CardTitle>
          <CardDescription>Your cart is empty. Add items from the menu.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="sticky top-20 shadow-lg bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" /> Your Order
        </CardTitle>
        <CardDescription>Review your items before placing the order.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-3"> {/* Max height for scrollability */}
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.menuItemId} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">${item.price.toFixed(2)} x {item.quantity}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onUpdateQuantity(item.menuItemId, item.quantity - 1)}
                    disabled={item.quantity <= 1 || isConfirming}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-4 text-center">{item.quantity}</span>
                   <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onUpdateQuantity(item.menuItemId, item.quantity + 1)}
                    disabled={isConfirming}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onRemoveItem(item.menuItemId)}
                    disabled={isConfirming}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <Separator className="my-4" />
        <div className="flex justify-between items-center text-lg font-semibold">
          <p>Total:</p>
          <p>${totalAmount.toFixed(2)}</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" onClick={onConfirmOrder} disabled={items.length === 0 || isConfirming}>
          {isConfirming ? "Processing..." : "Confirm Order"}
        </Button>
      </CardFooter>
    </Card>
  );
}
