
"use client";

import { useEffect, useState, useCallback } from 'react'; // Added useCallback
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { PaymentForm } from '@/components/features/admin/PaymentForm';
import type { PaymentMethod } from '@/lib/types';
import { useToast } from '@/hooks/use-toast'; 
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, AlertTriangle } from 'lucide-react'; // Added AlertTriangle
import { fetchApi, ApiError } from '@/lib/apiClient';

export default function AdminPaymentPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [initialPaymentMethods, setInitialPaymentMethods] = useState<PaymentMethod[]>([]); // Store initially fetched methods
  const [currentPaymentMethods, setCurrentPaymentMethods] = useState<PaymentMethod[]>([]); // For display and passing to form
  const [pageLoading, setPageLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentMethods = useCallback(async () => {
    setPageLoading(true);
    setError(null);
    try {
      const methods = await fetchApi<PaymentMethod[]>('/api/v1/payment-methods', 'GET');
      // Ensure IDs are strings, as PaymentForm might rely on string IDs
      const processedMethods = methods.map(m => ({ ...m, id: String(m.id) }));
      setInitialPaymentMethods(JSON.parse(JSON.stringify(processedMethods))); // Deep copy for comparison
      setCurrentPaymentMethods(processedMethods);
    } catch (err) {
      const apiError = err as ApiError;
      let errorMessage = "Failed to load payment methods.";
      if (apiError.status === 501) {
        errorMessage = "Global payment methods endpoint is not yet implemented. (Stubbed 501)";
        toast({ title: "Feature Coming Soon", description: errorMessage, variant: "info" });
        // Set empty arrays or mock data if desired for 501, for now, show error.
        setInitialPaymentMethods([]);
        setCurrentPaymentMethods([]);
      } else if (apiError.message) {
        errorMessage = apiError.message;
      }
      setError(errorMessage);
      // No toast here for general errors, error component will display it.
      // toast({ title: "Loading Error", description: errorMessage, variant: "destructive" });
    } finally {
      setPageLoading(false);
    }
  }, [toast]);

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
        fetchPaymentMethods();
      }
    }
  }, [user, authLoading, router, toast, fetchPaymentMethods]);

  const handleSavePaymentMethods = async (newMethodListFromForm: PaymentMethod[]) => {
    setIsSaving(true);
    let changesMade = false;

    const methodsToUpdate: PaymentMethod[] = [];
    const methodsToAdd: PaymentMethod[] = [];
    const methodIdsToDelete: string[] = [];

    newMethodListFromForm.forEach(formMethod => {
      if (!formMethod.id || !initialPaymentMethods.find(im => im.id === formMethod.id)) {
        // If ID is missing, or ID is present but not in initial list (e.g. local 'pm-timestamp' ID)
        // it's considered an attempt to add.
        methodsToAdd.push(formMethod);
      }
    });

    initialPaymentMethods.forEach(initialMethod => {
      const formVersion = newMethodListFromForm.find(fm => fm.id === initialMethod.id);
      if (formVersion) {
        // Deep comparison might be too complex if order of keys can change.
        // Simple stringify or checking key fields.
        const initialRelevant = { type: initialMethod.type, details: initialMethod.last4 || initialMethod.email, isPrimary: initialMethod.isPrimary };
        const formRelevant = { type: formVersion.type, details: formVersion.last4 || formVersion.email, isPrimary: formVersion.isPrimary };
        if (JSON.stringify(initialRelevant) !== JSON.stringify(formRelevant)) {
          methodsToUpdate.push(formVersion);
        }
      } else {
        methodIdsToDelete.push(initialMethod.id);
      }
    });
    
    if (methodIdsToDelete.length > 0) {
      toast({ title: "Info: Deletion Not Supported", description: "Deleting global payment methods is not currently supported by the API.", duration: 5000, variant: "default" });
      // No API call for deletion. UI might seem to delete but server won't. Re-fetch will show them again.
      changesMade = true; // User attempted a change.
    }

    if (methodsToAdd.length > 0) {
      toast({ title: "Info: Addition Not Supported", description: "Adding new global payment methods is not currently supported by the API.", duration: 5000, variant: "default" });
      changesMade = true; // User attempted a change.
    }

    if (methodsToUpdate.length > 0) {
      changesMade = true;
      const updatePromises = methodsToUpdate.map(method => {
        const payload = { 
          type: method.type, 
          // Adapt details based on type, assuming API expects `last4` or `email` in a specific field, or a generic `details` field.
          // For now, let's assume API expects `last4` for 'Credit Card' and `email` for others.
          // This might need to be a generic 'details' field in the payload.
          ...(method.type === "Credit Card" ? { last4: method.last4 } : { email: method.email }),
          isPrimary: method.isPrimary 
        };
        // Ensure ID is a string for the API call if it comes as a number
        return fetchApi(`/api/v1/payment-methods/${String(method.id)}`, 'PUT', payload)
          .catch(err => ({ id: method.id, error: err as ApiError })); // Catch individual errors
      });

      const results = await Promise.allSettled(updatePromises);
      let successCount = 0;
      let errorCount = 0;

      results.forEach(result => {
        if (result.status === 'fulfilled') {
            // Check if the fulfilled promise was an error caught and returned
            const resValue = result.value as any; // Type assertion for error object
            if (resValue && resValue.error) {
                 errorCount++;
                 const apiError = resValue.error as ApiError;
                 let errorMsg = `Failed to update method ${resValue.id?.substring(0,6) || 'new'}.`;
                 if (apiError.status === 501) errorMsg += " (Feature not implemented)";
                 else if (apiError.message) errorMsg += ` (${apiError.message})`;
                 toast({ title: "Update Error", description: errorMsg, variant: "destructive" });
            } else {
                successCount++;
            }
        } else { // status === 'rejected'
          errorCount++;
          // This error is from fetchApi itself if not caught inside the map function's promise
          const apiError = result.reason as ApiError;
          toast({ title: "Update Failed", description: `An unexpected error occurred: ${apiError.message}`, variant: "destructive" });
        }
      });
      
      if (successCount > 0 && errorCount === 0) {
        toast({ title: "Success", description: `${successCount} payment method(s) updated successfully.` });
      } else if (successCount > 0 && errorCount > 0) {
        toast({ title: "Partial Success", description: `${successCount} updated, ${errorCount} failed.`, variant: "default" });
      } else if (errorCount > 0 && successCount === 0) {
        // Toasts for individual errors already shown. Maybe a summary toast isn't needed or a different one.
        // toast({ title: "Update Operation Failed", description: "No payment methods were successfully updated.", variant: "destructive"});
      }

    } else if (!changesMade) {
         toast({ title: "No Changes", description: "No changes detected to save." });
    }
    
    await fetchPaymentMethods(); // Re-fetch to ensure UI consistency
    setIsSaving(false);
  };

  if (authLoading || (pageLoading && !error)) { // Show skeleton if auth loading, or page loading without an error yet
    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-pulse">
            <header className="py-4 text-center">
                <Skeleton className="h-9 w-3/4 mx-auto" />
                <Skeleton className="h-5 w-1/2 mx-auto mt-2" />
            </header>
            <div className="p-8 bg-card rounded-lg shadow-xl">
                <Skeleton className="h-6 w-1/3 mb-4" /> {/* "Current Methods" title */}
                {/* Skeletons for a few payment method items */}
                <Skeleton className="h-12 w-full mb-2" />
                <Skeleton className="h-12 w-full mb-6" />
                <Skeleton className="h-px w-full my-6" /> {/* Separator */}
                <Skeleton className="h-6 w-1/2 mb-4" /> {/* "Add/Edit" title */}
                <Skeleton className="h-10 w-full mb-2" /> {/* Input field */}
                <Skeleton className="h-10 w-full mb-2" /> {/* Another input field */}
                <Skeleton className="h-12 w-1/4 mt-4" /> {/* Save button */}
            </div>
        </div>
    );
  }

  if (error && !pageLoading) { // Show error message if loading finished and error exists
    return (
      <div className="max-w-2xl mx-auto space-y-8 text-center py-10">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive">Error Loading Payment Methods</h1>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchPaymentMethods} disabled={pageLoading}>
          {pageLoading ? "Retrying..." : "Try Again"}
        </Button>
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
        isSaving={isSaving} // Pass saving state to form
      />
    </div>
  );
}
