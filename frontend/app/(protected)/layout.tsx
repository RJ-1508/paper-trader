"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(()=> {
    if (!loading && !user) {
        router.push('/login');
    }
  }, [loading, user, router]);
  if (loading) {
    return <div>Loading...</div>;
  }
  if (!user) {
    return null;
  }
  return (
    <>
    <Navbar />
    <main>{children}</main>
    </>
  );
}