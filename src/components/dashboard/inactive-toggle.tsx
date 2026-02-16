"use client"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

export function InactiveToggle() {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const { replace } = useRouter()

    // Default is false (hidden)
    const showInactive = searchParams.get('showInactive') === 'true'

    function handleCheckedChange(checked: boolean) {
        const params = new URLSearchParams(searchParams.toString())
        if (checked) {
            params.set('showInactive', 'true')
        } else {
            params.delete('showInactive')
        }
        replace(`${pathname}?${params.toString()}`)
    }

    return (
        <div className="flex items-center space-x-2">
            <Switch id="show-inactive" checked={showInactive} onCheckedChange={handleCheckedChange} />
            <Label htmlFor="show-inactive">Show Inactive</Label>
        </div>
    )
}
