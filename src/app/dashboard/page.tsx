import { getDashboardStats } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building, DollarSign, Package } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
    const { counts, recentDeals } = await getDashboardStats();

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">HS Toolkit Dashboard</h2>
            </div>

            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{counts.contacts}</div>
                        <p className="text-xs text-muted-foreground">
                            Active contacts in CRM
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
                        <Building className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{counts.companies}</div>
                        <p className="text-xs text-muted-foreground">
                            Registered companies
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{counts.deals}</div>
                        <p className="text-xs text-muted-foreground">
                            Deals in pipeline
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                        <div className="h-4 w-4 text-muted-foreground" >🎫</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{counts.tickets}</div>
                        <p className="text-xs text-muted-foreground">
                            Open tickets
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{counts.products}</div>
                        <p className="text-xs text-muted-foreground">
                            Available products
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Deals</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentDeals.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No recent deals.</p>
                            ) : (
                                recentDeals.map((deal: any) => (
                                    <div key={deal.id} className="flex items-center">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                                            <Package className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-medium leading-none">{deal.properties.dealname}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Stage: {deal.properties.dealstage}
                                            </p>
                                        </div>
                                        <div className="ml-auto font-medium">
                                            {deal.properties.amount ? `$${deal.properties.amount}` : "-"}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="mt-4">
                            <Button variant="ghost" className="w-full" asChild>
                                <Link href="/dashboard/deals">
                                    View all deals
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
