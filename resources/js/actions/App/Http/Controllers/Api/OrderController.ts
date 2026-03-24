import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\OrderController::store
 * @see app/Http/Controllers/Api/OrderController.php:69
 * @route '/api/orders'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/orders',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\OrderController::store
 * @see app/Http/Controllers/Api/OrderController.php:69
 * @route '/api/orders'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\OrderController::store
 * @see app/Http/Controllers/Api/OrderController.php:69
 * @route '/api/orders'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\OrderController::store
 * @see app/Http/Controllers/Api/OrderController.php:69
 * @route '/api/orders'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\OrderController::store
 * @see app/Http/Controllers/Api/OrderController.php:69
 * @route '/api/orders'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
const OrderController = { store }

export default OrderController