import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
// import specific types if available from hubspot client
// but for simplicity using any for now or defined interface

import Link from "next/link";
// ... imports

// using any to avoid type mismatch with HubSpot SDK return types
export function ContactsTable({ data }: { data: any[] }) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Createdate</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                No results.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((contact) => {
                            const firstName = contact.properties.firstname || "";
                            const lastName = contact.properties.lastname || "";
                            const fullName = `${firstName} ${lastName}`.trim();
                            const displayName = fullName || contact.id;

                            return (
                                <TableRow key={contact.id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/dashboard/contacts/${contact.id}`} className="text-blue-600 hover:underline">
                                            {displayName}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{contact.properties.email}</TableCell>
                                    <TableCell>{contact.properties.phone}</TableCell>
                                    <TableCell>{contact.properties.company}</TableCell>
                                    <TableCell>{contact.properties.country}</TableCell>
                                    <TableCell>
                                        {contact.properties.createdate ? new Date(contact.properties.createdate).toLocaleDateString() : ""}
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
