import React, { FC } from 'react'
import classes from './CodeBlock.module.css'

/** Monospace block for logs (stdout/stderr) or pretty-printed JSON. */
const CodeBlock: FC<{ children: string; muted?: boolean }> = ({
    children,
    muted,
}) => (
    <pre className={`${classes.code} ${muted ? classes.muted : ''}`}>
        {children}
    </pre>
)

/** Render any value as pretty JSON in a CodeBlock. */
export const JsonBlock: FC<{ value: unknown }> = ({ value }) => (
    <CodeBlock>{JSON.stringify(value, null, 2)}</CodeBlock>
)

export default CodeBlock
