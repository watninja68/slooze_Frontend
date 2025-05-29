
"use client";

import type { User, Role } from '@/lib/types';
import { mockUsers } from '@/lib/data';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  login: (userId: string) => void;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_STORAGE_KEY = 'sllozeUser';
const AUTH_TOKEN_STORAGE_KEY = 'sllozeAuthToken';

// Helper functions for base64 URL encoding/decoding
const base64UrlEncode = (str: string): string => {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

const base64UrlDecode = (str: string): string => {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return atob(str);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (token) {
      try {
        const [_header, payloadB64, _signature] = token.split('.');
        if (!payloadB64) {
          throw new Error("Invalid token format");
        }
        const payload = JSON.parse(base64UrlDecode(payloadB64));

        if (payload.exp * 1000 < Date.now()) {
          console.log("Token expired");
          throw new Error("Token expired");
        }

        // Simulate signature verification (optional for this mock)
        // const expectedSignature = base64UrlEncode("mock-signature");
        // if (signature !== expectedSignature) {
        //   throw new Error("Invalid signature");
        // }

        const foundUser = mockUsers.find(u => u.id === payload.id);
        if (foundUser) {
          const userDetails: User = {
            ...foundUser, // for fields like avatarUrl, region
            id: payload.id,
            name: payload.name,
            email: payload.email,
            role: payload.role,
          };
          setUser(userDetails);
          localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(userDetails));
        } else {
          throw new Error("User from token not found in mock users");
        }
      } catch (error) {
        console.error("Failed to process auth token:", error);
        localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        localStorage.removeItem(AUTH_USER_STORAGE_KEY);
        setUser(null);
      }
    } else {
      localStorage.removeItem(AUTH_USER_STORAGE_KEY); // Ensure user key is also cleared if no token
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Allow access to login page even if not authenticated.
    // Allow access to Next.js internal paths.
    if (!isLoading && !user && pathname !== '/login' && !pathname.startsWith('/_next/')) {
        // If not loading, not authenticated, and not on login page or internal path, redirect to login.
        router.push('/login');
    } else if (!isLoading && user && pathname === '/login') {
        // If authenticated and on login page, redirect to dashboard.
        router.push('/dashboard');
    }
  }, [user, isLoading, router, pathname]);

  const login = (userId: string) => {
    const foundUser = mockUsers.find(u => u.id === userId);
    if (foundUser) {
      const header = { alg: "HS256", typ: "JWT" };
      const payload = {
        id: foundUser.id,
        role: foundUser.role,
        email: foundUser.email,
        name: foundUser.name,
        exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiration
      };
      const signature = "mock-signature"; // Placeholder

      const token = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}.${base64UrlEncode(signature)}`;
      
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
      // Keep user object in local storage for now, though JWT is source of truth
      localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(foundUser)); 
      setUser(foundUser);
      router.push('/dashboard');
    } else {
      // Handle login failure (e.g., show an error message)
      console.error("User not found");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    router.push('/login');
  };
  
  const isAuthenticated = !!user;

  const getToken = () => localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, isAuthenticated, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
