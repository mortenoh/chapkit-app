import i18n from '@dhis2/d2-i18n'
import { Button, CircularLoader, NoticeBox } from '@dhis2/ui'
import React, { FC } from 'react'
import classes from './StateViews.module.css'

/** Centered spinner with an optional label. */
export const Loading: FC<{ label?: string }> = ({ label }) => (
    <div className={classes.center}>
        <CircularLoader />
        {label && <p className={classes.note}>{label}</p>}
    </div>
)

/** Error notice with an optional retry action. */
export const ErrorView: FC<{
    title?: string
    error?: Error | string
    onRetry?: () => void
}> = ({ title, error, onRetry }) => (
    <div className={classes.padded}>
        <NoticeBox error title={title ?? i18n.t('Something went wrong')}>
            {typeof error === 'string' ? error : error?.message}
            {onRetry && (
                <div className={classes.retry}>
                    <Button small onClick={onRetry}>
                        {i18n.t('Retry')}
                    </Button>
                </div>
            )}
        </NoticeBox>
    </div>
)

/** Muted empty-state message. */
export const Empty: FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className={classes.empty}>{children}</div>
)
