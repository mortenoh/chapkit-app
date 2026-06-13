import React, { FC, ReactNode } from 'react'
import classes from './Page.module.css'

/** Full-height column: fixed header + independently scrolling body. */
export const Page: FC<{ children: ReactNode }> = ({ children }) => (
    <div className={classes.page}>{children}</div>
)

export const PageHeader: FC<{
    title: ReactNode
    subtitle?: ReactNode
    actions?: ReactNode
}> = ({ title, subtitle, actions }) => (
    <header className={classes.header}>
        <div className={classes.headingText}>
            <h1 className={classes.title}>{title}</h1>
            {subtitle && <p className={classes.subtitle}>{subtitle}</p>}
        </div>
        {actions && <div className={classes.actions}>{actions}</div>}
    </header>
)

export const PageBody: FC<{ children: ReactNode }> = ({ children }) => (
    <div className={classes.body}>{children}</div>
)
