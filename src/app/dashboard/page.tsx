import { getDashboardStats, getAccountDetails, getDailyApiUsage } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building, DollarSign, Package, Ticket } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/dashboard/refresh-button";

export default async function DashboardPage() {
    const { counts } = await getDashboardStats();
    const accountDetails = await getAccountDetails();
    const apiUsage = await getDailyApiUsage();

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">HS Toolkit Dashboard</h2>
                <div className="flex items-center space-x-2">
                    <RefreshButton />
                </div>
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
                        <Ticket className="h-4 w-4 text-muted-foreground" />
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
                        <CardTitle>Account Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {accountDetails ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Portal ID</p>
                                    <p className="text-sm font-mono">{accountDetails.portalId}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Account Type</p>
                                    <p className="text-sm">{accountDetails.accountType}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Time Zone</p>
                                    <p className="text-sm">{accountDetails.timeZone}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Currency</p>
                                    <p className="text-sm">{accountDetails.companyCurrency}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">UI Domain</p>
                                    <p className="text-sm">{accountDetails.uiDomain}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Data Location</p>
                                    <p className="text-sm">{accountDetails.dataHostingLocation}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-foreground">Could not load account details.</p>
                        )}
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Daily API Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {apiUsage && apiUsage.results && apiUsage.results.length > 0 ? (
                            apiUsage.results.map((usage: any) => (
                                <div key={usage.name} className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">Calls Today</p>
                                            <p className="text-sm text-muted-foreground">
                                                {usage.currentUsage.toLocaleString()} / {usage.usageLimit.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="font-bold">
                                            {Math.round((usage.currentUsage / usage.usageLimit) * 100)}%
                                        </div>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-secondary">
                                        <div
                                            className="h-2 rounded-full bg-primary"
                                            style={{ width: `${Math.min((usage.currentUsage / usage.usageLimit) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground">Resets At</p>
                                            <p className="text-xs font-mono">
                                                {new Date(usage.resetsAt).toLocaleTimeString()}
                                            </p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-xs text-muted-foreground">Status</p>
                                            <p className="text-xs font-mono">{usage.fetchStatus}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">No usage data available.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
