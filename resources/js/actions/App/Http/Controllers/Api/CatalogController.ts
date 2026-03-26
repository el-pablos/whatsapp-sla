import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\CatalogController::index
* @see app/Http/Controllers/Api/CatalogController.php:15
* @route '/api/catalogs'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/catalogs',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\CatalogController::index
* @see app/Http/Controllers/Api/CatalogController.php:15
* @route '/api/catalogs'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CatalogController::index
* @see app/Http/Controllers/Api/CatalogController.php:15
* @route '/api/catalogs'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\CatalogController::index
* @see app/Http/Controllers/Api/CatalogController.php:15
* @route '/api/catalogs'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\CatalogController::index
* @see app/Http/Controllers/Api/CatalogController.php:15
* @route '/api/catalogs'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\CatalogController::index
* @see app/Http/Controllers/Api/CatalogController.php:15
* @route '/api/catalogs'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\CatalogController::index
* @see app/Http/Controllers/Api/CatalogController.php:15
* @route '/api/catalogs'
*/
indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

index.form = indexForm

/**
* @see \App\Http\Controllers\Api\CatalogController::show
* @see app/Http/Controllers/Api/CatalogController.php:32
* @route '/api/catalogs/{id}'
*/
export const show = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/catalogs/{id}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\CatalogController::show
* @see app/Http/Controllers/Api/CatalogController.php:32
* @route '/api/catalogs/{id}'
*/
show.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    if (Array.isArray(args)) {
        args = {
            id: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        id: args.id,
    }

    return show.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CatalogController::show
* @see app/Http/Controllers/Api/CatalogController.php:32
* @route '/api/catalogs/{id}'
*/
show.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\CatalogController::show
* @see app/Http/Controllers/Api/CatalogController.php:32
* @route '/api/catalogs/{id}'
*/
show.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\CatalogController::show
* @see app/Http/Controllers/Api/CatalogController.php:32
* @route '/api/catalogs/{id}'
*/
const showForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\CatalogController::show
* @see app/Http/Controllers/Api/CatalogController.php:32
* @route '/api/catalogs/{id}'
*/
showForm.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\CatalogController::show
* @see app/Http/Controllers/Api/CatalogController.php:32
* @route '/api/catalogs/{id}'
*/
showForm.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

show.form = showForm

/**
* @see \App\Http\Controllers\Api\CatalogController::store
* @see app/Http/Controllers/Api/CatalogController.php:54
* @route '/api/catalogs'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/catalogs',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\CatalogController::store
* @see app/Http/Controllers/Api/CatalogController.php:54
* @route '/api/catalogs'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CatalogController::store
* @see app/Http/Controllers/Api/CatalogController.php:54
* @route '/api/catalogs'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\CatalogController::store
* @see app/Http/Controllers/Api/CatalogController.php:54
* @route '/api/catalogs'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\CatalogController::store
* @see app/Http/Controllers/Api/CatalogController.php:54
* @route '/api/catalogs'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

const CatalogController = { index, show, store }

export default CatalogController