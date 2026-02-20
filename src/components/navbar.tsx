"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Syringe, Users, BarChart3, Bell, User, LogIn } from "lucide-react";
import { useAuth } from "@/components/auth-context";

const navLinks = [
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/eligibility", label: "Eligibility", icon: Syringe },
  { href: "/timeline", label: "Timeline", icon: BarChart3 },
  { href: "/reminders", label: "Reminders", icon: Bell },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  return (
    <nav className="sticky top-0 z-50 border-b border-[#c2dcee] bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#116cb6] transition-colors group-hover:bg-[#0d4d8b]">
            <Syringe className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold leading-tight text-[#12455a]">
              QDoc
            </span>
            <span className="text-[10px] font-medium leading-tight text-[#116cb6]">
              Vaccine System
            </span>
          </div>
        </Link>

        {/* Nav Links + Auth */}
        <div className="flex items-center gap-1">
          {user && navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${isActive
                  ? "bg-[#d6e6f2] text-[#116cb6]"
                  : "text-[#5a7d8e] hover:bg-[#eef4f9] hover:text-[#12455a]"
                  }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}

          {/* Auth Section */}
          {!loading && (
            <div className="ml-2 flex items-center gap-1 border-l border-[#c2dcee] pl-3">
              {user ? (
                <Link
                  href="/profile"
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${pathname === "/profile"
                      ? "bg-[#d6e6f2] text-[#116cb6]"
                      : "text-[#5a7d8e] hover:bg-[#eef4f9] hover:text-[#12455a]"
                    }`}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#116cb6]">
                    <span className="text-[10px] font-bold text-white">
                      {user.firstName[0]}
                      {user.lastName[0]}
                    </span>
                  </div>
                  <span className="hidden sm:inline">
                    {user.firstName}
                  </span>
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#5a7d8e] transition-all hover:bg-[#eef4f9] hover:text-[#12455a]"
                  >
                    <LogIn className="h-4 w-4" />
                    <span className="hidden sm:inline">Sign In</span>
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center gap-2 rounded-lg bg-[#116cb6] px-3 py-2 text-sm font-medium text-white transition-all hover:bg-[#0d4d8b]"
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Register</span>
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
