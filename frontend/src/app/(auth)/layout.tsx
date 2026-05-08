"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-ember border-t-transparent" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      {/* Background gradient */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/4 top-1/4 size-96 rounded-full bg-ember/5 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 size-72 rounded-full bg-ember/3 blur-3xl" />
      </div>
      {children}
    </div>
  );
}
