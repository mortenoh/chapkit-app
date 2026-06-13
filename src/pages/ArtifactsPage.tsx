import { useConfig } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { Button, IconChevronDown16, IconChevronRight16, Tag } from '@dhis2/ui'
import React, { FC, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router'
import classes from './ArtifactsPage.module.css'
import CodeBlock from '@/components/CodeBlock'
import { DetailPanel, DetailRow } from '@/components/Detail'
import { Page, PageBody, PageHeader } from '@/components/Page'
import { Empty, ErrorView, Loading } from '@/components/StateViews'
import { RunStatusBadge } from '@/components/Status'
import { Artifact, servicePath, useChapQuery } from '@/lib/chap'
import {
    formatBytes,
    formatDateTime,
    formatDuration,
    relativeTime,
} from '@/lib/format'

function typeLabel(type?: string): string {
    if (type === 'ml_training_workspace') {
        return i18n.t('Training workspace')
    }
    if (type === 'ml_prediction') {
        return i18n.t('Prediction')
    }
    return type ?? i18n.t('Artifact')
}

const TreeNode: FC<{
    node: Artifact
    childrenByParent: Map<string | null, Artifact[]>
    depth: number
    selectedId: string | null
    expanded: Set<string>
    onSelect: (id: string) => void
    onToggle: (id: string) => void
}> = ({
    node,
    childrenByParent,
    depth,
    selectedId,
    expanded,
    onSelect,
    onToggle,
}) => {
    const kids = childrenByParent.get(node.id) ?? []
    const isOpen = expanded.has(node.id)
    const status = node.data?.metadata?.status

    return (
        <div>
            <div
                className={`${classes.node} ${selectedId === node.id ? classes.nodeSelected : ''}`}
                style={{ paddingInlineStart: 8 + depth * 16 }}
                onClick={() => onSelect(node.id)}
            >
                <button
                    className={classes.twisty}
                    onClick={(e) => {
                        e.stopPropagation()
                        if (kids.length) {
                            onToggle(node.id)
                        }
                    }}
                >
                    {kids.length ? (
                        isOpen ? (
                            <IconChevronDown16 />
                        ) : (
                            <IconChevronRight16 />
                        )
                    ) : null}
                </button>
                <div className={classes.nodeText}>
                    <span className={classes.nodeType}>
                        {typeLabel(node.data?.type)}
                    </span>
                    <span className={classes.nodeId}>{node.id}</span>
                </div>
                {status && <RunStatusBadge status={status} />}
            </div>
            {isOpen &&
                kids.map((kid) => (
                    <TreeNode
                        key={kid.id}
                        node={kid}
                        childrenByParent={childrenByParent}
                        depth={depth + 1}
                        selectedId={selectedId}
                        expanded={expanded}
                        onSelect={onSelect}
                        onToggle={onToggle}
                    />
                ))}
        </div>
    )
}

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

const ArtifactsPage: FC = () => {
    const { id = '' } = useParams()
    const artifacts = useChapQuery<Artifact[]>(
        servicePath(id, 'api/v1/artifacts')
    )

    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [expanded, setExpanded] = useState<Set<string>>(new Set())
    const initialized = useRef(false)

    const { childrenByParent, roots, list } = useMemo(() => {
        const items = artifacts.data ?? []
        const byParent = new Map<string | null, Artifact[]>()
        items.forEach((item) => {
            const key = item.parent_id
            byParent.set(key, [...(byParent.get(key) ?? []), item])
        })
        return {
            childrenByParent: byParent,
            roots: byParent.get(null) ?? [],
            list: items,
        }
    }, [artifacts.data])

    useEffect(() => {
        if (!initialized.current && list.length > 0) {
            initialized.current = true
            setSelectedId(list[0].id)
            setExpanded(new Set(roots.map((r) => r.id)))
        }
    }, [list, roots])

    const toggle = (nodeId: string) =>
        setExpanded((prev) => {
            const next = new Set(prev)
            if (next.has(nodeId)) {
                next.delete(nodeId)
            } else {
                next.add(nodeId)
            }
            return next
        })

    const selected = list.find((a) => a.id === selectedId)

    return (
        <Page>
            <PageHeader
                title={i18n.t('Artifacts')}
                subtitle={i18n.t('{{count}} artifact(s) in this service', {
                    count: list.length,
                })}
                actions={
                    <Button small secondary onClick={artifacts.refetch}>
                        {i18n.t('Refresh')}
                    </Button>
                }
            />
            <PageBody>
                {artifacts.loading && !artifacts.data ? (
                    <Loading />
                ) : artifacts.error ? (
                    <ErrorView
                        error={artifacts.error}
                        onRetry={artifacts.refetch}
                    />
                ) : list.length === 0 ? (
                    <Empty>
                        {i18n.t(
                            'No artifacts yet. Run a training or prediction on this service.'
                        )}
                    </Empty>
                ) : (
                    <div className={classes.layout}>
                        <div className={classes.tree}>
                            {roots.map((root) => (
                                <TreeNode
                                    key={root.id}
                                    node={root}
                                    childrenByParent={childrenByParent}
                                    depth={0}
                                    selectedId={selectedId}
                                    expanded={expanded}
                                    onSelect={setSelectedId}
                                    onToggle={toggle}
                                />
                            ))}
                        </div>
                        <div className={classes.detail}>
                            {selected ? (
                                <ArtifactDetail
                                    serviceId={id}
                                    artifact={selected}
                                />
                            ) : (
                                <Empty>
                                    {i18n.t(
                                        'Select an artifact to inspect it.'
                                    )}
                                </Empty>
                            )}
                        </div>
                    </div>
                )}
            </PageBody>
        </Page>
    )
}

export default ArtifactsPage
