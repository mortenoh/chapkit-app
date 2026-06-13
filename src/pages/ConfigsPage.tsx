import i18n from '@dhis2/d2-i18n'
import { Button } from '@dhis2/ui'
import React, { FC, ReactNode, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router'
import classes from './ConfigsPage.module.css'
import { JsonBlock } from '@/components/CodeBlock'
import { DetailPanel, DetailRow } from '@/components/Detail'
import { Page, PageBody, PageHeader } from '@/components/Page'
import { Empty, ErrorView, Loading } from '@/components/StateViews'
import { ConfigItem, servicePath, useChapQuery } from '@/lib/chap'
import { formatDateTime, relativeTime } from '@/lib/format'

function renderValue(value: unknown): ReactNode {
    if (Array.isArray(value)) {
        return value.length ? value.join(', ') : '—'
    }
    if (value === null || value === undefined) {
        return '—'
    }
    if (typeof value === 'object') {
        return <JsonBlock value={value} />
    }
    if (typeof value === 'boolean') {
        return value ? i18n.t('Yes') : i18n.t('No')
    }
    return String(value)
}

const ConfigDetail: FC<{ config: ConfigItem }> = ({ config }) => (
    <div className={classes.detailStack}>
        <DetailPanel title={config.name || i18n.t('Configuration')}>
            <DetailRow label={i18n.t('ID')}>{config.id}</DetailRow>
            <DetailRow label={i18n.t('Created')}>
                {formatDateTime(config.created_at)} (
                {relativeTime(config.created_at)})
            </DetailRow>
            <DetailRow label={i18n.t('Updated')}>
                {formatDateTime(config.updated_at)}
            </DetailRow>
        </DetailPanel>
        <DetailPanel title={i18n.t('Parameters')}>
            {Object.entries(config.data ?? {}).map(([key, value]) => (
                <DetailRow key={key} label={key}>
                    {renderValue(value)}
                </DetailRow>
            ))}
        </DetailPanel>
    </div>
)

const ConfigsPage: FC = () => {
    const { id = '' } = useParams()
    const configs = useChapQuery<ConfigItem[]>(
        servicePath(id, 'api/v1/configs')
    )
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const initialized = useRef(false)

    const list = configs.data ?? []

    useEffect(() => {
        if (!initialized.current && list.length > 0) {
            initialized.current = true
            setSelectedId(list[0].id)
        }
    }, [list])

    const selected = list.find((c) => c.id === selectedId)

    return (
        <Page>
            <PageHeader
                title={i18n.t('Configurations')}
                subtitle={i18n.t('{{count}} model configuration(s)', {
                    count: list.length,
                })}
                actions={
                    <Button small secondary onClick={configs.refetch}>
                        {i18n.t('Refresh')}
                    </Button>
                }
            />
            <PageBody>
                {configs.loading && !configs.data ? (
                    <Loading />
                ) : configs.error ? (
                    <ErrorView
                        error={configs.error}
                        onRetry={configs.refetch}
                    />
                ) : list.length === 0 ? (
                    <Empty>
                        {i18n.t('No configurations stored on this service.')}
                    </Empty>
                ) : (
                    <div className={classes.layout}>
                        <div className={classes.list}>
                            {list.map((config) => (
                                <div
                                    key={config.id}
                                    className={`${classes.item} ${selectedId === config.id ? classes.itemSelected : ''}`}
                                    onClick={() => setSelectedId(config.id)}
                                >
                                    <span className={classes.itemName}>
                                        {config.name || config.id}
                                    </span>
                                    <span className={classes.itemMeta}>
                                        {relativeTime(config.created_at)}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className={classes.detail}>
                            {selected ? (
                                <ConfigDetail config={selected} />
                            ) : (
                                <Empty>
                                    {i18n.t('Select a configuration.')}
                                </Empty>
                            )}
                        </div>
                    </div>
                )}
            </PageBody>
        </Page>
    )
}

export default ConfigsPage
