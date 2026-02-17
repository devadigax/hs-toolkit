"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    superAdmin: boolean;
    roleId?: string;
    roleIds?: string[];
    primaryTeamId?: string;
    secondaryTeamIds?: string[];
    sendWelcomeEmail?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

interface UsersTableProps {
    users: User[];
}

export function UsersTable({ users }: UsersTableProps) {
    if (!users || users.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                No users found.
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px]">ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role ID</TableHead>
                        <TableHead>Super Admin</TableHead>
                        <TableHead>Teams</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Updated</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                                {user.id}
                            </TableCell>
                            <TableCell className="font-medium">
                                {user.firstName} {user.lastName}
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                                {user.roleIds && user.roleIds.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                        {user.roleIds.map(role => (
                                            <Badge key={role} variant="outline" className="text-xs">
                                                {role}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground text-sm">-</span>
                                )}
                            </TableCell>
                            <TableCell>
                                {user.superAdmin ? (
                                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">Yes</Badge>
                                ) : (
                                    <Badge variant="secondary">No</Badge>
                                )}
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1">
                                    {user.primaryTeamId && (
                                        <div className="text-xs">
                                            <span className="font-semibold">Primary:</span> {user.primaryTeamId}
                                        </div>
                                    )}
                                    {user.secondaryTeamIds && user.secondaryTeamIds.length > 0 && (
                                        <div className="text-xs">
                                            <span className="font-semibold">Secondary:</span> {user.secondaryTeamIds.join(", ")}
                                        </div>
                                    )}
                                    {!user.primaryTeamId && (!user.secondaryTeamIds || user.secondaryTeamIds.length === 0) && (
                                        <span className="text-muted-foreground text-sm">-</span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                                {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : "-"}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
