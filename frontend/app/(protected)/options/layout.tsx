"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/options", label: "Chain" },
  { href: "/options/positions", label: "Positions" },
  { href: "/options/risk", label: "Risk" },
  { href: "/options/legs", label: "Multi-leg" },
];

export default function OptionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div>
      <nav className="flex gap-6 px-6 border-b border-hairline">
        {TABS.map((tab) => {
          const active =
            tab.href === "/options"
              ? pathname === tab.href
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`py-4 border-b-2 transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink ${
                active
                  ? "border-accent text-text"
                  : "border-transparent text-text-dim hover:text-text"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
