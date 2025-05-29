
"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Utensils, ListOrdered, ArrowRight, CreditCard } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return (
      <div className="space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-5 w-full" />
          </CardContent>
        </Card>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-10 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg bg-card">
        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl">Welcome back, {user.name}!</CardTitle>
          <CardDescription className="text-lg">
            Here's a quick overview of your Slloze experience. Your role is: <span className="font-semibold capitalize text-primary">{user.role.toLowerCase()}</span>
            {user.region && <span className="font-semibold text-primary"> ({user.region})</span>}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Ready to explore or manage orders? Use the navigation on the left or the quick links below.</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <DashboardActionCard
          title="Explore Restaurants"
          description="Discover new places and menus."
          href="/restaurants"
          icon={Utensils}
          actionText="View Restaurants"
        />
        <DashboardActionCard
          title={user.role === 'MEMBER' ? "View Your Orders" : (user.role === 'MANAGER' ? "Manage Region Orders" : "Manage All Orders")}
          description="Check the status of current and past orders."
          href="/orders"
          icon={ListOrdered}
          actionText="Go to Orders"
        />
        {user.role === 'ADMIN' && (
            <DashboardActionCard
                title="Payment Settings"
                description="Manage payment methods for the platform."
                href="/admin/payment"
                icon={CreditCard}
                actionText="Update Payments"
            />
        )}
      </div>

      <Card className="bg-card">
        <CardHeader>
            <CardTitle>Did you know?</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">
                You can quickly toggle the sidebar by pressing <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>B
                </kbd> (or <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">Ctrl</span>B
                </kbd> on Windows).
            </p>
        </CardContent>
      </Card>

    </div>
  );
}

interface DashboardActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  actionText: string;
}

function DashboardActionCard({ title, description, href, icon: Icon, actionText }: DashboardActionCardProps) {
  return (
    <Card className="hover:shadow-xl transition-shadow duration-300 bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-medium">{title}</CardTitle>
        <Icon className="h-6 w-6 text-primary" />
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <Button asChild className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
          <Link href={href}>
            {actionText}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
