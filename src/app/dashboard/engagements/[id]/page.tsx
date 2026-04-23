import { getObject } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AssociationsList } from "@/components/dashboard/associations-list";
import { PropertyGrid } from "@/components/dashboard/property-grid";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";
import type { badgeVariants } from "@/components/ui/badge";
import type { HubSpotObject, HubSpotAssociationCollection } from "@/types/hubspot";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];
type EngagementProperties = Record<string, string | number | boolean | null | undefined>;

export default async function EngagementPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const engagement = await getObject("engagements", id);

    if (!engagement) {
        return <div>Engagement not found</div>;
    }

    const { properties, associations } = engagement as HubSpotObject & {
        associations?: Record<string, HubSpotAssociationCollection>;
    };

    const formatType = (type: string) => {
        return type ? type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : "Unknown";
    };

    const getTypeColor = (type: string): BadgeVariant => {
        switch (type) {
            case "EMAIL": return "default";
            case "CALL": return "secondary";
            case "MEETING": return "secondary";
            case "TASK": return "outline";
            case "NOTE": return "outline";
            default: return "secondary";
        }
    };

    const getSubject = (props: EngagementProperties) => {
        if (props.hs_task_subject) return props.hs_task_subject;
        if (props.hs_meeting_title) return props.hs_meeting_title;
        if (props.hs_email_subject) return props.hs_email_subject;
        return "No Subject";
    };

    const getBody = (props: EngagementProperties): string | null => {
        if (typeof props.hs_note_body === "string") return props.hs_note_body;
        if (typeof props.hs_body_preview === "string") return props.hs_body_preview;
        if (typeof props.hs_email_text === "string") return props.hs_email_text;
        return null;
    }

    const body = getBody(properties);
    const formattedTimestamp =
        typeof properties.hs_timestamp === "string" || typeof properties.hs_timestamp === "number"
            ? format(new Date(properties.hs_timestamp), "PPP p")
            : "-";

    return (
        <div className="flex-1 space-y-4">
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
                    <Badge variant={getTypeColor(String(properties.hs_engagement_type ?? ""))}>
                        {formatType(String(properties.hs_engagement_type ?? ""))}
                    </Badge>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
                <div className="col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {body && (
                                <div className="prose dark:prose-invert max-w-none">
                                    <div dangerouslySetInnerHTML={{ __html: body }} />
                                </div>
                            )}

                            <Separator />

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="font-semibold text-muted-foreground">Date</p>
                                    <p>{formattedTimestamp}</p>
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

                    <Card>
                        <CardHeader>
                            <CardTitle>Properties</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <PropertyGrid properties={properties} type="engagements" id={id} />
                        </CardContent>
                    </Card>
                </div>

                <div className="col-span-1">
                    <AssociationsList associations={associations} />
                </div>
            </div>
        </div >
    );
}
