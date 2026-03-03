import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { getCustomObjectSchemas } from "@/lib/actions";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const customObjects = await getCustomObjectSchemas();

    return (
        <SidebarProvider>
            <AppSidebar customObjects={customObjects} />
            <SidebarInset className="flex flex-col flex-1 w-full overflow-hidden">
                <Header />
                <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
