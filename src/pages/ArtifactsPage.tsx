import i18n from '@dhis2/d2-i18n'
import { Button, IconChevronDown16, IconChevronRight16 } from '@dhis2/ui'
import React, { FC, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import classes from './ArtifactsPage.module.css'
import ArtifactDetail, { typeLabel } from '@/components/ArtifactDetail'
import { Page, PageBody, PageHeader } from '@/components/Page'
import { Empty, ErrorView, Loading } from '@/components/StateViews'
import { RunStatusBadge } from '@/components/Status'
import { Artifact, servicePath, useChapQuery } from '@/lib/chap'

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

const ArtifactsPage: FC = () => {
    const { id = '' } = useParams()
    const [searchParams] = useSearchParams()
    const wantedId = searchParams.get('artifact')
    const artifacts = useChapQuery<Artifact[]>(
        servicePath(id, 'api/v1/artifacts')
    )

    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [expanded, setExpanded] = useState<Set<string>>(new Set())
    const initialized = useRef(false)

    const { childrenByParent, byId, roots, list } = useMemo(() => {
        const items = artifacts.data ?? []
        const byParent = new Map<string | null, Artifact[]>()
        const index = new Map<string, Artifact>()
        items.forEach((item) => {
            byParent.set(item.parent_id, [
                ...(byParent.get(item.parent_id) ?? []),
                item,
            ])
            index.set(item.id, item)
        })
        return {
            childrenByParent: byParent,
            byId: index,
            roots: byParent.get(null) ?? [],
            list: items,
        }
    }, [artifacts.data])

    // Select the ?artifact= target when present, else the first artifact once.
    useEffect(() => {
        if (list.length === 0) {
            return
        }
        let target: string | null = null
        if (wantedId && byId.has(wantedId)) {
            target = wantedId
        } else if (!initialized.current) {
            target = list[0].id
        }
        if (!target) {
            return
        }
        initialized.current = true
        setSelectedId(target)
        setExpanded((prev) => {
            const next = new Set(prev)
            roots.forEach((r) => next.add(r.id))
            let cursor = byId.get(target)
            while (cursor?.parent_id) {
                next.add(cursor.parent_id)
                cursor = byId.get(cursor.parent_id)
            }
            return next
        })
    }, [list, roots, byId, wantedId])

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

    // The list is content-less; fetch the selected artifact in full (with its
    // content) on demand for the detail pane and data preview.
    const selectedArtifact = useChapQuery<Artifact>(
        selectedId ? servicePath(id, `api/v1/artifacts/${selectedId}`) : null
    )

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
                            {!selectedId ? (
                                <Empty>
                                    {i18n.t(
                                        'Select an artifact to inspect it.'
                                    )}
                                </Empty>
                            ) : selectedArtifact.error ? (
                                <ErrorView
                                    error={selectedArtifact.error}
                                    onRetry={selectedArtifact.refetch}
                                />
                            ) : selectedArtifact.data ? (
                                <ArtifactDetail
                                    serviceId={id}
                                    artifact={selectedArtifact.data}
                                />
                            ) : (
                                <Loading />
                            )}
                        </div>
                    </div>
                )}
            </PageBody>
        </Page>
    )
}

export default ArtifactsPage
