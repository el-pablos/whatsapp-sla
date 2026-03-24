import { createInertiaApp } from '@inertiajs/react'
import ReactDOMServer from 'react-dom/server'

export default function render(page: unknown) {
    return createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        resolve: (name) => {
            const pages = import.meta.glob('./pages/**/*.tsx', { eager: true })
            return pages[`./pages/${name}.tsx`] ?? pages[`./pages/${name}/Index.tsx`]
        },
        setup: ({ App, props }) => <App {...props} />,
    })
}
