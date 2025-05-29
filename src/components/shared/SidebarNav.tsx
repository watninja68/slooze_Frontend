
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LayoutDashboard, 
  Utensils, 
  ListOrdered, 
  CreditCard, 
  LogOut,
  ChefHat
} from "lucide-react";

const navItemsBase = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/restaurants", label: "Restaurants", icon: Utensils },
  { href: "/orders", label: "My Orders", icon: ListOrdered },
  { href: "/me/payment-methods", label: "My Payment Methods", icon: CreditCard },
];

const navItemsAdmin = [
  { href: "/admin/payment", label: "Payment Settings", icon: CreditCard },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const getNavItems = () => {
    let items = [...navItemsBase];
    if (user?.role === "ADMIN") {
      items.push(...navItemsAdmin);
      const ordersItem = items.find(item => item.href === "/orders");
      if (ordersItem) ordersItem.label = "All Orders";
    } else if (user?.role === "MANAGER") {
      const ordersItem = items.find(item => item.href === "/orders");
      if (ordersItem) ordersItem.label = "Region Orders";
    }
    return items;
  };

  const navigationItems = getNavItems();

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left">
      <SidebarHeader className="p-4 justify-between flex items-center">
        <Link href="/dashboard" className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
            <ChefHat className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-semibold text-primary">Slloze</h1>
        </Link>
        {/* SidebarTrigger is automatically handled by the Sidebar component based on props and screen size, no need to explicitly place it here unless for custom placement */}
      </SidebarHeader>

      <SidebarContent className="p-2 flex-1"> {/* flex-1 to take available space */}
        <SidebarMenu>
          {navigationItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                  className="justify-start"
                  tooltip={{children: item.label, className: "ml-2"}}
                >
                  <a>
                    <item.icon className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t mt-auto">
        {user && (
           <div className="flex items-center gap-3 mb-2 group-data-[collapsible=icon]:hidden">
            <UserAvatar user={user} className="h-10 w-10"/>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user.name}</span>
              <span className="text-xs text-muted-foreground capitalize">{user.role.toLowerCase()}{user.region ? ` (${user.region})` : ''}</span>
            </div>
          </div>
        )}
        <Button variant="ghost" onClick={logout} className="w-full justify-start group-data-[collapsible=icon]:justify-center">
          <LogOut className="h-5 w-5" />
          <span className="ml-2 group-data-[collapsible=icon]:hidden">Logout</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
