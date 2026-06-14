import i18n from '@dhis2/d2-i18n'
import { Button, Tag } from '@dhis2/ui'
import React, { FC, ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router'
import classes from './ServiceOverviewPage.module.css'
import { useServices } from '@/components/ConnectionGate'
import { Page, PageBody, PageHeader } from '@/components/Page'
import { Empty, Loading } from '@/components/StateViews'
import { AssessedStatusBadge } from '@/components/Status'
import { servicePath, SystemInfo, useChapQuery } from '@/lib/chap'
import { formatDateTime, relativeTime } from '@/lib/format'

const Row: FC<{ label: string; children: ReactNode }> = ({
    label,
    children,
}) => (
    <div className={classes.row}>
        <div className={classes.rowLabel}>{label}</div>
        <div className={classes.rowValue}>{children}</div>
    </div>
)

const Panel: FC<{ title: string; children: ReactNode }> = ({
    title,
    children,
}) => (
    <section className={classes.panel}>
        <h2 className={classes.panelTitle}>{title}</h2>
        {children}
    </section>
)

const ServiceOverviewPage: FC = () => {
    const { id = '' } = useParams()
    const navigate = useNavigate()
    const { services } = useServices()
    const service = services.find((s) => s.id === id)

    const system = useChapQuery<SystemInfo>(
        service ? servicePath(id, 'api/v1/system') : null
    )

    if (!service) {
        return (
            <Page>
                <PageHeader title={i18n.t('Service not found')} />
                <PageBody>
                    <Empty>
                        {i18n.t(
                            'No registered service has id "{{id}}". It may have expired.',
                            { id }
                        )}
                        <div className={classes.backLink}>
                            <Button small onClick={() => navigate('/services')}>
                                {i18n.t('Back to services')}
                            </Button>
                        </div>
                    </Empty>
                </PageBody>
            </Page>
        )
    }

    const { info } = service
    const meta = info.model_metadata ?? {}
    const base = `/services/${encodeURIComponent(id)}`

    return (
        <Page>
            <PageHeader
                title={info.display_name}
                subtitle={id}
                actions={
                    <>
                        <Button
                            small
                            secondary
                            onClick={() => navigate(`${base}/artifacts`)}
                        >
                            {i18n.t('Artifacts')}
                        </Button>
                        <Button
                            small
                            secondary
                            onClick={() => navigate(`${base}/jobs`)}
                        >
                            {i18n.t('Jobs')}
                        </Button>
                    </>
                }
            />
            <PageBody>
                <div className={classes.columns}>
                    <Panel title={i18n.t('Model')}>
                        <Row label={i18n.t('Version')}>{info.version}</Row>
                        {info.description && (
                            <Row label={i18n.t('Description')}>
                                {info.description}
                            </Row>
                        )}
                        {meta.author_assessed_status && (
                            <Row label={i18n.t('Assessed status')}>
                                <AssessedStatusBadge
                                    status={meta.author_assessed_status}
                                    verbose
                                />
                            </Row>
                        )}
                        {meta.author && (
                            <Row label={i18n.t('Author')}>{meta.author}</Row>
                        )}
                        {meta.organization && (
                            <Row label={i18n.t('Organization')}>
                                {meta.organization}
                            </Row>
                        )}
                        {meta.contact_email && (
                            <Row label={i18n.t('Contact')}>
                                <a href={`mailto:${meta.contact_email}`}>
                                    {meta.contact_email}
                                </a>
                            </Row>
                        )}
                        {meta.citation_info && (
                            <Row label={i18n.t('Citation')}>
                                {meta.citation_info}
                            </Row>
                        )}
                        {meta.repository_url && (
                            <Row label={i18n.t('Repository')}>
                                <a
                                    href={meta.repository_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {meta.repository_url}
                                </a>
                            </Row>
                        )}
                        {meta.documentation_url && (
                            <Row label={i18n.t('Documentation')}>
                                <a
                                    href={meta.documentation_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {meta.documentation_url}
                                </a>
                            </Row>
                        )}
                    </Panel>

                    <Panel title={i18n.t('Modeling')}>
                        {info.period_type && (
                            <Row label={i18n.t('Period type')}>
                                {info.period_type}
                            </Row>
                        )}
                        <Row label={i18n.t('Prediction periods')}>
                            {info.min_prediction_periods ?? 0} –{' '}
                            {info.max_prediction_periods ?? '∞'}
                        </Row>
                        <Row label={i18n.t('Required covariates')}>
                            <div className={classes.chips}>
                                {(info.required_covariates ?? []).length ? (
                                    info.required_covariates?.map((c) => (
                                        <Tag key={c}>{c}</Tag>
                                    ))
                                ) : (
                                    <span className={classes.muted}>
                                        {i18n.t('none')}
                                    </span>
                                )}
                            </div>
                        </Row>
                        <Row label={i18n.t('Extra covariates allowed')}>
                            {info.allow_free_additional_continuous_covariates
                                ? i18n.t('Yes')
                                : i18n.t('No')}
                        </Row>
                        <Row label={i18n.t('Requires geometry')}>
                            {info.requires_geo ? i18n.t('Yes') : i18n.t('No')}
                        </Row>
                    </Panel>

                    <Panel title={i18n.t('Runtime')}>
                        <Row label={i18n.t('Registered')}>
                            {relativeTime(service.registered_at)}
                        </Row>
                        <Row label={i18n.t('Last ping')}>
                            {relativeTime(service.last_ping_at)}
                        </Row>
                        <Row label={i18n.t('Expires')}>
                            {relativeTime(service.expires_at)}
                        </Row>
                        {system.loading && <Loading />}
                        {system.data && (
                            <>
                                <Row label={i18n.t('Python')}>
                                    {system.data.python_version}
                                </Row>
                                <Row label={i18n.t('Platform')}>
                                    {system.data.platform}
                                </Row>
                                <Row label={i18n.t('Hostname')}>
                                    {system.data.hostname}
                                </Row>
                                <Row label={i18n.t('Service time')}>
                                    {formatDateTime(system.data.current_time)}
                                </Row>
                            </>
                        )}
                    </Panel>
                </div>
            </PageBody>
        </Page>
    )
}

export default ServiceOverviewPage
