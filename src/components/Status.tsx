import i18n from '@dhis2/d2-i18n'
import React, { FC } from 'react'
import classes from './Status.module.css'
import { AssessedStatus } from '@/lib/chap'

// Labels, descriptions and colours mirror the official DHIS2 Modeling App
// (READINESS_BY_STATUS) so the traffic-light reads the same everywhere.
const ASSESSED: Record<
    AssessedStatus,
    { label: string; description: string; color: string }
> = {
    green: {
        label: i18n.t('Production'),
        description: i18n.t('Approved for general use.'),
        color: '#2e7d32',
    },
    yellow: {
        label: i18n.t('Testing'),
        description: i18n.t(
            'Prepared for more extensive testing; not yet approved for production.'
        ),
        color: '#f57f17',
    },
    orange: {
        label: i18n.t('Limited'),
        description: i18n.t(
            'Tested on a small dataset. Requires manual tuning and close monitoring.'
        ),
        color: '#ef6c00',
    },
    red: {
        label: i18n.t('Experimental'),
        description: i18n.t(
            'An early prototype with no formal validation - only for initial experimentation.'
        ),
        color: '#c62828',
    },
    gray: {
        label: i18n.t('Deprecated'),
        description: i18n.t(
            'This model is not intended for use or has been deprecated.'
        ),
        color: '#666666',
    },
}

/**
 * Traffic-light badge for a CHAP model's assessed status. Shows the readiness
 * label (e.g. "Limited"); `verbose` also appends the official description.
 */
export const AssessedStatusBadge: FC<{
    status?: AssessedStatus | null
    verbose?: boolean
}> = ({ status, verbose }) => {
    if (!status) {
        return null
    }
    const info = ASSESSED[status]
    return (
        <>
            <span className={classes.badge}>
                <span
                    className={classes.dot}
                    style={{ background: info?.color ?? '#9ba0a8' }}
                />
                {info?.label ?? status}
            </span>
            {verbose && info && (
                <span className={classes.assessedDescription}>
                    {' — '}
                    {info.description}
                </span>
            )}
        </>
    )
}

// success / completed -> green, running -> blue, failed / error -> red
const GREEN_STATES = new Set(['success', 'completed', 'healthy', 'ok', 'up'])
const BLUE_STATES = new Set(['running', 'pending', 'started'])
const RED_STATES = new Set(['failed', 'failure', 'error', 'unhealthy', 'down'])

function runStateColor(status: string): string {
    const normalized = status.toLowerCase()
    if (GREEN_STATES.has(normalized)) {
        return '#1f9d57'
    }
    if (BLUE_STATES.has(normalized)) {
        return '#1565c0'
    }
    if (RED_STATES.has(normalized)) {
        return '#c4183c'
    }
    if (normalized === 'degraded' || normalized === 'warning') {
        return '#e8590c'
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
