import { Sort } from "@/types/hubspot";

export const OBJECT_PROPERTIES = {
    contacts: ["firstname", "lastname", "email", "phone", "website", "company", "country", "createdate", "lastmodifieddate", "lifecyclestage", "jobtitle", "industry", "hs_updated_by_user_id", "hs_object_source"],
    companies: ["name", "domain", "city", "state", "country", "industry", "phone", "website", "createdate", "lastmodifieddate", "lifecyclestage", "hs_updated_by_user_id", "hs_object_source"],
    deals: ["dealname", "amount", "dealstage", "pipeline", "closedate", "dealtype", "createdate", "lastmodifieddate", "hs_updated_by_user_id", "hs_object_source"],
    tickets: ["subject", "content", "hs_pipeline", "hs_pipeline_stage", "hs_ticket_priority", "hs_ticket_category", "createdate", "lastmodifieddate", "hs_updated_by_user_id", "hs_object_source"],
    quotes: ["hs_title", "hs_expiration_date", "hs_status", "hs_quote_amount", "createdate", "lastmodifieddate", "hs_updated_by_user_id", "hs_object_source"],
    products: ["name", "description", "price", "hs_sku", "hs_status", "hs_folder_id", "createdate", "lastmodifieddate", "hs_updated_by_user_id", "hs_object_source"],
    "line-items": ["name", "description", "price", "quantity", "amount", "hs_sku", "discount", "createdate", "lastmodifieddate", "hs_updated_by_user_id", "hs_object_source"],
    engagements: ["hs_engagement_type", "hs_timestamp", "hs_body_preview", "hubspot_owner_id", "hs_task_subject", "hs_meeting_title", "hs_note_body", "hs_task_status", "createdate", "lastmodifieddate", "hs_updated_by_user_id", "hs_object_source"],
    "events": ["eventName", "eventDescription", "eventOrganizer", "eventType", "startDateTime", "endDateTime", "externalEventId", "externalAccountId", "createdAt", "updatedAt"]
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
