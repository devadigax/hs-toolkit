export interface HubSpotObject {
    id: string;
    properties: Record<string, any>;
    createdAt: string;
    updatedAt: string;
    associations?: Record<string, HubSpotAssociation>;
}

export interface HubSpotAssociation {
    results: HubSpotAssociationResult[];
}

export interface HubSpotAssociationResult {
    id: string;
    type: string;
}

export interface SearchResult<T = any> {
    total: number;
    results: T[];
    paging?: {
        next?: {
            after: string;
            link?: string;
        };
    };
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
    // Define properties based on actual API response, usually has daily limits and current usage
    daily?: {
        usage: number;
        limit: number;
    };
    // Add other fields as discovered
}
