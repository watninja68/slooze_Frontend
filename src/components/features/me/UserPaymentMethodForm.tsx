"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Checkbox } from "@/components/ui/checkbox";
import type { PaymentMethod } from "@/lib/types"; // Assuming PaymentMethod type is suitable
import { useEffect } from "react";

// Define the Zod schema for the form
const userPaymentMethodSchema = z.object({
  id: z.string().optional(), // Present when editing
  type: z.enum(["Credit Card", "PayPal", "Google Pay"], {
    required_error: "Payment type is required.",
  }),
  details: z.string()
    .min(4, "Details must be at least 4 characters (e.g., last 4 digits or email).")
    .max(50, "Details must be at most 50 characters."),
  isPrimary: z.boolean().default(false),
});

export type UserPaymentMethodFormValues = z.infer<typeof userPaymentMethodSchema>;

interface UserPaymentMethodFormProps {
  initialData?: Partial<PaymentMethod>; // Use Partial for flexibility, map to form values
  onSave: (data: UserPaymentMethodFormValues) => void;
  isSaving?: boolean;
  onCancel?: () => void;
}

export function UserPaymentMethodForm({
  initialData,
  onSave,
  isSaving,
  onCancel,
}: UserPaymentMethodFormProps) {
  const form = useForm<UserPaymentMethodFormValues>({
    resolver: zodResolver(userPaymentMethodSchema),
    defaultValues: {
      id: initialData?.id || undefined,
      type: initialData?.type || "Credit Card",
      details: initialData?.last4 || initialData?.email || "",
      isPrimary: initialData?.isPrimary || false,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        id: initialData.id || undefined,
        type: initialData.type || "Credit Card",
        details: initialData.last4 || initialData.email || "",
        isPrimary: initialData.isPrimary || false,
      });
    } else {
      // Reset for "add new" mode
      form.reset({
        id: undefined,
        type: "Credit Card",
        details: "",
        isPrimary: false, // Or true if it should be default primary when adding first card
      });
    }
  }, [initialData, form]);

  const watchedType = form.watch("type");
  const detailsLabel = watchedType === "Credit Card" ? "Last 4 Digits" : "Email Address";
  const detailsPlaceholder = watchedType === "Credit Card" ? "e.g., 1234" : "e.g., user@example.com";

  function onSubmit(data: UserPaymentMethodFormValues) {
    onSave(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isSaving}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a payment type" />
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
              <FormLabel>{detailsLabel}</FormLabel>
              <FormControl>
                <Input placeholder={detailsPlaceholder} {...field} disabled={isSaving} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isPrimary"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSaving}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Set as primary payment method</FormLabel>
                <FormDescription>
                  This will be your default payment method for future transactions.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (initialData?.id ? "Saving..." : "Adding...") : (initialData?.id ? "Save Changes" : "Add Method")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
