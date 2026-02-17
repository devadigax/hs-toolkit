import { Sort } from "@/types/hubspot";

export const OBJECT_PROPERTIES = {
    contacts: ["firstname", "lastname", "email", "phone", "website", "company", "country", "createdate"],
    companies: ["name", "domain", "city", "state", "createdate"],
    deals: ["dealname", "amount", "dealstage", "pipeline", "createdate"],
    tickets: ["subject", "content", "hs_pipeline_stage", "createdate"],
    quotes: ["hs_title", "hs_expiration_date", "createdate"],
    products: ["name", "description", "price", "hs_sku", "hs_status", "createdate"],
    "line-items": ["name", "description", "price", "quantity", "amount", "hs_sku", "createdate"],
    engagements: ["hs_engagement_type", "hs_timestamp", "hs_body_preview", "hubspot_owner_id", "hs_task_subject", "hs_meeting_title", "hs_note_body", "createdate"]
} as const;

export const ASSOCIATION_MAP: Record<string, string[]> = {
    contacts: ["companies", "deals", "tickets", "engagements"],
    companies: ["contacts", "deals", "tickets", "engagements"],
    deals: ["contacts", "companies", "line_items", "tickets", "engagements"],
    tickets: ["contacts", "companies", "deals", "engagements"],
    quotes: ["deals", "line_items"],
    "line-items": ["deals", "quotes"],
    engagements: ["contacts", "companies", "deals", "tickets"],
};

export const DEFAULT_SORT: Sort = { propertyName: "createdate", direction: "DESCENDING" };
