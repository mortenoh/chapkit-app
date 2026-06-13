import i18n from '@dhis2/d2-i18n'
import { Button, IconArrowRight16, Tag } from '@dhis2/ui'
import React, { FC } from 'react'
import { useNavigate } from 'react-router'
import classes from './ServicesPage.module.css'
import { useServices } from '@/components/ConnectionGate'
import { Page, PageBody, PageHeader } from '@/components/Page'
import { Empty } from '@/components/StateViews'
import { AssessedStatusBadge } from '@/components/Status'
import { ServiceDetail } from '@/lib/chap'
import { relativeTime } from '@/lib/format'

const ServiceCard: FC<{ service: ServiceDetail }> = ({ service }) => {
    const navigate = useNavigate()
    const { info } = service
    const meta = info.model_metadata ?? {}
    const open = () => navigate(`/services/${encodeURIComponent(service.id)}`)

    return (
        <div
            className={classes.card}
            role="button"
            tabIndex={0}
            onClick={open}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    open()
                }
            }}
        >
            <div className={classes.cardHead}>
                {meta.organization_logo_url && (
                    <img
                        className={classes.logo}
                        src={meta.organization_logo_url}
                        alt=""
                        onError={(e) => {
                            e.currentTarget.style.display = 'none'
                        }}
                    />
                )}
                <div className={classes.cardTitle}>
                    <span className={classes.name}>{info.display_name}</span>
                    {meta.organization && (
                        <span className={classes.org}>{meta.organization}</span>
                    )}
                </div>
                <AssessedStatusBadge status={meta.author_assessed_status} />
            </div>

            {info.description && (
                <p className={classes.description}>{info.description}</p>
            )}

            <div className={classes.tags}>
                <Tag>{i18n.t('v{{version}}', { version: info.version })}</Tag>
                {info.period_type && <Tag neutral>{info.period_type}</Tag>}
                {(info.required_covariates ?? []).map((covariate) => (
                    <Tag key={covariate}>{covariate}</Tag>
                ))}
            </div>

            <div className={classes.cardFoot}>
                <span className={classes.ping}>
                    {service.last_ping_at
                        ? i18n.t('Last ping {{when}}', {
                              when: relativeTime(service.last_ping_at),
                          })
                        : i18n.t('Registered {{when}}', {
                              when: relativeTime(service.registered_at),
                          })}
                </span>
                <Button
                    small
                    secondary
                    icon={<IconArrowRight16 />}
                    onClick={open}
                >
                    {i18n.t('Explore')}
                </Button>
            </div>
        </div>
    )
}

const ServicesPage: FC = () => {
    const { services, refetch } = useServices()

    return (
        <Page>
            <PageHeader
                title={i18n.t('CHAP model services')}
                subtitle={i18n.t(
                    '{{count}} chapkit service(s) registered with chap-core',
                    { count: services.length }
                )}
                actions={
                    <Button small secondary onClick={refetch}>
                        {i18n.t('Refresh')}
                    </Button>
                }
            />
            <PageBody>
                {services.length === 0 ? (
                    <Empty>
                        {i18n.t(
                            'No model services are currently registered with chap-core.'
                        )}
                    </Empty>
                ) : (
                    <div className={classes.grid}>
                        {services.map((service) => (
                            <ServiceCard key={service.id} service={service} />
                        ))}
                    </div>
                )}
            </PageBody>
        </Page>
    )
}

export default ServicesPage
