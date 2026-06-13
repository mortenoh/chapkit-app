/** Small formatting helpers shared across the explorer pages. */

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1],
]

const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

/** Human "3 minutes ago" style label for an ISO timestamp. */
export function relativeTime(iso: string | null | undefined): string {
    if (!iso) {
        return '—'
    }
    const then = new Date(iso).getTime()
    if (Number.isNaN(then)) {
        return String(iso)
    }
    const diffSeconds = Math.round((then - Date.now()) / 1000)
    const abs = Math.abs(diffSeconds)
    for (const [unit, secondsInUnit] of UNITS) {
        if (abs >= secondsInUnit || unit === 'second') {
            return rtf.format(Math.round(diffSeconds / secondsInUnit), unit)
        }
    }
    return ''
}

/** Locale date-time, e.g. for a details row. */
export function formatDateTime(iso: string | null | undefined): string {
    if (!iso) {
        return '—'
    }
    const date = new Date(iso)
    return Number.isNaN(date.getTime()) ? String(iso) : date.toLocaleString()
}

/** Compact duration label from a number of seconds. */
export function formatDuration(seconds: number | null | undefined): string {
    if (seconds === null || seconds === undefined) {
        return '—'
    }
    if (seconds < 60) {
        return `${seconds.toFixed(seconds < 10 ? 2 : 1)}s`
    }
    const wholeMinutes = Math.floor(seconds / 60)
    const remainder = Math.round(seconds % 60)
    return `${wholeMinutes}m ${remainder}s`
}

/** Byte size as B / KB / MB. */
export function formatBytes(bytes: number | null | undefined): string {
    if (bytes === null || bytes === undefined) {
        return '—'
    }
    if (bytes < 1024) {
        return `${bytes} B`
    }
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
