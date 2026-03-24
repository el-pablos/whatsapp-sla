import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\WebhookController::verify
 * @see app/Http/Controllers/WebhookController.php:21
 * @route '/api/webhook'
 */
export const verify = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: verify.url(options),
    method: 'get',
})

verify.definition = {
    methods: ["get","head"],
    url: '/api/webhook',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\WebhookController::verify
 * @see app/Http/Controllers/WebhookController.php:21
 * @route '/api/webhook'
 */
verify.url = (options?: RouteQueryOptions) => {
    return verify.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\WebhookController::verify
 * @see app/Http/Controllers/WebhookController.php:21
 * @route '/api/webhook'
 */
verify.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: verify.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\WebhookController::verify
 * @see app/Http/Controllers/WebhookController.php:21
 * @route '/api/webhook'
 */
verify.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: verify.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\WebhookController::verify
 * @see app/Http/Controllers/WebhookController.php:21
 * @route '/api/webhook'
 */
    const verifyForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: verify.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\WebhookController::verify
 * @see app/Http/Controllers/WebhookController.php:21
 * @route '/api/webhook'
 */
        verifyForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: verify.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\WebhookController::verify
 * @see app/Http/Controllers/WebhookController.php:21
 * @route '/api/webhook'
 */
        verifyForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: verify.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    verify.form = verifyForm
/**
* @see \App\Http\Controllers\WebhookController::receive
 * @see app/Http/Controllers/WebhookController.php:48
 * @route '/api/webhook'
 */
export const receive = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: receive.url(options),
    method: 'post',
})

receive.definition = {
    methods: ["post"],
    url: '/api/webhook',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WebhookController::receive
 * @see app/Http/Controllers/WebhookController.php:48
 * @route '/api/webhook'
 */
receive.url = (options?: RouteQueryOptions) => {
    return receive.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\WebhookController::receive
 * @see app/Http/Controllers/WebhookController.php:48
 * @route '/api/webhook'
 */
receive.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: receive.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\WebhookController::receive
 * @see app/Http/Controllers/WebhookController.php:48
 * @route '/api/webhook'
 */
    const receiveForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: receive.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\WebhookController::receive
 * @see app/Http/Controllers/WebhookController.php:48
 * @route '/api/webhook'
 */
        receiveForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: receive.url(options),
            method: 'post',
        })
    
    receive.form = receiveForm
const WebhookController = { verify, receive }

export default WebhookController