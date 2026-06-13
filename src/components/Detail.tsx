import React, { FC, ReactNode } from 'react'
import classes from './Detail.module.css'

/** Label/value row for a definition-style detail view. */
export const DetailRow: FC<{ label: string; children: ReactNode }> = ({
    label,
    children,
}) => (
    <div className={classes.row}>
        <div className={classes.rowLabel}>{label}</div>
        <div className={classes.rowValue}>{children}</div>
    </div>
)

/** Bordered card with an uppercase section title. */
export const DetailPanel: FC<{ title: ReactNode; children: ReactNode }> = ({
    title,
    children,
}) => (
    <section className={classes.panel}>
        <h2 className={classes.panelTitle}>{title}</h2>
        {children}
    </section>
)
