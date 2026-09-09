export function mergeProperties(baseProperties: string[], requestedProperties: string[] = []) {
    return Array.from(new Set([...baseProperties, ...requestedProperties.filter(Boolean)]));
}
