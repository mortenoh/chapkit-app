/** Fetch a URL and trigger a real browser download with the server filename. */
export async function downloadFile(
    url: string,
    fallbackName: string
): Promise<void> {
    // A cross-origin <a download> is ignored by the browser, so fetch the
    // bytes and save them from a same-origin blob URL instead.
    const response = await fetch(url, { credentials: 'include' })
    if (!response.ok) {
        throw new Error(`Download failed (${response.status})`)
    }
    const blob = await response.blob()
    const disposition = response.headers.get('content-disposition') ?? ''
    const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i)
    const name = match ? decodeURIComponent(match[1]) : fallbackName

    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = name
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(objectUrl)
}
