"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    Users,
    Building2,
    BadgeDollarSign,
    Ticket,
    Package,
    FileText,
    Activity,
    Wrench,
    ContactRound,
} from "lucide-react";

export function Sidebar({ className }: { className?: string }) {
    const pathname = usePathname();

    const links = [
        {
            href: "/dashboard",
            label: "Dashboard",
            icon: LayoutDashboard,
        },
        {
            href: "/dashboard/users",
            label: "Users",
            icon: Users,
        },
        {
            href: "/dashboard/contacts",
            label: "Contacts",
            icon: ContactRound,
        },
        {
            href: "/dashboard/companies",
            label: "Companies",
            icon: Building2,
        },
        {
            href: "/dashboard/deals",
            label: "Deals",
            icon: BadgeDollarSign,
        },
        {
            href: "/dashboard/products",
            label: "Products",
            icon: Package,
        },
        {
            href: "/dashboard/line-items",
            label: "Line Items",
            icon: Package,
        },
        {
            href: "/dashboard/tickets",
            label: "Tickets",
            icon: Ticket,
        },
        {
            href: "/dashboard/quotes",
            label: "Quotes",
            icon: FileText,
        },
        {
            href: "/dashboard/engagements",
            label: "Engagements",
            icon: Activity,
        },
        {
            href: "/dashboard/tools",
            label: "Tools",
            icon: Wrench,
        },
    ];

    return (
        <div className={cn("pb-12 bg-white dark:bg-black border-r border-border min-h-screen w-64", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-foreground">
                        HS Toolkit
                    </h2>
                    <div className="space-y-1">
                        {links.map((link) => (
                            <Button
                                key={link.href}
                                variant="ghost"
                                className={cn(
                                    "w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted",
                                    pathname === link.href && "bg-muted text-foreground font-medium"
                                )}
                                asChild
                            >
                                <Link href={link.href}>
                                    <link.icon className="mr-2 h-4 w-4" />
                                    {link.label}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
