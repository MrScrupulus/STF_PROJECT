"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import AuthRedirect from "../auth/AuthRedirect";

const queryClient = new QueryClient();

export default function ClientLayout({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthRedirect>
        {children}
      </AuthRedirect>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}
