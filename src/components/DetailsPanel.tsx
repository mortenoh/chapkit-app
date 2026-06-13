import { useConfig } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { Button, ButtonStrip, Card, IconCross24 } from '@dhis2/ui'
import React, { FC, ReactNode } from 'react'
import classes from './DetailsPanel.module.css'

interface DetailsPanelProps {
    displayName: string
    onClose: () => void
    onEdit?: () => void
    children: ReactNode
}

/**
 * Right-side details drawer, matching the metadata-management app's
 * DetailsPanel: "Details" header + close, item name, Edit, then a list of
 * DetailItem rows. Pair with <DetailItem> and <ApiUrlValue>.
 */
const DetailsPanel: FC<DetailsPanelProps> = ({
    displayName,
    onClose,
    onEdit,
    children,
}) => (
    <aside className={classes.detailsPanel}>
        <Card className={classes.card}>
            <div className={classes.wrapper}>
                <header className={classes.header}>
                    <span className={classes.headerTitle}>
                        {i18n.t('Details')}
                    </span>
                    <button className={classes.closeButton} onClick={onClose}>
                        <IconCross24 />
                    </button>
                </header>
                <div className={classes.title}>{displayName}</div>
                {onEdit && (
                    <ButtonStrip>
                        <Button small secondary onClick={onEdit}>
                            {i18n.t('Edit')}
                        </Button>
                    </ButtonStrip>
                )}
                <div className={classes.list}>{children}</div>
            </div>
        </Card>
    </aside>
)

export const DetailItem: FC<{ label: string; children: ReactNode }> = ({
    label,
    children,
}) => (
    <div className={classes.item}>
        <div className={classes.itemLabel}>{label}</div>
        <div className={classes.itemValue}>{children}</div>
    </div>
)

export const ApiUrlValue: FC<{ path: string }> = ({ path }) => {
    const { baseUrl } = useConfig()
    const url = `${baseUrl}/api/${path}`
    return (
        <span>
            <a href={url} target="_blank" rel="noopener noreferrer">
                {i18n.t('API URL link')}
            </a>
            <Button
                className={classes.itemValueButton}
                small
                secondary
                onClick={() => navigator.clipboard.writeText(url)}
            >
                {i18n.t('Copy')}
            </Button>
        </span>
    )
}

export default DetailsPanel
