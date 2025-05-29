
"use client"; 

import { SidebarProvider } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/shared/SidebarNav";
import { Header } from "@/components/shared/Header";
import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { ChefHat } from "lucide-react";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-primary/30 via-background to-background">
        <div className="flex flex-col items-center space-y-4">
          <ChefHat className="mx-auto h-16 w-16 text-primary animate-pulse" />
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
           <p className="text-muted-foreground">Loading your Slloze experience...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}> {/* defaultOpen true makes it open on desktop by default */}
      <SidebarNav />
      <div className="flex flex-col flex-1 min-h-screen bg-background"> {/* Ensure bg-background here too */}
        <Header />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
