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
* @see \App\Http\Controllers\Api\ProductController::store
* @see app/Http/Controllers/Api/ProductController.php:71
* @route '/api/products'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/products',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ProductController::store
* @see app/Http/Controllers/Api/ProductController.php:71
* @route '/api/products'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ProductController::store
* @see app/Http/Controllers/Api/ProductController.php:71
* @route '/api/products'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ProductController::store
* @see app/Http/Controllers/Api/ProductController.php:71
* @route '/api/products'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ProductController::store
* @see app/Http/Controllers/Api/ProductController.php:71
* @route '/api/products'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

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
* @see \App\Http\Controllers\Api\ProductController::update
* @see app/Http/Controllers/Api/ProductController.php:96
* @route '/api/products/{id}'
*/
export const update = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/api/products/{id}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Api\ProductController::update
* @see app/Http/Controllers/Api/ProductController.php:96
* @route '/api/products/{id}'
*/
update.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return update.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ProductController::update
* @see app/Http/Controllers/Api/ProductController.php:96
* @route '/api/products/{id}'
*/
update.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\Api\ProductController::update
* @see app/Http/Controllers/Api/ProductController.php:96
* @route '/api/products/{id}'
*/
const updateForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ProductController::update
* @see app/Http/Controllers/Api/ProductController.php:96
* @route '/api/products/{id}'
*/
updateForm.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

update.form = updateForm

/**
* @see \App\Http\Controllers\Api\ProductController::destroy
* @see app/Http/Controllers/Api/ProductController.php:131
* @route '/api/products/{id}'
*/
export const destroy = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/products/{id}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Api\ProductController::destroy
* @see app/Http/Controllers/Api/ProductController.php:131
* @route '/api/products/{id}'
*/
destroy.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return destroy.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ProductController::destroy
* @see app/Http/Controllers/Api/ProductController.php:131
* @route '/api/products/{id}'
*/
destroy.delete = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\Api\ProductController::destroy
* @see app/Http/Controllers/Api/ProductController.php:131
* @route '/api/products/{id}'
*/
const destroyForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ProductController::destroy
* @see app/Http/Controllers/Api/ProductController.php:131
* @route '/api/products/{id}'
*/
destroyForm.delete = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroy.form = destroyForm

/**
* @see \App\Http\Controllers\Api\ProductController::updateStock
* @see app/Http/Controllers/Api/ProductController.php:154
* @route '/api/products/{id}/stock'
*/
export const updateStock = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateStock.url(args, options),
    method: 'patch',
})

updateStock.definition = {
    methods: ["patch"],
    url: '/api/products/{id}/stock',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Api\ProductController::updateStock
* @see app/Http/Controllers/Api/ProductController.php:154
* @route '/api/products/{id}/stock'
*/
updateStock.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return updateStock.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ProductController::updateStock
* @see app/Http/Controllers/Api/ProductController.php:154
* @route '/api/products/{id}/stock'
*/
updateStock.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateStock.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\Api\ProductController::updateStock
* @see app/Http/Controllers/Api/ProductController.php:154
* @route '/api/products/{id}/stock'
*/
const updateStockForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateStock.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ProductController::updateStock
* @see app/Http/Controllers/Api/ProductController.php:154
* @route '/api/products/{id}/stock'
*/
updateStockForm.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateStock.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

updateStock.form = updateStockForm

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

const ProductController = { index, store, show, update, destroy, updateStock, byType }

export default ProductController