
import type { Restaurant } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Star, Utensils } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full bg-card">
      <div className="relative w-full h-48">
        <Image
          src={restaurant.imageUrl || `https://placehold.co/600x400.png?text=${restaurant.name.replace(/\s/g, "+")}`}
          alt={restaurant.name}
          fill={true}
          style={{objectFit:"cover"}}
          data-ai-hint={restaurant.dataAiHint || restaurant.cuisine.toLowerCase()}
        />
      </div>
      <CardHeader>
        <CardTitle className="text-2xl">{restaurant.name}</CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Utensils className="h-4 w-4 text-primary" /> {restaurant.cuisine}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <MapPin className="h-4 w-4" />
          <span>{restaurant.address}</span>
        </div>
        {restaurant.rating && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            <span>{restaurant.rating.toFixed(1)}</span>
          </div>
        )}
        <div className="mt-2">
          <Badge variant="secondary">{restaurant.region}</Badge>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href={`/restaurants/${restaurant.id}`}>View Menu</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
