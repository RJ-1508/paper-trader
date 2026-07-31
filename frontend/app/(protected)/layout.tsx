"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import GuillocheBand from "@/components/GuillocheBand";

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
    return <div className="p-6 text-text-dim">Loading...</div>;
  }
  if (!user) {
    return null;
  }
  return (
    <>
    <Navbar />
    <GuillocheBand />
    <main>{children}</main>
    </>
  );
}