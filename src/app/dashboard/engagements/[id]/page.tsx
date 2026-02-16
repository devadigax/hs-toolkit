import { getObject } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AssociationsList } from "@/components/dashboard/associations-list";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function EngagementPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const engagement = await getObject("engagements", id);

    if (!engagement) {
        return <div>Engagement not found</div>;
    }

    const { properties, associations } = engagement;

    const formatType = (type: string) => {
        return type ? type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : "Unknown";
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "EMAIL": return "default";
            case "CALL": return "secondary";
            case "MEETING": return "secondary";
            case "TASK": return "outline";
            case "NOTE": return "outline";
            default: return "secondary";
        }
    };

    const getSubject = (props: any) => {
        if (props.hs_task_subject) return props.hs_task_subject;
        if (props.hs_meeting_title) return props.hs_meeting_title;
        if (props.hs_email_subject) return props.hs_email_subject;
        return "No Subject";
    };

    const getBody = (props: any) => {
        if (props.hs_note_body) return props.hs_note_body;
        if (props.hs_body_preview) return props.hs_body_preview;
        if (props.hs_email_text) return props.hs_email_text;
        return null;
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center space-x-4 mb-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/engagements">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex items-center space-x-2">
                    <h2 className="text-3xl font-bold tracking-tight">
                        {getSubject(properties)}
                    </h2>
                    <Badge variant={getTypeColor(properties.hs_engagement_type) as any}>
                        {formatType(properties.hs_engagement_type)}
                    </Badge>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {getBody(properties) && (
                            <div className="prose dark:prose-invert max-w-none">
                                <div dangerouslySetInnerHTML={{ __html: getBody(properties) }} />
                            </div>
                        )}

                        <Separator />

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="font-semibold text-muted-foreground">Date</p>
                                <p>{properties.hs_timestamp ? format(new Date(properties.hs_timestamp), "PPP p") : "-"}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-muted-foreground">Owner ID</p>
                                <p>{properties.hubspot_owner_id || "-"}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-muted-foreground">Type</p>
                                <p>{properties.hs_engagement_type}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="col-span-3">
                    <AssociationsList associations={associations} currentType="engagements" />
                </div>
            </div>
        </div>
    );
}
