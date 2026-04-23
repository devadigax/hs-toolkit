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
    ChevronRight,
} from "lucide-react";

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import type { CustomObjectSchema } from "@/types/hubspot";

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

export function AppSidebar({ customObjects = [] }: { customObjects?: CustomObjectSchema[] }) {
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
                                <Collapsible defaultOpen className="group/collapsible">
                                    <SidebarMenuItem>
                                        <CollapsibleTrigger asChild>
                                            <SidebarMenuButton tooltip="Custom Objects">
                                                <Package className="h-4 w-4" />
                                                <span>Custom Objects</span>
                                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                            </SidebarMenuButton>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {customObjects.map((obj) => (
                                                    <SidebarMenuSubItem key={obj.objectTypeId}>
                                                        <SidebarMenuSubButton
                                                            asChild
                                                            isActive={pathname === `/dashboard/${obj.objectTypeId}`}
                                                        >
                                                            <Link href={`/dashboard/${obj.objectTypeId}`}>
                                                                <span>{obj.labels.plural}</span>
                                                            </Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                ))}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </SidebarMenuItem>
                                </Collapsible>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>
        </Sidebar>
    );
}
