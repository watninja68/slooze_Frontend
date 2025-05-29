
"use client";

import { useState, useEffect } from 'react';
import type { Restaurant } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { fetchApi, ApiError } from '@/lib/apiClient'; // Import fetchApi and ApiError
import { RestaurantCard } from '@/components/features/restaurants/RestaurantCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Utensils, AlertTriangle } from 'lucide-react'; // Added AlertTriangle
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast'; 

export default function RestaurantsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast(); 
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('all');
  const [availableCuisines, setAvailableCuisines] = useState<string[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      setPageLoading(true);
      return;
    }
    if (!user) {
      setPageLoading(false);
      // Redirect handled by AuthProvider or layout
      return;
    }

    const loadRestaurants = async () => {
      setPageLoading(true);
      setError(null);
      try {
        // API is expected to handle RBAC filtering based on the user's token
        const fetchedRestaurants = await fetchApi<Restaurant[]>('/api/v1/restaurants', 'GET');
        
        const cuisines = ['all', ...new Set(fetchedRestaurants.map(r => r.cuisine).filter(Boolean))];
        setAvailableCuisines(cuisines);
        setRestaurants(fetchedRestaurants);
      } catch (err) {
        const errorMessage = err instanceof ApiError ? err.message : 'Failed to load restaurants.';
        setError(errorMessage);
        toast({ title: "Error Loading Restaurants", description: errorMessage, variant: "destructive" });
        setRestaurants([]); 
        setAvailableCuisines(['all']);
      } finally {
        setPageLoading(false);
      }
    };

    loadRestaurants();
  }, [user, authLoading, toast]);

  const displayedRestaurants = restaurants
    .filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.cuisine.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(r => selectedCuisine === 'all' || r.cuisine === selectedCuisine);

  // Show skeleton if auth is loading OR (page is loading AND there are no restaurants yet to display, AND no error)
  if (authLoading || (pageLoading && restaurants.length === 0 && !error)) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-card rounded-lg shadow">
          <Skeleton className="h-9 w-1/3" />
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto"> {/* Ensure consistent responsive layout for skeletons */}
            <Skeleton className="h-10 w-full sm:w-auto md:min-w-[250px] flex-grow" />
            <Skeleton className="h-10 w-full sm:w-[180px]" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => ( // Display more skeletons for better loading perception
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

  if (error) {
    return (
      <div className="text-center py-12 bg-card rounded-lg shadow">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2 text-destructive">Error Loading Restaurants</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <p className="text-sm text-muted-foreground">Please try refreshing the page. If the issue persists, contact support.</p>
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

      {/* Show restaurant cards if not loading and there are restaurants to display */}
      {!pageLoading && displayedRestaurants.length > 0 && !error ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedRestaurants.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      ) : 
      // Show "No Restaurants Found" if not loading, no restaurants, and no error
      !pageLoading && displayedRestaurants.length === 0 && !error ? (
        <div className="text-center py-12 bg-card rounded-lg shadow">
          <Utensils className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No Restaurants Found</h2>
          <p className="text-muted-foreground">
            Try adjusting your search or filter criteria.
            { (user?.role === 'MEMBER' || user?.role === 'MANAGER') && ` It seems there are no restaurants available in your assigned region.`}
          </p>
        </div>
      ) : null}
      {/* Error state is handled by its own dedicated block above */}
      {/* Loading state (skeleton) is handled by its own dedicated block above */}
    </div>
  );
}

// Minimal Card definition for Skeleton - These should ideally be part of a shared UI library.
// Assuming they are correctly defined for the skeleton loader to work.
// If using shadcn/ui, these would be <Card>, <CardHeader>, etc. from '@/components/ui/card'
const Card = ({ className, children }: { className?: string, children: React.ReactNode }) => <div className={`border bg-card text-card-foreground shadow-sm rounded-lg ${className}`}>{children}</div>;
const CardHeader = ({ children }: { children: React.ReactNode }) => <div className="flex flex-col space-y-1.5 p-6">{children}</div>;
const CardContent = ({ children }: { children: React.ReactNode }) => <div className="p-6 pt-0">{children}</div>;
const CardFooter = ({ children }: { children: React.ReactNode }) => <div className="flex items-center p-6 pt-0">{children}</div>;
