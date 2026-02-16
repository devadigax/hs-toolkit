import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

export default function SupportPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Support</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Help Center
                        </CardTitle>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">Need Help?</div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Contact support or view documentation.
                        </p>
                    </CardContent>
                </Card>

                <Card className="col-span-1 md:col-span-2">
                    <CardHeader>
                        <CardTitle>About HS Toolkit</CardTitle>
                        <CardDescription>
                            A HubSpot Toolkit dashboard application built with Next.js, Shadcn/UI, and the HubSpot API.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="text-sm font-semibold mb-1">Open Source</h4>
                            <p className="text-sm text-muted-foreground">
                                This project is open source. You can view the source code, report issues, or contribute on GitHub.
                            </p>
                            <a
                                href="https://github.com/devadigax/hs-toolkit"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-500 hover:underline inline-block mt-1"
                            >
                                https://github.com/devadigax/hs-toolkit
                            </a>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold mb-1">Developer</h4>
                            <p className="text-sm text-muted-foreground">
                                Developed by <strong>@devadigax</strong>.
                            </p>
                            <a
                                href="https://www.linkedin.com/in/devadigax"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-500 hover:underline inline-block mt-1"
                            >
                                https://www.linkedin.com/in/devadigax
                            </a>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
