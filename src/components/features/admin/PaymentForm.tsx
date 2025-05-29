
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PaymentMethod } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Trash2, PlusCircle, Edit3 } from "lucide-react";
import { useState, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox

const paymentMethodSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["Credit Card", "PayPal", "Google Pay"]),
  details: z.string().min(4, "Details must be at least 4 characters (e.g., last 4 digits or email).")
    .max(50, "Details must be at most 50 characters."),
  isPrimary: z.boolean(),
});

type PaymentMethodFormValues = z.infer<typeof paymentMethodSchema>;

interface PaymentFormProps {
  initialPaymentMethods: PaymentMethod[];
  onSave: (methods: PaymentMethod[]) => void; 
}

export function PaymentForm({ initialPaymentMethods, onSave }: PaymentFormProps) {
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(initialPaymentMethods);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);

  const form = useForm<PaymentMethodFormValues>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      type: "Credit Card",
      details: "",
      isPrimary: paymentMethods.length === 0, // Default to primary if no methods exist
    },
  });
  
  useEffect(() => {
    if (editingMethod) {
      form.reset({
        id: editingMethod.id,
        type: editingMethod.type,
        details: editingMethod.last4 || editingMethod.email || "",
        isPrimary: editingMethod.isPrimary,
      });
    } else {
      form.reset({ type: "Credit Card", details: "", isPrimary: paymentMethods.length === 0 });
    }
  }, [editingMethod, form, paymentMethods.length]);


  function onSubmit(data: PaymentMethodFormValues) {
    const newMethodData = {
      type: data.type,
      isPrimary: data.isPrimary,
      ...(data.type === "Credit Card" ? { last4: data.details } : { email: data.details }),
    };

    let updatedMethods;
    if (editingMethod && data.id) { // Editing existing
      updatedMethods = paymentMethods.map(pm => pm.id === data.id ? { ...pm, ...newMethodData } : pm);
    } else { // Adding new
      const newMethodWithId = { ...newMethodData, id: `pm-${Date.now()}` };
      updatedMethods = [...paymentMethods, newMethodWithId];
    }
    
    // Ensure only one primary if isPrimary is true for the current submission
    if (data.isPrimary) {
      const currentMethodId = editingMethod?.id || updatedMethods.find(m => m.last4 === data.details || m.email === data.details)?.id; // Heuristic to find new item if ID not set yet
      updatedMethods = updatedMethods.map(pm => ({
        ...pm,
        isPrimary: pm.id === currentMethodId,
      }));
    } else {
      // If unchecking primary, and it was the only primary, make another one primary (e.g., the first one)
      const primaryExists = updatedMethods.some(pm => pm.isPrimary);
      if (!primaryExists && updatedMethods.length > 0) {
        updatedMethods[0].isPrimary = true;
      }
    }


    setPaymentMethods(updatedMethods);
    onSave(updatedMethods);
    setEditingMethod(null);
    toast({ title: "Payment methods updated!", description: "Your changes have been saved." });
  }

  const handleDeleteMethod = (id: string) => {
    let updatedMethods = paymentMethods.filter(pm => pm.id !== id);
    // If the deleted method was primary and there are other methods, make the first one primary
    if (updatedMethods.length > 0 && !updatedMethods.some(pm => pm.isPrimary)) {
      updatedMethods[0].isPrimary = true; 
    }
    setPaymentMethods(updatedMethods);
    onSave(updatedMethods);
    if (editingMethod?.id === id) setEditingMethod(null); // Clear form if deleting the one being edited
    toast({ title: "Payment method removed." });
  };

  return (
    <Card className="shadow-lg bg-card">
      <CardHeader>
        <CardTitle>Manage Payment Methods</CardTitle>
        <CardDescription>Add, edit, or remove payment methods for the platform.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Current Methods</h3>
            {paymentMethods.length === 0 && <p className="text-sm text-muted-foreground">No payment methods configured.</p>}
            <ul className="space-y-2">
              {paymentMethods.map((method) => (
                <li key={method.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                  <div>
                    <span className="font-medium">{method.type}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {method.type === "Credit Card" ? `**** ${method.last4}` : method.email}
                    </span>
                    {method.isPrimary && <span className="ml-2 text-xs text-primary font-semibold">(Primary)</span>}
                  </div>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingMethod(method)}><Edit3 className="h-3 w-3 mr-1"/>Edit</Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDeleteMethod(method.id)} disabled={paymentMethods.length === 1 && method.isPrimary}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-medium mb-4">{editingMethod ? "Edit Payment Method" : "Add New Payment Method"}</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Credit Card">Credit Card</SelectItem>
                          <SelectItem value="PayPal">PayPal</SelectItem>
                          <SelectItem value="Google Pay">Google Pay</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{form.watch("type") === "Credit Card" ? "Last 4 Digits" : "Email Address"}</FormLabel>
                      <FormControl>
                        <Input placeholder={form.watch("type") === "Credit Card" ? "e.g., 4242" : "e.g., user@example.com"} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isPrimary"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-background">
                       <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={paymentMethods.length === 0 && !editingMethod || (editingMethod?.id === field.value && paymentMethods.length === 1 && editingMethod.isPrimary)} // Disable unchecking if it's the only method and primary
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Set as primary payment method</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <div className="flex gap-2 pt-2">
                  <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    <PlusCircle className="mr-2 h-4 w-4" /> {editingMethod ? "Save Changes" : "Add Method"}
                  </Button>
                  {editingMethod && (
                    <Button variant="outline" onClick={() => { setEditingMethod(null);}}>
                      Cancel Edit
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
