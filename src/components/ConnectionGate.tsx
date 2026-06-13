import i18n from '@dhis2/d2-i18n'
import { Button, IconWarning24, NoticeBox } from '@dhis2/ui'
import React, { createContext, FC, ReactNode, useContext } from 'react'
import classes from './ConnectionGate.module.css'
import { ErrorView, Loading } from './StateViews'
import {
    chapResource,
    CHAP_ROUTE_CODE,
    RoutesResponse,
    ServiceDetail,
    ServiceListResponse,
    useChapQuery,
} from '@/lib/chap'

interface ServicesContextValue {
    services: ServiceDetail[]
    refetch: () => void
}

const ServicesContext = createContext<ServicesContextValue | null>(null)

/** Access the registered CHAP services loaded by the connection gate. */
export function useServices(): ServicesContextValue {
    const value = useContext(ServicesContext)
    if (!value) {
        throw new Error('useServices must be used within ConnectionGate')
    }
    return value
}

const SetupScreen: FC<{
    title: string
    children: ReactNode
    onRetry: () => void
}> = ({ title, children, onRetry }) => (
    <div className={classes.setup}>
        <div className={classes.setupCard}>
            <div className={classes.setupIcon}>
                <IconWarning24 />
            </div>
            <h1 className={classes.setupTitle}>{title}</h1>
            <div className={classes.setupBody}>{children}</div>
            <Button primary onClick={onRetry}>
                {i18n.t('Retry connection')}
            </Button>
        </div>
    </div>
)

/**
 * Verifies — before anything else — that a DHIS2 route with code `chap`
 * exists and that chap-core answers through it. Renders a setup screen when it
 * does not, otherwise provides the registered services to the explorer.
 */
const ConnectionGate: FC<{ children: ReactNode }> = ({ children }) => {
    const routes = useChapQuery<RoutesResponse>('routes', {
        fields: 'id,code,disabled',
        filter: `code:eq:${CHAP_ROUTE_CODE}`,
    })

    const route = routes.data?.routes?.[0]
    const routesResolved = !routes.loading && !routes.error
    const hasRoute = !!route && !route.disabled

    const services = useChapQuery<ServiceListResponse>(
        routesResolved && hasRoute ? chapResource('services') : null
    )

    if (routes.loading) {
        return <Loading label={i18n.t('Checking the CHAP connection…')} />
    }

    if (routes.error) {
        return (
            <ErrorView
                title={i18n.t('Could not query DHIS2 routes')}
                error={routes.error}
                onRetry={routes.refetch}
            />
        )
    }

    if (!route) {
        return (
            <SetupScreen
                title={i18n.t('No CHAP route configured')}
                onRetry={routes.refetch}
            >
                <p>
                    {i18n.t(
                        'This app reaches the CHAP modeling platform through a DHIS2 route with code "{{code}}", but no such route exists on this instance.',
                        { code: CHAP_ROUTE_CODE }
                    )}
                </p>
                <p>
                    {i18n.t(
                        'Create a wildcard route with code "{{code}}" that forwards to your chap-core server (for example http://chap:8000/**), then retry.',
                        { code: CHAP_ROUTE_CODE }
                    )}
                </p>
            </SetupScreen>
        )
    }

    if (route.disabled) {
        return (
            <SetupScreen
                title={i18n.t('The CHAP route is disabled')}
                onRetry={routes.refetch}
            >
                <p>
                    {i18n.t(
                        'A route with code "{{code}}" exists but is disabled. Enable it in DHIS2 and retry.',
                        { code: CHAP_ROUTE_CODE }
                    )}
                </p>
            </SetupScreen>
        )
    }

    if (services.loading) {
        return <Loading label={i18n.t('Connecting to chap-core…')} />
    }

    if (services.error || !services.data) {
        return (
            <SetupScreen
                title={i18n.t('chap-core did not respond')}
                onRetry={services.refetch}
            >
                <p>
                    {i18n.t(
                        'The "{{code}}" route exists, but chap-core did not answer through it. Check that chap-core is running and reachable from DHIS2.',
                        { code: CHAP_ROUTE_CODE }
                    )}
                </p>
                {services.error && (
                    <NoticeBox error title={i18n.t('Details')}>
                        {services.error.message}
                    </NoticeBox>
                )}
            </SetupScreen>
        )
    }

    return (
        <ServicesContext.Provider
            value={{
                services: services.data.services ?? [],
                refetch: services.refetch,
            }}
        >
            {children}
        </ServicesContext.Provider>
    )
}

export default ConnectionGate
