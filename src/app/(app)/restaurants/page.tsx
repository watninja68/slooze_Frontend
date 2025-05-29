
"use client";

import { useState, useEffect } from 'react';
import type { Restaurant } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { mockRestaurants } from '@/lib/data';
import { RestaurantCard } from '@/components/features/restaurants/RestaurantCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Utensils } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function RestaurantsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('all');
  const [availableCuisines, setAvailableCuisines] = useState<string[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      let filteredRestaurants = mockRestaurants;
      if (user.role === 'MEMBER' || user.role === 'MANAGER') {
        filteredRestaurants = mockRestaurants.filter(r => r.region === user.region);
      }
      
      const cuisines = ['all', ...new Set(filteredRestaurants.map(r => r.cuisine).filter(Boolean))];
      setAvailableCuisines(cuisines);
      setRestaurants(filteredRestaurants);
      setPageLoading(false);
    } else if (!authLoading && !user) {
      // Should be handled by layout, but as a fallback:
      setPageLoading(false);
    }
  }, [user, authLoading]);

  const displayedRestaurants = restaurants
    .filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.cuisine.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(r => selectedCuisine === 'all' || r.cuisine === selectedCuisine);

  if (pageLoading || authLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-card rounded-lg shadow">
          <Skeleton className="h-9 w-1/3" />
          <div className="flex gap-4 w-full md:w-auto">
            <Skeleton className="h-10 w-full md:w-[250px]" />
            <Skeleton className="h-10 w-full md:w-[180px]" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card className="overflow-hidden" key={i}>
              <Skeleton className="h-48 w-full" />
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
        <h1 className="text-3xl font-bold">Our Restaurants</h1>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-auto flex-grow md:min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search restaurants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <Select value={selectedCuisine} onValueChange={setSelectedCuisine}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by cuisine" />
            </SelectTrigger>
            <SelectContent>
              {availableCuisines.map(cuisine => (
                <SelectItem key={cuisine} value={cuisine}>
                  {cuisine === 'all' ? 'All Cuisines' : cuisine}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {displayedRestaurants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedRestaurants.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-lg shadow">
          <Utensils className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No Restaurants Found</h2>
          <p className="text-muted-foreground">
            Try adjusting your search or filter criteria.
            { (user?.role === 'MEMBER' || user?.role === 'MANAGER') && ` Or, there might be no restaurants listed for your region (${user?.region}).`}
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
