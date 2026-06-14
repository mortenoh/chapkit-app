import { useConfig } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { Tag } from '@dhis2/ui'
import React, { FC } from 'react'
import classes from './ArtifactDetail.module.css'
import CodeBlock from '@/components/CodeBlock'
import { DetailPanel, DetailRow } from '@/components/Detail'
import { RunStatusBadge } from '@/components/Status'
import { Artifact, servicePath } from '@/lib/chap'
import {
    formatBytes,
    formatDateTime,
    formatDuration,
    relativeTime,
} from '@/lib/format'

/** Human label for an artifact's data type. */
export function typeLabel(type?: string): string {
    if (type === 'ml_training_workspace') {
        return i18n.t('Training workspace')
    }
    if (type === 'ml_prediction') {
        return i18n.t('Prediction')
    }
    return type ?? i18n.t('Artifact')
}

/** Full detail view for one artifact: metadata, logs, and a download link. */
const ArtifactDetail: FC<{ serviceId: string; artifact: Artifact }> = ({
    serviceId,
    artifact,
}) => {
    const { baseUrl } = useConfig()
    const meta = artifact.data?.metadata ?? {}
    const downloadUrl = `${baseUrl}/api/${servicePath(
        serviceId,
        `api/v1/artifacts/${artifact.id}/$download`
    )}`

    return (
        <div className={classes.detailStack}>
            <DetailPanel title={typeLabel(artifact.data?.type)}>
                <DetailRow label={i18n.t('ID')}>{artifact.id}</DetailRow>
                <DetailRow label={i18n.t('Level')}>
                    {artifact.level}
                    {artifact.level_label ? ` · ${artifact.level_label}` : ''}
                </DetailRow>
                {artifact.hierarchy && (
                    <DetailRow label={i18n.t('Hierarchy')}>
                        {artifact.hierarchy}
                    </DetailRow>
                )}
                {meta.status && (
                    <DetailRow label={i18n.t('Status')}>
                        <RunStatusBadge status={meta.status} />
                    </DetailRow>
                )}
                {meta.config_id && (
                    <DetailRow label={i18n.t('Config')}>
                        {meta.config_id}
                    </DetailRow>
                )}
                <DetailRow label={i18n.t('Created')}>
                    {formatDateTime(artifact.created_at)} (
                    {relativeTime(artifact.created_at)})
                </DetailRow>
                {meta.started_at && (
                    <DetailRow label={i18n.t('Started')}>
                        {formatDateTime(meta.started_at)}
                    </DetailRow>
                )}
                {meta.completed_at && (
                    <DetailRow label={i18n.t('Completed')}>
                        {formatDateTime(meta.completed_at)}
                    </DetailRow>
                )}
                <DetailRow label={i18n.t('Duration')}>
                    {formatDuration(meta.duration_seconds)}
                </DetailRow>
                {meta.exit_code !== null && meta.exit_code !== undefined && (
                    <DetailRow label={i18n.t('Exit code')}>
                        {meta.exit_code}
                    </DetailRow>
                )}
                <DetailRow label={i18n.t('Content')}>
                    {artifact.data?.content_type ?? i18n.t('unknown')} ·{' '}
                    {formatBytes(artifact.data?.content_size)}
                </DetailRow>
                {artifact.tags.length > 0 && (
                    <DetailRow label={i18n.t('Tags')}>
                        <div className={classes.tags}>
                            {artifact.tags.map((t) => (
                                <Tag key={t}>{t}</Tag>
                            ))}
                        </div>
                    </DetailRow>
                )}
                <DetailRow label={i18n.t('Download')}>
                    <a href={downloadUrl} target="_blank" rel="noreferrer">
                        {i18n.t('Download artifact ({{size}})', {
                            size: formatBytes(artifact.data?.content_size),
                        })}
                    </a>
                </DetailRow>
            </DetailPanel>

            {meta.stdout ? (
                <DetailPanel title={i18n.t('Standard output')}>
                    <CodeBlock>{meta.stdout}</CodeBlock>
                </DetailPanel>
            ) : null}
            {meta.stderr ? (
                <DetailPanel title={i18n.t('Standard error')}>
                    <CodeBlock>{meta.stderr}</CodeBlock>
                </DetailPanel>
            ) : null}
        </div>
    )
}

export default ArtifactDetail
