"use client";
import { useState, useEffect } from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { AxiosError } from "axios";
import GuillocheBand from "@/components/GuillocheBand";

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
        <>
            <GuillocheBand />
            <div
                aria-hidden="true"
                className="pointer-events-none fixed -bottom-[75px] -right-[75px] h-[150px] w-[150px] opacity-40"
                style={{
                    backgroundImage: "url(/deco/guilloche-rosette.svg)",
                    backgroundSize: "150px 150px",
                    backgroundRepeat: "no-repeat",
                }}
            />
            <div className="clearing max-w-sm mx-auto mt-20 p-6 flex flex-col gap-3">
                <h1 className="text-xl font-serif">Log In</h1>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e)=> setEmail(e.target.value)}
                    className="bg-panel-2 border border-hairline rounded-control px-3 py-2 text-text placeholder:text-text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e)=> setPassword(e.target.value)}
                    className="bg-panel-2 border border-hairline rounded-control px-3 py-2 text-text placeholder:text-text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                />
                {error && <p className="text-down text-sm">{error}</p>}
                <button
                    onClick={handleLogin}
                    type="button"
                    disabled={loading}
                    className="bg-accent text-ink rounded-control px-3 py-2 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                >
                    {loading ? "Logging in..." : "Log In"}
                </button>
                <Link
                    href="/signup"
                    className="text-sm text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                >
                    Need an account? Sign up
                </Link>
            </div>
        </>
    );
};
