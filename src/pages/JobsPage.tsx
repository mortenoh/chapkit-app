import i18n from '@dhis2/d2-i18n'
import { Button, Tag } from '@dhis2/ui'
import React, { FC, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import classes from './JobsPage.module.css'
import ArtifactDetail from '@/components/ArtifactDetail'
import CodeBlock from '@/components/CodeBlock'
import { DetailPanel, DetailRow } from '@/components/Detail'
import { Page, PageBody, PageHeader } from '@/components/Page'
import { Empty, ErrorView, Loading } from '@/components/StateViews'
import { RunStatusBadge } from '@/components/Status'
import {
    Artifact,
    Job,
    servicePath,
    useChapQuery,
    useJobArtifactId,
} from '@/lib/chap'
import { formatDateTime, formatDuration, relativeTime } from '@/lib/format'

function jobDuration(job: Job): number | null {
    if (!job.started_at) {
        return null
    }
    const end = job.finished_at
        ? new Date(job.finished_at).getTime()
        : Date.now()
    return (end - new Date(job.started_at).getTime()) / 1000
}

/** Detail for one job: its record, plus the result artifact it produced. */
const JobDetail: FC<{ serviceId: string; job: Job }> = ({ serviceId, job }) => {
    const navigate = useNavigate()
    const { artifactId, loading: artifactIdLoading } = useJobArtifactId(
        serviceId,
        job.id,
        job.status
    )
    const artifact = useChapQuery<Artifact>(
        artifactId
            ? servicePath(serviceId, `api/v1/artifacts/${artifactId}`)
            : null
    )
    const failed = job.status === 'failed' || job.status === 'error'

    return (
        <div className={classes.detailStack}>
            <DetailPanel
                title={
                    <span className={classes.detailTitle}>
                        {i18n.t('Job')}
                        <span className={classes.jobId}>{job.id}</span>
                        {failed && <Tag negative>{job.status}</Tag>}
                    </span>
                }
            >
                <DetailRow label={i18n.t('Status')}>
                    <RunStatusBadge status={job.status} />
                </DetailRow>
                <DetailRow label={i18n.t('Submitted')}>
                    {formatDateTime(job.submitted_at)}
                </DetailRow>
                <DetailRow label={i18n.t('Started')}>
                    {formatDateTime(job.started_at)}
                </DetailRow>
                <DetailRow label={i18n.t('Finished')}>
                    {formatDateTime(job.finished_at)}
                </DetailRow>
                <DetailRow label={i18n.t('Duration')}>
                    {formatDuration(jobDuration(job))}
                </DetailRow>
                <DetailRow label={i18n.t('Result artifact')}>
                    {artifactIdLoading ? (
                        <span className={classes.muted}>
                            {i18n.t('Resolving…')}
                        </span>
                    ) : artifactId ? (
                        <Button
                            small
                            secondary
                            onClick={() =>
                                navigate(
                                    `/services/${encodeURIComponent(serviceId)}/artifacts?artifact=${artifactId}`
                                )
                            }
                        >
                            {i18n.t('Open in Artifacts')}
                        </Button>
                    ) : (
                        <span className={classes.muted}>{i18n.t('none')}</span>
                    )}
                </DetailRow>
                {job.error && (
                    <DetailRow label={i18n.t('Error')}>{job.error}</DetailRow>
                )}
                {job.error_traceback && (
                    <div className={classes.traceback}>
                        <CodeBlock>{job.error_traceback}</CodeBlock>
                    </div>
                )}
            </DetailPanel>

            {artifact.loading && <Loading />}
            {artifact.data && (
                <ArtifactDetail
                    serviceId={serviceId}
                    artifact={artifact.data}
                />
            )}
        </div>
    )
}

const JobsPage: FC = () => {
    const { id = '' } = useParams()
    const jobs = useChapQuery<Job[]>(servicePath(id, 'api/v1/jobs'))
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const initialized = useRef(false)

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

    // Auto-select the first (most recent) job, like the artifact browser.
    useEffect(() => {
        if (!initialized.current && list.length > 0) {
            initialized.current = true
            setSelectedId(list[0].id)
        }
    }, [list])

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
                    <div className={classes.layout}>
                        <div className={classes.list}>
                            {list.map((job) => (
                                <div
                                    key={job.id}
                                    className={`${classes.item} ${selectedId === job.id ? classes.itemSelected : ''}`}
                                    onClick={() => setSelectedId(job.id)}
                                >
                                    <RunStatusBadge status={job.status} />
                                    <div className={classes.itemMeta}>
                                        <span className={classes.itemWhen}>
                                            {relativeTime(job.submitted_at)}
                                        </span>
                                        <span className={classes.itemDur}>
                                            {formatDuration(jobDuration(job))}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className={classes.detail}>
                            {selected ? (
                                <JobDetail
                                    key={selected.id}
                                    serviceId={id}
                                    job={selected}
                                />
                            ) : (
                                <Empty>
                                    {i18n.t('Select a job to see details.')}
                                </Empty>
                            )}
                        </div>
                    </div>
                )}
            </PageBody>
        </Page>
    )
}

export default JobsPage
