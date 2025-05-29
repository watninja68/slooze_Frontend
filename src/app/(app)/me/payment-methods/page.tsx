"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import type { PaymentMethod } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { fetchApi, ApiError } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, CreditCard, AlertTriangle, Edit3, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'; // DialogFooter not used directly here
import { UserPaymentMethodForm, UserPaymentMethodFormValues } from '@/components/features/me/UserPaymentMethodForm';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';


export default function UserPaymentMethodsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true); // For initial page load
  const [error, setError] = useState<string | null>(null);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<PaymentMethod | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // Covers add/edit
  const [isDeleting, setIsDeleting] = useState(false); // Specifically for delete operations


  const fetchUserPaymentMethods = useCallback(async () => {
    // Not setting isLoading to true here if it's just a refresh,
    // to avoid full page skeleton on refresh. Initial load is handled by `isLoading` state.
    // If this is the initial fetch, setIsLoading(true) should be called before this.
    // setError(null); // Keep existing error if refresh fails, or clear if preferred.
    try {
      const methods = await fetchApi<PaymentMethod[]>('/api/v1/me/payment-methods', 'GET');
      setPaymentMethods(methods.map(m => ({ ...m, id: String(m.id) })));
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.status === 501) {
        toast({
          title: "Feature Coming Soon",
          description: "Listing your payment methods is currently unavailable. (Stubbed 501)",
          variant: "info",
          duration: 5000,
        });
        setPaymentMethods([]); 
      } else {
        setError(apiError.message || "Failed to load your payment methods.");
        // Toast is shown by the component displaying the error.
      }
    } finally {
      // Only set isLoading to false if it was true for the initial load.
      // Subsequent refreshes might not use this top-level isLoading.
      if (isLoading) setIsLoading(false);
    }
  }, [toast, isLoading]); // Added isLoading to dependencies of useCallback

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login');
      } else {
        setIsLoading(true); // Set loading true before initial fetch
        fetchUserPaymentMethods();
      }
    }
  }, [user, authLoading, router, fetchUserPaymentMethods]);

  const handleOpenFormDialog = (method: PaymentMethod | null) => {
    setEditingMethod(method);
    setIsFormOpen(true);
  };

  const handleSaveMethod = async (formData: UserPaymentMethodFormValues) => {
    setIsSubmitting(true);
    setError(null);

    // Prepare payload - API might expect 'last4' or 'email' based on type, not generic 'details'
    const payload: any = {
      type: formData.type,
      isPrimary: formData.isPrimary,
    };
    if (formData.type === "Credit Card") {
      payload.last4 = formData.details;
    } else {
      payload.email = formData.details;
    }
    // ID should not be in payload for POST
    if (formData.id) { 
        payload.id = formData.id; // For PUT
    }


    try {
      if (editingMethod && editingMethod.id) { // Editing existing method
        await fetchApi<PaymentMethod>(`/api/v1/me/payment-methods/${editingMethod.id}`, 'PUT', payload);
        toast({ title: "Success", description: "Payment method updated." });
      } else { // Adding new method
        // Remove ID from payload for POST, even if UserPaymentMethodFormValues has it optionally
        const { id, ...addPayload } = payload;
        await fetchApi<PaymentMethod>('/api/v1/me/payment-methods', 'POST', addPayload);
        toast({ title: "Success", description: "Payment method added." });
      }
      setIsFormOpen(false);
      fetchUserPaymentMethods(); // Refresh the list
    } catch (err) {
      const apiError = err as ApiError;
      const action = editingMethod ? "update" : "add";
      if (apiError.status === 501) {
        toast({
          title: "Feature Coming Soon",
          description: `Support for ${action}ing payment methods is not yet implemented. (Stubbed 501)`,
          variant: "info",
          duration: 5000,
        });
        // Keep form open on 501, so user doesn't lose input, unless specific UX decision is made
      } else {
        toast({
          title: `Failed to ${action} payment method`,
          description: apiError.message || "An unexpected error occurred.",
          variant: "destructive",
        });
        // Keep form open on other errors too
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!showDeleteConfirm || !showDeleteConfirm.id) return;

    setIsDeleting(true);
    try {
      await fetchApi(`/api/v1/me/payment-methods/${showDeleteConfirm.id}`, 'DELETE');
      toast({ title: "Success", description: "Payment method deleted." });
      setShowDeleteConfirm(null);
      fetchUserPaymentMethods(); // Refresh list
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.status === 501) {
        toast({
          title: "Feature Coming Soon",
          description: "Deleting payment methods is not yet implemented. (Stubbed 501)",
          variant: "info",
          duration: 5000,
        });
        // Optimistically remove from UI for 501 as per some instructions for other actions
        // However, for delete, it might be better not to if it's truly not deleted on backend.
        // For this exercise, let's assume we are asked to show it's "gone" from UI on 501.
        setPaymentMethods(prev => prev.filter(m => m.id !== showDeleteConfirm.id));
        setShowDeleteConfirm(null);

      } else {
        toast({
          title: "Failed to delete payment method",
          description: apiError.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading || (isLoading && paymentMethods.length === 0 && !error)) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="py-4">
          <Skeleton className="h-9 w-1/2 mb-2" />
          <Skeleton className="h-5 w-3/4" />
        </header>
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex justify-between items-center p-4 border rounded-lg">
                <div className="space-y-1">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-4 w-36" />
                </div>
                <div className="space-x-2">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter>
             <Skeleton className="h-10 w-32" />
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="py-4">
        <h1 className="text-3xl font-bold flex items-center">
          <CreditCard className="mr-3 h-8 w-8 text-primary" /> My Payment Methods
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your saved payment options for quick and easy checkout.
        </p>
      </header>

      {error && !isLoading && ( // Only show standalone error if not loading and error exists
        <Card className="bg-destructive/10 border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" /> Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchUserPaymentMethods} className="mt-3" disabled={isLoading || isSubmitting || isDeleting}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>Your Saved Methods</CardTitle>
            <CardDescription>View, add, or manage your payment methods.</CardDescription>
          </div>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenFormDialog(null)} disabled={isLoading || isSubmitting || isDeleting}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Method
            </Button>
          </DialogTrigger>
        </CardHeader>
        <CardContent>
          {/* isLoading check here is for subsequent re-fetches, initial load uses skeleton above */}
          {isLoading && paymentMethods.length === 0 && <p>Loading methods...</p>} 
          {!isLoading && !error && paymentMethods.length === 0 && (
            <div className="text-center py-6">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-xl font-semibold">No Payment Methods</h3>
              <p className="text-muted-foreground">You haven't added any payment methods yet.</p>
            </div>
          )}
          {paymentMethods.length > 0 && (
            <ul className="space-y-3">
              {paymentMethods.map((method) => {
                const isOnlyPrimary = method.isPrimary && paymentMethods.filter(pm => pm.isPrimary).length <= 1;
                return (
                  <li key={method.id} className="flex justify-between items-center p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div>
                      <span className="font-medium">{method.type}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {method.type === "Credit Card" ? `Ending in ${method.last4}` : method.email}
                      </span>
                      {method.isPrimary && <span className="ml-2 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">Primary</span>}
                    </div>
                    <div className="space-x-2">
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => handleOpenFormDialog(method)} disabled={isLoading || isSubmitting || isDeleting}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" onClick={() => setShowDeleteConfirm(method)} disabled={isLoading || isSubmitting || isDeleting || isOnlyPrimary}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
        {paymentMethods.length > 0 && (
            <CardFooter className="text-sm text-muted-foreground">
                Note: To change your primary payment method, edit the desired method and set it as primary. Deleting the only primary method is not allowed.
            </CardFooter>
        )}
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isSubmitting && !isDeleting) setIsFormOpen(isOpen); }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingMethod ? "Edit Payment Method" : "Add New Payment Method"}</DialogTitle>
            <DialogDescription>
              {editingMethod ? "Update the details of your payment method." : "Add a new payment method to your account."}
            </DialogDescription>
          </DialogHeader>
          <UserPaymentMethodForm
            initialData={editingMethod ? { ...editingMethod, id: String(editingMethod.id) } : undefined}
            onSave={handleSaveMethod}
            isSaving={isSubmitting}
            onCancel={() => { if (!isSubmitting && !isDeleting) setIsFormOpen(false); }}
          />
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!showDeleteConfirm} onOpenChange={(isOpen) => { if (!isDeleting) setShowDeleteConfirm(isOpen ? showDeleteConfirm : null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this payment method?</AlertDialogTitle>
            <AlertDialogDescription>
              Type: {showDeleteConfirm?.type} <br />
              Details: {showDeleteConfirm?.type === "Credit Card" ? `**** ${showDeleteConfirm?.last4}` : showDeleteConfirm?.email} <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteConfirm(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
