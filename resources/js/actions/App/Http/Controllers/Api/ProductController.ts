import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\ProductController::index
 * @see app/Http/Controllers/Api/ProductController.php:15
 * @route '/api/products'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/products',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ProductController::index
 * @see app/Http/Controllers/Api/ProductController.php:15
 * @route '/api/products'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ProductController::index
 * @see app/Http/Controllers/Api/ProductController.php:15
 * @route '/api/products'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ProductController::index
 * @see app/Http/Controllers/Api/ProductController.php:15
 * @route '/api/products'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ProductController::index
 * @see app/Http/Controllers/Api/ProductController.php:15
 * @route '/api/products'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ProductController::index
 * @see app/Http/Controllers/Api/ProductController.php:15
 * @route '/api/products'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ProductController::index
 * @see app/Http/Controllers/Api/ProductController.php:15
 * @route '/api/products'
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
* @see \App\Http\Controllers\Api\ProductController::show
 * @see app/Http/Controllers/Api/ProductController.php:31
 * @route '/api/products/{id}'
 */
export const show = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/products/{id}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ProductController::show
 * @see app/Http/Controllers/Api/ProductController.php:31
 * @route '/api/products/{id}'
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
* @see \App\Http\Controllers\Api\ProductController::show
 * @see app/Http/Controllers/Api/ProductController.php:31
 * @route '/api/products/{id}'
 */
show.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ProductController::show
 * @see app/Http/Controllers/Api/ProductController.php:31
 * @route '/api/products/{id}'
 */
show.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ProductController::show
 * @see app/Http/Controllers/Api/ProductController.php:31
 * @route '/api/products/{id}'
 */
    const showForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ProductController::show
 * @see app/Http/Controllers/Api/ProductController.php:31
 * @route '/api/products/{id}'
 */
        showForm.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ProductController::show
 * @see app/Http/Controllers/Api/ProductController.php:31
 * @route '/api/products/{id}'
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
* @see \App\Http\Controllers\Api\ProductController::byType
 * @see app/Http/Controllers/Api/ProductController.php:53
 * @route '/api/products/type/{type}'
 */
export const byType = (args: { type: string | number } | [type: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: byType.url(args, options),
    method: 'get',
})

byType.definition = {
    methods: ["get","head"],
    url: '/api/products/type/{type}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ProductController::byType
 * @see app/Http/Controllers/Api/ProductController.php:53
 * @route '/api/products/type/{type}'
 */
byType.url = (args: { type: string | number } | [type: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { type: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    type: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        type: args.type,
                }

    return byType.definition.url
            .replace('{type}', parsedArgs.type.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ProductController::byType
 * @see app/Http/Controllers/Api/ProductController.php:53
 * @route '/api/products/type/{type}'
 */
byType.get = (args: { type: string | number } | [type: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: byType.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ProductController::byType
 * @see app/Http/Controllers/Api/ProductController.php:53
 * @route '/api/products/type/{type}'
 */
byType.head = (args: { type: string | number } | [type: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: byType.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ProductController::byType
 * @see app/Http/Controllers/Api/ProductController.php:53
 * @route '/api/products/type/{type}'
 */
    const byTypeForm = (args: { type: string | number } | [type: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: byType.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ProductController::byType
 * @see app/Http/Controllers/Api/ProductController.php:53
 * @route '/api/products/type/{type}'
 */
        byTypeForm.get = (args: { type: string | number } | [type: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: byType.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ProductController::byType
 * @see app/Http/Controllers/Api/ProductController.php:53
 * @route '/api/products/type/{type}'
 */
        byTypeForm.head = (args: { type: string | number } | [type: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: byType.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    byType.form = byTypeForm
const ProductController = { index, show, byType }

export default ProductController