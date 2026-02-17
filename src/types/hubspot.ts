export interface HubSpotObject {
    id: string;
    properties: Record<string, string | null>;
    createdAt: string;
    updatedAt: string;
    archived?: boolean;
    associations?: Record<string, HubSpotAssociation>;
}

export interface HubSpotAssociation {
    results: HubSpotAssociationResult[];
}

export interface HubSpotAssociationResult {
    id: string;
    type: string;
}

export interface SearchResult<T = HubSpotObject> {
    total: number;
    results: T[];
    paging?: {
        next?: {
            after: string;
            link?: string;
        };
    };
}

export interface Filter {
    propertyName: string;
    operator: string;
    value?: string;
    highValue?: string; // For range checks
    values?: string[]; // For IN operator
}

export interface FilterGroup {
    filters: Filter[];
}

export interface Sort {
    propertyName: string;
    direction: "ASCENDING" | "DESCENDING";
}

export interface HubSpotSearchRequest {
    filterGroups: FilterGroup[];
    sorts: Sort[];
    properties: string[];
    limit: number;
    after?: string;
}

export interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    superAdmin: boolean;
    roleIds?: string[];
    primaryTeamId?: string;
    secondaryTeamIds?: string[];
    sendWelcomeEmail?: boolean;
}

export interface DashboardStats {
    counts: {
        contacts: number;
        companies: number;
        deals: number;
        tickets: number;
        products: number;
    };
}

export interface AccountDetails {
    portalId: number;
    accountType: string;
    timeZone: string;
    companyCurrency: string;
    uiDomain: string;
    dataHostingLocation: string;
}

export interface ApiUsage {
    daily?: {
        usage: number;
        limit: number;
    };
}
