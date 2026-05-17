"use client";
import { useState, useEffect } from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { AxiosError } from "axios";

export default function SignupPage() {
    const { signup, user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user && !authLoading) {
            router.push("/dashboard");
        }
    }, [user, authLoading, router]);

    const handleSignup = async () => {
        setError("");
        setLoading(true);
        try {
            await signup(email, password);
            // navigation is handled by the useEffect above once user state is committed
        } catch (err) {
            setError((err as AxiosError<{error: string}>).response?.data?.error ?? "Signup failed");
        } finally {
            setLoading(false);
        }
    }
    return (
        <div className="max-w-sm mx-auto mt-20 p-6 border rounded flex flex-col gap-3">
            <h1 className="text-xl font-bold">Sign Up</h1>
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e)=> setEmail(e.target.value)}
                className = "border rounded px-3 py-2"
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e)=> setPassword(e.target.value)}
                className = "border rounded px-3 py-2"
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
                onClick={handleSignup}
                disabled={loading}
                className="bg-black text-white rounded px-3 py-2 disabled:opacity-50"
            >
                {loading ? "Signing up..." : "Sign Up"}
            </button>
            <Link href="/login" className="text-sm text-blue-600">
                Already have an account? Log in
            </Link>
        </div>
    );
};
