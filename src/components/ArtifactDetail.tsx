import { useConfig } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { Button, Tag } from '@dhis2/ui'
import React, { FC, useState } from 'react'
import classes from './ArtifactDetail.module.css'
import CodeBlock, { JsonBlock } from '@/components/CodeBlock'
import DataFramePreview from '@/components/DataFramePreview'
import { DetailPanel, DetailRow } from '@/components/Detail'
import { RunStatusBadge } from '@/components/Status'
import {
    Artifact,
    DataFrameContent,
    isBinaryContent,
    isDataFrameContent,
    servicePath,
} from '@/lib/chap'
import { downloadFile } from '@/lib/download'
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

function fileExtension(contentType?: string | null): string {
    if (!contentType) {
        return 'bin'
    }
    if (contentType.includes('json')) {
        return 'json'
    }
    if (contentType.includes('zip')) {
        return 'zip'
    }
    if (contentType.includes('csv')) {
        return 'csv'
    }
    if (contentType.includes('text')) {
        return 'txt'
    }
    return 'bin'
}

const ContentPreview: FC<{ content: unknown }> = ({ content }) => {
    if (isDataFrameContent(content)) {
        return <DataFramePreview content={content as DataFrameContent} />
    }
    if (typeof content === 'string') {
        return <CodeBlock>{content}</CodeBlock>
    }
    return <JsonBlock value={content} />
}

/** Full detail view for one artifact: metadata, data preview, logs, download. */
const ArtifactDetail: FC<{ serviceId: string; artifact: Artifact }> = ({
    serviceId,
    artifact,
}) => {
    const { baseUrl } = useConfig()
    const [downloading, setDownloading] = useState(false)
    const [downloadError, setDownloadError] = useState<string | null>(null)

    const meta = artifact.data?.metadata ?? {}
    const content = artifact.data?.content
    const contentType = artifact.data?.content_type
    const binary = isBinaryContent(content)
    const dataframe = isDataFrameContent(content)
    const previewable = content !== undefined && content !== null && !binary

    const downloadUrl = `${baseUrl}/api/${servicePath(
        serviceId,
        `api/v1/artifacts/${artifact.id}/$download`
    )}`

    const handleDownload = async () => {
        setDownloading(true)
        setDownloadError(null)
        try {
            await downloadFile(
                downloadUrl,
                `artifact_${artifact.id}.${fileExtension(contentType)}`
            )
        } catch (error) {
            setDownloadError(
                error instanceof Error ? error.message : String(error)
            )
        } finally {
            setDownloading(false)
        }
    }

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
                    {contentType ?? i18n.t('unknown')}
                    {dataframe
                        ? ` · ${(content as DataFrameContent).data.length} rows x ${(content as DataFrameContent).columns.length} columns`
                        : ` · ${formatBytes(artifact.data?.content_size)}`}
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
                    <span className={classes.download}>
                        <Button
                            small
                            secondary
                            loading={downloading}
                            onClick={handleDownload}
                        >
                            {downloading
                                ? i18n.t('Downloading…')
                                : i18n.t('Download file')}
                        </Button>
                        {downloadError && (
                            <span className={classes.error}>
                                {downloadError}
                            </span>
                        )}
                    </span>
                </DetailRow>
            </DetailPanel>

            {previewable && (
                <DetailPanel title={i18n.t('Data')}>
                    <ContentPreview content={content} />
                </DetailPanel>
            )}

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
