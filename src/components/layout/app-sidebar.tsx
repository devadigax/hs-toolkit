"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
    Calendar,
} from "lucide-react";

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";

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
        href: "/dashboard/events",
        label: "Events",
        icon: Calendar,
    },
    {
        href: "/dashboard/tools",
        label: "Tools",
        icon: Wrench,
    },
];

export function AppSidebar({ customObjects = [] }: { customObjects?: any[] }) {
    const pathname = usePathname();

    return (
        <Sidebar variant="inset" collapsible="icon">
            <SidebarHeader>
                <div className="flex items-center gap-2 p-2">
                    <span className="font-bold tracking-tight text-lg group-data-[collapsible=icon]:hidden">
                        HS Toolkit
                    </span>
                    <span className="font-bold tracking-tight text-lg hidden group-data-[collapsible=icon]:block">
                        HS
                    </span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {links.map((link) => (
                                <SidebarMenuItem key={link.href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === link.href}
                                        tooltip={link.label}
                                    >
                                        <Link href={link.href}>
                                            <link.icon className="h-4 w-4" />
                                            <span>{link.label}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {customObjects.length > 0 && (
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {customObjects.map((obj) => (
                                    <SidebarMenuItem key={obj.objectTypeId}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname === `/dashboard/${obj.objectTypeId}`}
                                            tooltip={obj.labels.plural}
                                        >
                                            <Link href={`/dashboard/${obj.objectTypeId}`}>
                                                <Package className="h-4 w-4" />
                                                <span>{obj.labels.plural}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>
        </Sidebar>
    );
}
