import i18n from '@dhis2/d2-i18n'
import React, { FC } from 'react'
import classes from './DataFramePreview.module.css'
import { DataFrameContent } from '@/lib/chap'

const MAX_ROWS = 100
const MAX_COLS = 60

function cell(value: unknown): string {
    if (value === null || value === undefined) {
        return ''
    }
    return typeof value === 'object' ? JSON.stringify(value) : String(value)
}

/** Scrollable table preview of a chapkit dataframe ({ columns, data }). */
const DataFramePreview: FC<{ content: DataFrameContent }> = ({ content }) => {
    const columns = content.columns ?? []
    const rows = content.data ?? []
    const shownColumns = columns.slice(0, MAX_COLS)
    const shownRows = rows.slice(0, MAX_ROWS)
    const truncated =
        columns.length > MAX_COLS || rows.length > MAX_ROWS
            ? i18n.t(' (showing first {{r}} rows, {{c}} columns)', {
                  r: Math.min(rows.length, MAX_ROWS),
                  c: Math.min(columns.length, MAX_COLS),
              })
            : ''

    return (
        <>
            <div className={classes.summary}>
                {i18n.t('{{rows}} rows x {{cols}} columns', {
                    rows: rows.length,
                    cols: columns.length,
                })}
                {truncated}
            </div>
            <div className={classes.tableWrap}>
                <table className={classes.table}>
                    <thead>
                        <tr>
                            <th className={classes.indexCell}>#</th>
                            {shownColumns.map((column, index) => (
                                <th key={index}>{column}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {shownRows.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                <td className={classes.indexCell}>
                                    {rowIndex}
                                </td>
                                {shownColumns.map((_, colIndex) => (
                                    <td key={colIndex}>
                                        {cell(row[colIndex])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    )
}

export default DataFramePreview
