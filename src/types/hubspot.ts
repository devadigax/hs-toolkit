export interface HubSpotObject {
    id: string;
    properties: Record<string, string | number | boolean | null | undefined>;
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
    type?: string;
    associationTypes?: AssociationType[];
    [key: string]: string | number | boolean | null | undefined | AssociationType[];
}

export interface AssociationType {
    category?: string;
    label?: string;
    typeId?: number;
}

export interface HubSpotAssociationCollection {
    results: HubSpotAssociationResult[];
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

export interface ApiUsageResult {
    name: string;
    currentUsage: number;
    usageLimit: number;
    resetsAt: string;
    fetchStatus: string;
}

export interface ApiUsageResponse {
    results: ApiUsageResult[];
}

export interface CustomObjectSchema {
    objectTypeId: string;
    fullyQualifiedName: string;
    primaryDisplayProperty?: string;
    labels: {
        singular: string;
        plural: string;
    };
}

export interface HubSpotPropertyOption {
    hidden: boolean;
    displayOrder?: number;
    description?: string;
    label: string;
    value: string;
}

export interface HubSpotPropertyDefinition {
    createdUserId?: string;
    hidden?: boolean;
    modificationMetadata?: {
        readOnlyOptions?: boolean;
        readOnlyValue: boolean;
        readOnlyDefinition: boolean;
        archivable: boolean;
    };
    displayOrder?: number;
    description: string;
    showCurrencySymbol?: boolean;
    label: string;
    type: string;
    hubspotDefined?: boolean;
    formField?: boolean;
    createdAt?: string;
    archivedAt?: string;
    archived?: boolean;
    groupName: string;
    referencedObjectType?: string;
    name: string;
    options: HubSpotPropertyOption[];
    calculationFormula?: string;
    hasUniqueValue?: boolean;
    fieldType: string;
    updatedUserId?: string;
    calculated?: boolean;
    externalOptions?: boolean;
    updatedAt?: string;
}

export interface SchemaPropertyUpdateInput {
    label: string;
    description: string;
    type: string;
    fieldType: string;
    hidden: boolean;
    formField: boolean;
    options: HubSpotPropertyOption[];
}

export interface MarketingEvent {
    objectId?: string;
    externalEventId?: string;
    eventName?: string;
    eventStatus?: string;
    eventType?: string;
    eventOrganizer?: string;
    startDateTime?: string;
    endDateTime?: string;
    createdAt?: string;
    appInfo?: {
        id?: string;
    };
    [key: string]: unknown;
}

export interface MarketingEventsResponse {
    results: MarketingEvent[];
    paging?: {
        next?: {
            after: string;
        };
    };
}

export interface AssociationBatchReadResult {
    from?: { id?: string };
    _from?: { id?: string };
    to?: HubSpotAssociationResult[];
}

export interface AssociationBatchReadResponse {
    results: AssociationBatchReadResult[];
}
