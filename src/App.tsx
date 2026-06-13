import i18n from '@dhis2/d2-i18n'
import { CssVariables } from '@dhis2/ui'
import React, { FC, useState } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router'
import classes from '@/App.module.css'
import ConnectionGate, { useServices } from '@/components/ConnectionGate'
import Sidenav, { NavSection } from '@/components/Sidenav'
import ArtifactsPage from '@/pages/ArtifactsPage'
import ConfigsPage from '@/pages/ConfigsPage'
import JobsPage from '@/pages/JobsPage'
import ServiceOverviewPage from '@/pages/ServiceOverviewPage'
import ServicesPage from '@/pages/ServicesPage'
import SystemPage from '@/pages/SystemPage'

/** The id of the service currently being explored, read from the URL. */
function activeServiceId(
    pathname: string,
    fallback?: string
): string | undefined {
    const match = pathname.match(/^\/services\/([^/]+)/)
    return match ? decodeURIComponent(match[1]) : fallback
}

function buildSections(serviceId: string | undefined): NavSection[] {
    const sections: NavSection[] = [
        {
            label: i18n.t('CHAP'),
            children: [
                { path: '/services', label: i18n.t('Services'), end: true },
            ],
        },
    ]
    if (serviceId) {
        const base = `/services/${encodeURIComponent(serviceId)}`
        sections.push({
            label: i18n.t('Model service'),
            children: [
                { path: base, label: i18n.t('Overview'), end: true },
                { path: `${base}/artifacts`, label: i18n.t('Artifacts') },
                { path: `${base}/jobs`, label: i18n.t('Jobs') },
                { path: `${base}/configs`, label: i18n.t('Configurations') },
                { path: `${base}/system`, label: i18n.t('System') },
            ],
        })
    }
    return sections
}

const Breadcrumb: FC<{ sections: NavSection[] }> = ({ sections }) => {
    const { pathname } = useLocation()
    for (const section of sections) {
        const child = section.children.find((c) => c.path === pathname)
        if (child) {
            return (
                <div className={classes.breadcrumb}>
                    <span className={classes.breadcrumbSection}>
                        {section.label}
                    </span>
                    <span className={classes.breadcrumbSeparator}>/</span>
                    <span className={classes.breadcrumbCurrent}>
                        {child.label}
                    </span>
                </div>
            )
        }
    }
    return null
}

const AppShell: FC = () => {
    const { services } = useServices()
    const { pathname } = useLocation()
    const [navCollapsed, setNavCollapsed] = useState(false)

    const serviceId = activeServiceId(pathname, services[0]?.id)
    const sections = buildSections(serviceId)

    return (
        <div
            className={`${classes.wrapper} ${navCollapsed ? classes.collapsed : ''}`}
        >
            <div className={classes.sidebar}>
                <Sidenav
                    sections={sections}
                    collapsed={navCollapsed}
                    onToggleCollapse={() => setNavCollapsed((v) => !v)}
                />
            </div>
            <main className={classes.main}>
                <Breadcrumb sections={sections} />
                <div className={classes.content}>
                    <Routes>
                        <Route path="/services" element={<ServicesPage />} />
                        <Route
                            path="/services/:id"
                            element={<ServiceOverviewPage />}
                        />
                        <Route
                            path="/services/:id/artifacts"
                            element={<ArtifactsPage />}
                        />
                        <Route
                            path="/services/:id/jobs"
                            element={<JobsPage />}
                        />
                        <Route
                            path="/services/:id/configs"
                            element={<ConfigsPage />}
                        />
                        <Route
                            path="/services/:id/system"
                            element={<SystemPage />}
                        />
                        <Route
                            path="*"
                            element={<Navigate to="/services" replace />}
                        />
                    </Routes>
                </div>
            </main>
        </div>
    )
}

const MyApp: FC = () => (
    <HashRouter>
        <CssVariables colors spacers theme />
        <ConnectionGate>
            <AppShell />
        </ConnectionGate>
    </HashRouter>
)

export default MyApp
