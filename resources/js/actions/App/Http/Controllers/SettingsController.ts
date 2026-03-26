import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\SettingsController::index
* @see app/Http/Controllers/SettingsController.php:11
* @route '/settings'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/settings',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SettingsController::index
* @see app/Http/Controllers/SettingsController.php:11
* @route '/settings'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SettingsController::index
* @see app/Http/Controllers/SettingsController.php:11
* @route '/settings'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SettingsController::index
* @see app/Http/Controllers/SettingsController.php:11
* @route '/settings'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\SettingsController::index
* @see app/Http/Controllers/SettingsController.php:11
* @route '/settings'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SettingsController::index
* @see app/Http/Controllers/SettingsController.php:11
* @route '/settings'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SettingsController::index
* @see app/Http/Controllers/SettingsController.php:11
* @route '/settings'
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

const SettingsController = { index }

export default SettingsController