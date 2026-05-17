"use client";
import { useState, useEffect } from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { AxiosError } from "axios";

export default function LoginPage() {
    const { login, user, loading: authLoading } = useAuth();
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

    const handleLogin = async () => {
        setError("");
        setLoading(true);
        try {
            await login(email, password);
            // navigation is handled by the useEffect above once user state is committed
        } catch (err) {
            setError((err as AxiosError<{error: string}>).response?.data?.error ?? "Login failed");
        } finally {
            setLoading(false);
        }
    }
    return (
        <div className="max-w-sm mx-auto mt-20 p-6 border rounded flex flex-col gap-3">
            <h1 className="text-xl font-bold">Log In</h1>
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
                onClick={handleLogin}
                type="button"
                disabled={loading}
                className="bg-black text-white rounded px-3 py-2 disabled:opacity-50"
            >
                {loading ? "Logging in..." : "Log In"}
            </button>
            <Link href="/signup" className="text-sm text-blue-600">
                Need an account? Sign up
            </Link>
        </div>
    );
};
