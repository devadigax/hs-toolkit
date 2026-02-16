"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { History } from "lucide-react";
import { getPropertyHistory } from "@/lib/actions";

interface PropertyItemProps {
    label: string;
    value: string | number | null | undefined;
    type: string;
    id: string;
    propertyKey: string;
}

export function PropertyItem({ label, value, type, id, propertyKey }: PropertyItemProps) {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const handleOpenHistory = async () => {
        setOpen(true);
        if (history.length === 0) {
            setLoading(true);
            try {
                const data = await getPropertyHistory(type, id, propertyKey);
                setHistory(data);
            } catch (error) {
                console.error("Failed to fetch history", error);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="flex flex-col space-y-1 border p-3 rounded-md relative group">
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium break-all">{String(value)}</span>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={handleOpenHistory}
                            title="View History"
                        >
                            <History className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>History for {label}</DialogTitle>
                        </DialogHeader>
                        <div className="max-h-[60vh] overflow-y-auto space-y-4">
                            {loading ? (
                                <div className="text-center py-4 text-sm text-muted-foreground">Loading history...</div>
                            ) : history.length === 0 ? (
                                <div className="text-center py-4 text-sm text-muted-foreground">No history available via API.</div>
                            ) : (
                                history.map((item: any, index: number) => (
                                    <div key={index} className="flex flex-col border-b pb-2 last:border-0">
                                        <span className="font-medium text-sm">{item.value}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(item.timestamp).toLocaleString()}
                                        </span>
                                        {item.sourceType && (
                                            <span className="text-xs text-muted-foreground">Source: {item.sourceType}</span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
