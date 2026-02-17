import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench } from "lucide-react";
import { CopyEngagementsCard } from "@/components/tools/copy-engagements-card";
import { UnlinkEngagementsCard } from "@/components/tools/unlink-engagements-card";
import { AssociateObjectsCard } from "@/components/tools/associate-objects-card";
import { SubmitIdeaCard } from "@/components/tools/submit-idea-card";

export default function ToolsPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Tools</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <CopyEngagementsCard />
                <UnlinkEngagementsCard />
                <AssociateObjectsCard />
                <SubmitIdeaCard />

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-base font-medium">
                            Coming Soon
                        </CardTitle>
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold">New Tools</div>
                        <p className="text-xs text-muted-foreground mt-2">
                            More tools will be added here soon.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
