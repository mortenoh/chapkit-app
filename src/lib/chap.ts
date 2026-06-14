import { useConfig, useDataEngine } from '@dhis2/app-runtime'
import { useCallback, useEffect, useState } from 'react'

/**
 * Data layer for talking to CHAP model services (chapkit) through the DHIS2
 * Route API. A DHIS2 route with code `chap` reverse-proxies to chap-core; the
 * chapkit services themselves are reached through chap-core's own read-only
 * proxy at `/v2/services/{id}/run/...`. So a full path is three hops:
 *   DHIS2  /api/routes/chap/run  ->  chap-core /v2  ->  chapkit /api/v1
 */

export const CHAP_ROUTE_CODE = 'chap'

const CHAP_V2 = `routes/${CHAP_ROUTE_CODE}/run/v2`

/** Resource path to chap-core's v2 API, e.g. chapResource('services'). */
export const chapResource = (subpath: string): string => `${CHAP_V2}/${subpath}`

/** Resource path into a chapkit service's own API via the chap-core proxy. */
export const servicePath = (serviceId: string, apiPath: string): string =>
    `${CHAP_V2}/services/${serviceId}/run/${apiPath}`

// --- chap-core v2 service registry ----------------------------------------

export type AssessedStatus = 'gray' | 'red' | 'orange' | 'yellow' | 'green'

export interface ModelMetadata {
    author?: string | null
    author_note?: string | null
    author_assessed_status?: AssessedStatus | null
    contact_email?: string | null
    organization?: string | null
    organization_logo_url?: string | null
    citation_info?: string | null
    repository_url?: string | null
    documentation_url?: string | null
}

export interface ServiceInfo {
    id: string
    display_name: string
    version: string
    description?: string | null
    model_metadata?: ModelMetadata | null
    period_type?: string | null
    min_prediction_periods?: number | null
    max_prediction_periods?: number | null
    allow_free_additional_continuous_covariates?: boolean
    required_covariates?: string[]
    requires_geo?: boolean
}

export interface ServiceDetail {
    id: string
    url: string
    info: ServiceInfo
    registered_at?: string
    last_updated?: string
    last_ping_at?: string
    expires_at?: string
}

export interface ServiceListResponse {
    count: number
    services: ServiceDetail[]
}

// --- chapkit service API (reached via servicePath) ------------------------

export interface ArtifactMetadata {
    status?: string
    config_id?: string | null
    started_at?: string | null
    completed_at?: string | null
    duration_seconds?: number | null
    exit_code?: number | null
    stdout?: string | null
    stderr?: string | null
    [key: string]: unknown
}

export interface ArtifactData {
    type?: string
    metadata?: ArtifactMetadata
    content_type?: string | null
    content_size?: number | null
}

export interface Artifact {
    id: string
    created_at: string
    updated_at: string
    tags: string[]
    data: ArtifactData
    parent_id: string | null
    level: number
    level_label?: string
    hierarchy?: string
    children?: Artifact[]
}

export interface ConfigItem {
    id: string
    created_at: string
    updated_at: string
    tags: string[]
    name: string
    data: Record<string, unknown>
}

export type JobStatus = 'running' | 'completed' | 'failed' | string

export interface Job {
    id: string
    status: JobStatus
    submitted_at: string | null
    started_at: string | null
    finished_at: string | null
    error: string | null
    error_traceback: string | null
}

export interface SystemInfo {
    current_time: string
    timezone: string
    python_version: string
    platform: string
    hostname: string
}

export interface HealthCheck {
    state?: string
    [key: string]: unknown
}

export interface HealthStatus {
    status?: string
    checks?: Record<string, HealthCheck>
    [key: string]: unknown
}

export interface SystemApp {
    name: string
    version: string
    prefix: string
    description: string
    author: string
    entry: string
    is_package: boolean
}

export interface DhRoute {
    id: string
    code: string
    disabled: boolean
}

export interface RoutesResponse {
    routes: DhRoute[]
}

// --- generic query hook ----------------------------------------------------

export interface QueryState<T> {
    data: T | undefined
    loading: boolean
    error: Error | undefined
    refetch: () => void
}

/**
 * Run a single read-only DHIS2 data query and track its state. Pass `null` as
 * the resource to hold the query (e.g. until a dependency resolves). Re-runs
 * when the resource or params change, and on refetch().
 */
export function useChapQuery<T>(
    resource: string | null,
    params?: Record<string, string | number | boolean>
): QueryState<T> {
    const engine = useDataEngine()
    const [data, setData] = useState<T | undefined>(undefined)
    const [loading, setLoading] = useState<boolean>(resource !== null)
    const [error, setError] = useState<Error | undefined>(undefined)
    const [nonce, setNonce] = useState(0)

    const paramsKey = JSON.stringify(params ?? null)
    const refetch = useCallback(() => setNonce((n) => n + 1), [])

    useEffect(() => {
        if (resource === null) {
            setLoading(false)
            return
        }
        let cancelled = false
        setLoading(true)
        setError(undefined)
        engine
            .query({ result: { resource, params: params ?? undefined } })
            .then((res) => {
                if (!cancelled) {
                    setData(res.result as T)
                    setLoading(false)
                }
            })
            .catch((err: unknown) => {
                if (!cancelled) {
                    setError(
                        err instanceof Error ? err : new Error(String(err))
                    )
                    setLoading(false)
                }
            })
        return () => {
            cancelled = true
        }
        // params is captured via paramsKey; engine is stable.
    }, [resource, paramsKey, nonce, engine])

    return { data, loading, error, refetch }
}

/**
 * Read a job's result-artifact id. A completed job links to the artifact it
 * produced, but only the job's `$stream` (server-sent events) carries that
 * `artifact_id` — the list/detail endpoints omit it. We read just the first
 * stream event and stop. `statusKey` (the job's status) re-runs it once the job
 * finishes. Returns null while running or if the job produced no artifact.
 */
export function useJobArtifactId(
    serviceId: string,
    jobId: string | null,
    statusKey?: string
): { artifactId: string | null | undefined; loading: boolean } {
    const { baseUrl } = useConfig()
    const [artifactId, setArtifactId] = useState<string | null | undefined>(
        undefined
    )
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!jobId) {
            setArtifactId(undefined)
            return
        }
        let cancelled = false
        const controller = new AbortController()
        setLoading(true)
        const url = `${baseUrl}/api/${servicePath(serviceId, `api/v1/jobs/${jobId}/$stream`)}`
        fetch(url, { credentials: 'include', signal: controller.signal })
            .then(async (res) => {
                const reader = res.body?.getReader()
                if (!reader) {
                    throw new Error('No stream body')
                }
                const { value } = await reader.read()
                reader.cancel()
                const match = new TextDecoder()
                    .decode(value)
                    .match(/data: (\{.*\})/)
                const record = match ? JSON.parse(match[1]) : {}
                if (!cancelled) {
                    setArtifactId(record.artifact_id ?? null)
                    setLoading(false)
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setArtifactId(null)
                    setLoading(false)
                }
            })
        return () => {
            cancelled = true
            controller.abort()
        }
    }, [serviceId, jobId, statusKey, baseUrl])

    return { artifactId, loading }
}
