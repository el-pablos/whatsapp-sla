import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\StockController::show
 * @see app/Http/Controllers/Api/StockController.php:14
 * @route '/api/stock/{product_id}'
 */
export const show = (args: { product_id: string | number } | [product_id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/stock/{product_id}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\StockController::show
 * @see app/Http/Controllers/Api/StockController.php:14
 * @route '/api/stock/{product_id}'
 */
show.url = (args: { product_id: string | number } | [product_id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { product_id: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    product_id: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        product_id: args.product_id,
                }

    return show.definition.url
            .replace('{product_id}', parsedArgs.product_id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\StockController::show
 * @see app/Http/Controllers/Api/StockController.php:14
 * @route '/api/stock/{product_id}'
 */
show.get = (args: { product_id: string | number } | [product_id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\StockController::show
 * @see app/Http/Controllers/Api/StockController.php:14
 * @route '/api/stock/{product_id}'
 */
show.head = (args: { product_id: string | number } | [product_id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\StockController::show
 * @see app/Http/Controllers/Api/StockController.php:14
 * @route '/api/stock/{product_id}'
 */
    const showForm = (args: { product_id: string | number } | [product_id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\StockController::show
 * @see app/Http/Controllers/Api/StockController.php:14
 * @route '/api/stock/{product_id}'
 */
        showForm.get = (args: { product_id: string | number } | [product_id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\StockController::show
 * @see app/Http/Controllers/Api/StockController.php:14
 * @route '/api/stock/{product_id}'
 */
        showForm.head = (args: { product_id: string | number } | [product_id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
const StockController = { show }

export default StockController