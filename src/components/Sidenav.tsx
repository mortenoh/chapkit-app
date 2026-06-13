import i18n from '@dhis2/d2-i18n'
import { IconChevronDown16, IconChevronLeft16, InputField } from '@dhis2/ui'
import React, { FC, useState } from 'react'
import { NavLink } from 'react-router'
import classes from './Sidenav.module.css'

export interface NavChild {
    path: string
    label: string
    // Match the route exactly (react-router NavLink `end`) so a parent link
    // doesn't stay highlighted on its child routes.
    end?: boolean
}

export interface NavSection {
    label: string
    children: NavChild[]
}

interface SidenavProps {
    sections: NavSection[]
    collapsed: boolean
    onToggleCollapse: () => void
}

/**
 * The "new look" DHIS2 sidebar navigation, as used by the
 * metadata-management app: dark, grouped/collapsible, filterable.
 * Styling adapted from dhis2/metadata-management-app (design-specs sidenav).
 */
const Sidenav: FC<SidenavProps> = ({
    sections,
    collapsed,
    onToggleCollapse,
}) => {
    const [filter, setFilter] = useState('')
    const [closed, setClosed] = useState<Set<string>>(new Set())

    const filtering = filter.trim().length > 0
    const term = filter.trim().toLowerCase()

    const toggle = (label: string) => {
        setClosed((previous) => {
            const next = new Set(previous)
            if (next.has(label)) {
                next.delete(label)
            } else {
                next.add(label)
            }
            return next
        })
    }

    const visibleSections = sections
        .map((section) => ({
            ...section,
            children: filtering
                ? section.children.filter((child) =>
                      child.label.toLowerCase().includes(term)
                  )
                : section.children,
        }))
        .filter((section) => section.children.length > 0)

    return (
        <nav className={classes.sidenav}>
            <div className={classes.scrollArea} hidden={collapsed}>
                <div className={classes.filter}>
                    <InputField
                        dense
                        placeholder={i18n.t('Search menu items')}
                        value={filter}
                        onChange={({ value }) => setFilter(value ?? '')}
                    />
                </div>
                <div className={classes.items}>
                    {visibleSections.map((section) => {
                        const open = filtering || !closed.has(section.label)
                        return (
                            <div key={section.label} className={classes.parent}>
                                <button
                                    className={classes.parentButton}
                                    onClick={() => toggle(section.label)}
                                >
                                    {section.label}
                                    <span
                                        className={
                                            open
                                                ? classes.chevronOpen
                                                : classes.chevron
                                        }
                                    >
                                        <IconChevronDown16 />
                                    </span>
                                </button>
                                {open && (
                                    <ul className={classes.linkList}>
                                        {section.children.map((child) => (
                                            <li
                                                key={child.path}
                                                className={classes.link}
                                            >
                                                <NavLink
                                                    to={child.path}
                                                    end={child.end}
                                                    className={({
                                                        isActive,
                                                    }) =>
                                                        isActive
                                                            ? classes.active
                                                            : undefined
                                                    }
                                                >
                                                    {child.label}
                                                </NavLink>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )
                    })}
                    {visibleSections.length === 0 && (
                        <p className={classes.noMatch}>
                            {i18n.t('No menu items found for "{{term}}"', {
                                term: filter,
                            })}
                        </p>
                    )}
                </div>
            </div>
            <button
                className={classes.collapseButton}
                onClick={onToggleCollapse}
                aria-label={
                    collapsed ? i18n.t('Expand menu') : i18n.t('Collapse menu')
                }
            >
                <span
                    className={
                        collapsed ? classes.collapseIconFlipped : undefined
                    }
                >
                    <IconChevronLeft16 />
                </span>
            </button>
        </nav>
    )
}

export default Sidenav
