import i18n from '@dhis2/d2-i18n'
import { Button, Tag } from '@dhis2/ui'
import React, { FC } from 'react'
import { useParams } from 'react-router'
import classes from './SystemPage.module.css'
import { JsonBlock } from '@/components/CodeBlock'
import { DetailPanel, DetailRow } from '@/components/Detail'
import { Page, PageBody, PageHeader } from '@/components/Page'
import { Empty, Loading } from '@/components/StateViews'
import { servicePath, SystemApp, SystemInfo, useChapQuery } from '@/lib/chap'
import { formatDateTime } from '@/lib/format'

const SystemPage: FC = () => {
    const { id = '' } = useParams()
    const system = useChapQuery<SystemInfo>(servicePath(id, 'api/v1/system'))
    const apps = useChapQuery<SystemApp[]>(
        servicePath(id, 'api/v1/system/apps')
    )
    const health = useChapQuery<unknown>(servicePath(id, 'health'))

    return (
        <Page>
            <PageHeader
                title={i18n.t('System')}
                subtitle={i18n.t('Runtime, health and bundled apps')}
                actions={
                    <Button
                        small
                        secondary
                        onClick={() => {
                            system.refetch()
                            apps.refetch()
                            health.refetch()
                        }}
                    >
                        {i18n.t('Refresh')}
                    </Button>
                }
            />
            <PageBody>
                <div className={classes.columns}>
                    <DetailPanel title={i18n.t('Runtime')}>
                        {system.loading && !system.data ? (
                            <Loading />
                        ) : system.data ? (
                            <>
                                <DetailRow label={i18n.t('Service time')}>
                                    {formatDateTime(system.data.current_time)}
                                </DetailRow>
                                <DetailRow label={i18n.t('Timezone')}>
                                    {system.data.timezone}
                                </DetailRow>
                                <DetailRow label={i18n.t('Python')}>
                                    {system.data.python_version}
                                </DetailRow>
                                <DetailRow label={i18n.t('Platform')}>
                                    {system.data.platform}
                                </DetailRow>
                                <DetailRow label={i18n.t('Hostname')}>
                                    {system.data.hostname}
                                </DetailRow>
                            </>
                        ) : (
                            <Empty>{i18n.t('Unavailable')}</Empty>
                        )}
                    </DetailPanel>

                    <DetailPanel title={i18n.t('Health')}>
                        {health.loading && !health.data ? (
                            <Loading />
                        ) : health.data !== undefined ? (
                            <JsonBlock value={health.data} />
                        ) : (
                            <Empty>{i18n.t('Unavailable')}</Empty>
                        )}
                    </DetailPanel>

                    <DetailPanel title={i18n.t('Bundled apps')}>
                        {apps.loading && !apps.data ? (
                            <Loading />
                        ) : (apps.data ?? []).length === 0 ? (
                            <Empty>{i18n.t('No bundled apps')}</Empty>
                        ) : (
                            (apps.data ?? []).map((app) => (
                                <div key={app.name} className={classes.app}>
                                    <div className={classes.appHead}>
                                        <span className={classes.appName}>
                                            {app.name}
                                        </span>
                                        <Tag>
                                            {i18n.t('v{{version}}', {
                                                version: app.version,
                                            })}
                                        </Tag>
                                        <span className={classes.appPrefix}>
                                            {app.prefix}
                                        </span>
                                    </div>
                                    {app.description && (
                                        <p className={classes.appDesc}>
                                            {app.description}
                                        </p>
                                    )}
                                </div>
                            ))
                        )}
                    </DetailPanel>
                </div>
            </PageBody>
        </Page>
    )
}

export default SystemPage
