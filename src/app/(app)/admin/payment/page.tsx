
"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { PaymentForm } from '@/components/features/admin/PaymentForm';
import { mockPaymentMethods as initialMockPaymentMethods } from '@/lib/data'; // Renamed to avoid conflict
import type { PaymentMethod } from '@/lib/types';
import { useToast } from '@/hooks/use-toast'; 
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard } from 'lucide-react';

export default function AdminPaymentPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  // Use a local state that's initialized from mock data but can be updated.
  const [currentPaymentMethods, setCurrentPaymentMethods] = useState<PaymentMethod[]>(() => {
    // Deep copy to prevent modifying the original mock array directly
    return JSON.parse(JSON.stringify(initialMockPaymentMethods));
  });
  const [pageLoading, setPageLoading] = useState(true);


  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'ADMIN') {
        toast({
          title: "Access Denied",
          description: "You do not have permission to access this page.",
          variant: "destructive",
        });
        router.replace('/dashboard');
      } else {
        setPageLoading(false);
      }
    }
  }, [user, authLoading, router, toast]);

  const handleSavePaymentMethods = (updatedMethods: PaymentMethod[]) => {
    // In a real app, this would be an API call to persist changes.
    // For this mock, we update the local state.
    setCurrentPaymentMethods(updatedMethods); 
    // To make changes "persist" for the demo if mockPaymentMethods from lib/data is used elsewhere directly,
    // you could update it, but it's generally bad practice:
    // Object.assign(initialMockPaymentMethods, updatedMethods); // This would modify the imported array
    // console.log("Payment methods saved (mock):", updatedMethods);
  };

  if (authLoading || pageLoading) {
    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-pulse">
            <header className="py-4 text-center">
                <Skeleton className="h-9 w-3/4 mx-auto" />
                <Skeleton className="h-5 w-1/2 mx-auto mt-2" />
            </header>
            <div className="p-8 bg-card rounded-lg shadow-xl">
                <Skeleton className="h-6 w-1/3 mb-4" />
                <Skeleton className="h-12 w-full mb-2" />
                <Skeleton className="h-12 w-full mb-6" />
                <Skeleton className="h-px w-full my-6" />
                <Skeleton className="h-6 w-1/2 mb-4" />
                <Skeleton className="h-10 w-full mb-2" />
                <Skeleton className="h-10 w-full mb-2" />
                <Skeleton className="h-12 w-1/4 mt-4" />
            </div>
        </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header className="py-4 flex flex-col items-center text-center">
        <CreditCard className="h-12 w-12 text-primary mb-3" />
        <h1 className="text-3xl font-bold">Payment Method Management</h1>
        <p className="text-muted-foreground mt-1 max-w-md">
            Configure payment options available on the Slloze platform. Add, edit, or remove methods below.
        </p>
      </header>
      <PaymentForm 
        initialPaymentMethods={currentPaymentMethods} 
        onSave={handleSavePaymentMethods} 
      />
    </div>
  );
}
