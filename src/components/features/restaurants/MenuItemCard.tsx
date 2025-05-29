
import type { MenuItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
}

export function MenuItemCard({ item, onAddToCart }: MenuItemCardProps) {
  return (
    <Card className="overflow-hidden flex flex-col h-full shadow-sm hover:shadow-md transition-shadow duration-200 bg-card">
      {item.imageUrl && (
        <div className="relative w-full h-40">
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill={true}
            style={{objectFit:"cover"}}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            data-ai-hint={item.category.toLowerCase() + " food"}
          />
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{item.name}</CardTitle>
        <CardDescription className="text-xs text-muted-foreground h-10 overflow-hidden text-ellipsis"> 
          {item.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow pt-0">
        <p className="text-lg font-semibold text-primary">${item.price.toFixed(2)}</p>
      </CardContent>
      <CardFooter>
        <Button onClick={() => onAddToCart(item)} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          <PlusCircle className="mr-2 h-4 w-4" /> Add to Order
        </Button>
      </CardFooter>
    </Card>
  );
}
