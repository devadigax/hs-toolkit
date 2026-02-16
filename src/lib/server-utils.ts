import "server-only";
import crypto from "crypto";

export function hashString(str: string): string {
    return crypto.createHash("sha256").update(str).digest("hex");
}
