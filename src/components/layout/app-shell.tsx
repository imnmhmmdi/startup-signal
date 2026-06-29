"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Radio,
  LayoutDashboard,
  Building2,
  TrendingUp,
  Kanban,
  LogIn,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { PRODUCT, NAV_ITEMS } from "@/config/product";
import { getNavItemActiveClasses, getNavItemInactiveClasses } from "@/lib/semantic-colors";

const ICONS = {
  "/": LayoutDashboard,
  "/companies": Building2,
  "/funding": TrendingUp,
  "/pipeline": Kanban,
  "/ingestion": Activity,
} as const;

type AppShellProps = {
  children: React.ReactNode;
  userEmail?: string | null;
};

export function AppShell({ children, userEmail }: AppShellProps) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex w-60 flex-col border-r bg-card fixed inset-y-0 left-0 z-40">
        <div className="p-5 border-b">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Radio className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold leading-tight">{PRODUCT.name}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">
                PM hiring intelligence
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(({ href, label, description }) => {
            const Icon = ICONS[href as keyof typeof ICONS];
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-start gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
                  active ? getNavItemActiveClasses() : getNavItemInactiveClasses()
                )}
              >
                <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p className={cn("text-sm leading-none", active ? "font-semibold" : "font-medium")}>
                    {label}
                  </p>
                  <p className="text-[11px] mt-1 opacity-70">{description}</p>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          {userEmail ? (
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          ) : (
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
            >
              <LogIn className="h-4 w-4 mr-1.5" />
              Sign in
            </Link>
          )}
        </div>
      </aside>

      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        <header className="md:hidden sticky top-0 z-50 border-b bg-background/95 backdrop-blur px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Radio className="h-5 w-5 text-primary" />
            {PRODUCT.name}
          </Link>
          {!userEmail && (
            <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Sign in
            </Link>
          )}
        </header>

        <nav className="md:hidden flex border-b overflow-x-auto">
          {NAV_ITEMS.map(({ href, label }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
