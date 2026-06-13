import React, { FC } from 'react'
import classes from './Status.module.css'
import { AssessedStatus } from '@/lib/chap'

const ASSESSED_COLORS: Record<AssessedStatus, string> = {
    green: '#1f9d57',
    yellow: '#e6c200',
    orange: '#e8590c',
    red: '#c4183c',
}

/** Coloured traffic-light dot for a CHAP model's assessed status. */
export const AssessedStatusBadge: FC<{ status?: AssessedStatus | null }> = ({
    status,
}) => {
    if (!status) {
        return null
    }
    return (
        <span className={classes.badge}>
            <span
                className={classes.dot}
                style={{ background: ASSESSED_COLORS[status] ?? '#9ba0a8' }}
            />
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    )
}

// success / completed -> green, running -> blue, failed / error -> red
function runStateColor(status: string): string {
    const normalized = status.toLowerCase()
    if (normalized === 'success' || normalized === 'completed') {
        return '#1f9d57'
    }
    if (normalized === 'running' || normalized === 'pending') {
        return '#1565c0'
    }
    if (normalized === 'failed' || normalized === 'error') {
        return '#c4183c'
    }
    return '#6e7a8a'
}

/** Coloured dot + label for a job or artifact run status. */
export const RunStatusBadge: FC<{ status?: string | null }> = ({ status }) => {
    if (!status) {
        return <span className={classes.muted}>—</span>
    }
    return (
        <span className={classes.badge}>
            <span
                className={classes.dot}
                style={{ background: runStateColor(status) }}
            />
            {status}
        </span>
    )
}
