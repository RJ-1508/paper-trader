"use client";
import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/trade", label: "Trade" },
    { href: "/transactions", label: "Transactions" },
    { href: "/backtest", label: "Backtest" },
    { href: "/options", label: "Options" },
];

function isActive(pathname: string, href: string) {
    return href === "/options" ? pathname.startsWith(href) : pathname === href;
}

const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink";

export default function Navbar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const navRef = useRef<HTMLDivElement>(null);
    const linkRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
    const indicatorRef = useRef<HTMLSpanElement>(null);

    // Indicator position is set directly on the DOM node rather than via
    // state, since setState in an effect body is disallowed by lint here.
    useLayoutEffect(() => {
        const activeHref = links.find((link) => isActive(pathname, link.href))?.href;
        const nav = navRef.current;
        const indicator = indicatorRef.current;
        const activeEl = activeHref ? linkRefs.current.get(activeHref) : undefined;
        if (!nav || !indicator || !activeEl) return;
        const navRect = nav.getBoundingClientRect();
        const linkRect = activeEl.getBoundingClientRect();
        indicator.style.left = `${linkRect.left - navRect.left}px`;
        indicator.style.width = `${linkRect.width}px`;
    }, [pathname]);

    return (
        <nav className="border-b border-hairline">
            <div className="flex items-center justify-between p-4">
                <div className="font-serif text-lg text-text">Paper Trader</div>
                <div ref={navRef} className="relative flex gap-4">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            ref={(el) => {
                                if (el) linkRefs.current.set(link.href, el);
                                else linkRefs.current.delete(link.href);
                            }}
                            className={`text-text-dim hover:text-text transition-colors duration-150 ease-out rounded-control ${focusRing}`}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <span
                        ref={indicatorRef}
                        className="absolute bottom-0 left-0 h-0.5 w-0 bg-accent transition-all duration-150 ease-out"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-text-faint">{user?.email}</span>
                    <button
                        onClick={logout}
                        className={`px-3 py-1 border border-hairline rounded-control text-text-dim hover:text-text hover:border-hairline-strong transition-colors duration-150 ease-out ${focusRing}`}
                    >
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
}
