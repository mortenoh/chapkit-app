import config from '@dhis2/config-eslint'
import { defineConfig } from 'eslint/config'
import { includeIgnoreFile } from '@eslint/compat'
import { fileURLToPath } from 'node:url'

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url))

export default defineConfig([
    includeIgnoreFile(gitignorePath, 'Imported .gitignore patterns'),
    {
        extends: [config],
        settings: {
            // eslint-plugin-import can't resolve names re-exported via
            // `export * from '@dhis2/ui-icons'`; TypeScript validates these
            // imports anyway, so skip import/named analysis for @dhis2/ui.
            'import/ignore': ['@dhis2/ui'],
        },
    },
])
