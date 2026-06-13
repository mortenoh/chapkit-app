import i18n from '@dhis2/d2-i18n'
import {
    Button,
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
    DataTableHead,
    DataTableRow,
    Tag,
} from '@dhis2/ui'
import React, { FC, ReactNode, useEffect } from 'react'
import { useParams } from 'react-router'
import classes from './JobsPage.module.css'
import CodeBlock from '@/components/CodeBlock'
import { DetailPanel, DetailRow } from '@/components/Detail'
import { Page, PageBody, PageHeader } from '@/components/Page'
import { Empty, ErrorView, Loading } from '@/components/StateViews'
import { RunStatusBadge } from '@/components/Status'
import { Job, servicePath, useChapQuery } from '@/lib/chap'
import { formatDateTime, formatDuration, relativeTime } from '@/lib/format'

// DataTableRow's runtime accepts onClick though its types omit it.
const ClickableRow = DataTableRow as unknown as FC<{
    onClick?: () => void
    children: ReactNode
}>

function jobDuration(job: Job): number | null {
    if (!job.started_at) {
        return null
    }
    const end = job.finished_at
        ? new Date(job.finished_at).getTime()
        : Date.now()
    return (end - new Date(job.started_at).getTime()) / 1000
}

const JobsPage: FC = () => {
    const { id = '' } = useParams()
    const jobs = useChapQuery<Job[]>(servicePath(id, 'api/v1/jobs'))
    const [selectedId, setSelectedId] = React.useState<string | null>(null)

    const list = jobs.data ?? []
    const anyRunning = list.some(
        (j) => j.status === 'running' || j.status === 'pending'
    )

    // Poll while something is in flight so running jobs settle on their own.
    useEffect(() => {
        if (!anyRunning) {
            return
        }
        const handle = setInterval(jobs.refetch, 4000)
        return () => clearInterval(handle)
    }, [anyRunning, jobs.refetch])

    const selected = list.find((j) => j.id === selectedId)

    return (
        <Page>
            <PageHeader
                title={i18n.t('Jobs')}
                subtitle={i18n.t('{{count}} job(s){{live}}', {
                    count: list.length,
                    live: anyRunning ? i18n.t(' · auto-refreshing') : '',
                })}
                actions={
                    <Button small secondary onClick={jobs.refetch}>
                        {i18n.t('Refresh')}
                    </Button>
                }
            />
            <PageBody>
                {jobs.loading && !jobs.data ? (
                    <Loading />
                ) : jobs.error ? (
                    <ErrorView error={jobs.error} onRetry={jobs.refetch} />
                ) : list.length === 0 ? (
                    <Empty>{i18n.t('No jobs have been submitted yet.')}</Empty>
                ) : (
                    <div className={classes.stack}>
                        <DataTable>
                            <DataTableHead>
                                <DataTableRow>
                                    <DataTableColumnHeader>
                                        {i18n.t('Status')}
                                    </DataTableColumnHeader>
                                    <DataTableColumnHeader>
                                        {i18n.t('Submitted')}
                                    </DataTableColumnHeader>
                                    <DataTableColumnHeader>
                                        {i18n.t('Started')}
                                    </DataTableColumnHeader>
                                    <DataTableColumnHeader>
                                        {i18n.t('Finished')}
                                    </DataTableColumnHeader>
                                    <DataTableColumnHeader>
                                        {i18n.t('Duration')}
                                    </DataTableColumnHeader>
                                </DataTableRow>
                            </DataTableHead>
                            <DataTableBody>
                                {list.map((job) => (
                                    <ClickableRow
                                        key={job.id}
                                        onClick={() => setSelectedId(job.id)}
                                    >
                                        <DataTableCell>
                                            <RunStatusBadge
                                                status={job.status}
                                            />
                                        </DataTableCell>
                                        <DataTableCell>
                                            {relativeTime(job.submitted_at)}
                                        </DataTableCell>
                                        <DataTableCell>
                                            {relativeTime(job.started_at)}
                                        </DataTableCell>
                                        <DataTableCell>
                                            {job.finished_at
                                                ? relativeTime(job.finished_at)
                                                : '—'}
                                        </DataTableCell>
                                        <DataTableCell>
                                            {formatDuration(jobDuration(job))}
                                        </DataTableCell>
                                    </ClickableRow>
                                ))}
                            </DataTableBody>
                        </DataTable>

                        {selected && (
                            <DetailPanel
                                title={
                                    <span className={classes.detailTitle}>
                                        {i18n.t('Job')}
                                        <span className={classes.jobId}>
                                            {selected.id}
                                        </span>
                                        {(selected.status === 'failed' ||
                                            selected.status === 'error') && (
                                            <Tag negative>
                                                {selected.status}
                                            </Tag>
                                        )}
                                    </span>
                                }
                            >
                                <DetailRow label={i18n.t('Status')}>
                                    <RunStatusBadge status={selected.status} />
                                </DetailRow>
                                <DetailRow label={i18n.t('Submitted')}>
                                    {formatDateTime(selected.submitted_at)}
                                </DetailRow>
                                <DetailRow label={i18n.t('Started')}>
                                    {formatDateTime(selected.started_at)}
                                </DetailRow>
                                <DetailRow label={i18n.t('Finished')}>
                                    {formatDateTime(selected.finished_at)}
                                </DetailRow>
                                <DetailRow label={i18n.t('Duration')}>
                                    {formatDuration(jobDuration(selected))}
                                </DetailRow>
                                {selected.error && (
                                    <DetailRow label={i18n.t('Error')}>
                                        {selected.error}
                                    </DetailRow>
                                )}
                                {selected.error_traceback && (
                                    <div className={classes.traceback}>
                                        <CodeBlock>
                                            {selected.error_traceback}
                                        </CodeBlock>
                                    </div>
                                )}
                            </DetailPanel>
                        )}
                    </div>
                )}
            </PageBody>
        </Page>
    )
}

export default JobsPage
