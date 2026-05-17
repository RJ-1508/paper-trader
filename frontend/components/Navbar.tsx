"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function Navbar() {
    const {user, logout} = useAuth();
    return (<nav className="flex items-center justify-between p-4 border-b">
        <div className="font-bold text-lg">Paper Trader</div>
        <div className = "flex gap-4">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/trade">Trade</Link>
            <Link href="/transactions">Transactions</Link>
            <Link href="/backtest">Backtest</Link>
        </div>
        <div className="flex items-center gap-3">
            <span className="text-sm">{user?.email}</span>
            <button
                onClick={logout}
                className="px-3 py-1 border rounded hover:bg-gray-100"
                >
                Logout
            </button>
        </div>
    </nav>
    );
    
}