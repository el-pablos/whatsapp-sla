import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../wayfinder'
/**
* @see \WhatsAppStatusController::status
* @see [unknown]:0
* @route '/api/whatsapp/status'
*/
export const status = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: status.url(options),
    method: 'get',
})

status.definition = {
    methods: ["get","head"],
    url: '/api/whatsapp/status',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \WhatsAppStatusController::status
* @see [unknown]:0
* @route '/api/whatsapp/status'
*/
status.url = (options?: RouteQueryOptions) => {
    return status.definition.url + queryParams(options)
}

/**
* @see \WhatsAppStatusController::status
* @see [unknown]:0
* @route '/api/whatsapp/status'
*/
status.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: status.url(options),
    method: 'get',
})

/**
* @see \WhatsAppStatusController::status
* @see [unknown]:0
* @route '/api/whatsapp/status'
*/
status.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: status.url(options),
    method: 'head',
})

/**
* @see \WhatsAppStatusController::status
* @see [unknown]:0
* @route '/api/whatsapp/status'
*/
const statusForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: status.url(options),
    method: 'get',
})

/**
* @see \WhatsAppStatusController::status
* @see [unknown]:0
* @route '/api/whatsapp/status'
*/
statusForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: status.url(options),
    method: 'get',
})

/**
* @see \WhatsAppStatusController::status
* @see [unknown]:0
* @route '/api/whatsapp/status'
*/
statusForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: status.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

status.form = statusForm

/**
* @see \WhatsAppStatusController::ready
* @see [unknown]:0
* @route '/api/whatsapp/ready'
*/
export const ready = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ready.url(options),
    method: 'get',
})

ready.definition = {
    methods: ["get","head"],
    url: '/api/whatsapp/ready',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \WhatsAppStatusController::ready
* @see [unknown]:0
* @route '/api/whatsapp/ready'
*/
ready.url = (options?: RouteQueryOptions) => {
    return ready.definition.url + queryParams(options)
}

/**
* @see \WhatsAppStatusController::ready
* @see [unknown]:0
* @route '/api/whatsapp/ready'
*/
ready.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ready.url(options),
    method: 'get',
})

/**
* @see \WhatsAppStatusController::ready
* @see [unknown]:0
* @route '/api/whatsapp/ready'
*/
ready.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: ready.url(options),
    method: 'head',
})

/**
* @see \WhatsAppStatusController::ready
* @see [unknown]:0
* @route '/api/whatsapp/ready'
*/
const readyForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: ready.url(options),
    method: 'get',
})

/**
* @see \WhatsAppStatusController::ready
* @see [unknown]:0
* @route '/api/whatsapp/ready'
*/
readyForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: ready.url(options),
    method: 'get',
})

/**
* @see \WhatsAppStatusController::ready
* @see [unknown]:0
* @route '/api/whatsapp/ready'
*/
readyForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: ready.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

ready.form = readyForm

/**
* @see \WhatsAppStatusController::qr
* @see [unknown]:0
* @route '/api/whatsapp/qr'
*/
export const qr = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: qr.url(options),
    method: 'get',
})

qr.definition = {
    methods: ["get","head"],
    url: '/api/whatsapp/qr',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \WhatsAppStatusController::qr
* @see [unknown]:0
* @route '/api/whatsapp/qr'
*/
qr.url = (options?: RouteQueryOptions) => {
    return qr.definition.url + queryParams(options)
}

/**
* @see \WhatsAppStatusController::qr
* @see [unknown]:0
* @route '/api/whatsapp/qr'
*/
qr.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: qr.url(options),
    method: 'get',
})

/**
* @see \WhatsAppStatusController::qr
* @see [unknown]:0
* @route '/api/whatsapp/qr'
*/
qr.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: qr.url(options),
    method: 'head',
})

/**
* @see \WhatsAppStatusController::qr
* @see [unknown]:0
* @route '/api/whatsapp/qr'
*/
const qrForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: qr.url(options),
    method: 'get',
})

/**
* @see \WhatsAppStatusController::qr
* @see [unknown]:0
* @route '/api/whatsapp/qr'
*/
qrForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: qr.url(options),
    method: 'get',
})

/**
* @see \WhatsAppStatusController::qr
* @see [unknown]:0
* @route '/api/whatsapp/qr'
*/
qrForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: qr.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

qr.form = qrForm

/**
* @see \WhatsAppStatusController::clearCache
* @see [unknown]:0
* @route '/api/whatsapp/cache'
*/
export const clearCache = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: clearCache.url(options),
    method: 'delete',
})

clearCache.definition = {
    methods: ["delete"],
    url: '/api/whatsapp/cache',
} satisfies RouteDefinition<["delete"]>

/**
* @see \WhatsAppStatusController::clearCache
* @see [unknown]:0
* @route '/api/whatsapp/cache'
*/
clearCache.url = (options?: RouteQueryOptions) => {
    return clearCache.definition.url + queryParams(options)
}

/**
* @see \WhatsAppStatusController::clearCache
* @see [unknown]:0
* @route '/api/whatsapp/cache'
*/
clearCache.delete = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: clearCache.url(options),
    method: 'delete',
})

/**
* @see \WhatsAppStatusController::clearCache
* @see [unknown]:0
* @route '/api/whatsapp/cache'
*/
const clearCacheForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: clearCache.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \WhatsAppStatusController::clearCache
* @see [unknown]:0
* @route '/api/whatsapp/cache'
*/
clearCacheForm.delete = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: clearCache.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

clearCache.form = clearCacheForm

/**
* @see \WhatsAppStatusController::testEvent
* @see [unknown]:0
* @route '/api/whatsapp/test-event'
*/
export const testEvent = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: testEvent.url(options),
    method: 'post',
})

testEvent.definition = {
    methods: ["post"],
    url: '/api/whatsapp/test-event',
} satisfies RouteDefinition<["post"]>

/**
* @see \WhatsAppStatusController::testEvent
* @see [unknown]:0
* @route '/api/whatsapp/test-event'
*/
testEvent.url = (options?: RouteQueryOptions) => {
    return testEvent.definition.url + queryParams(options)
}

/**
* @see \WhatsAppStatusController::testEvent
* @see [unknown]:0
* @route '/api/whatsapp/test-event'
*/
testEvent.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: testEvent.url(options),
    method: 'post',
})

/**
* @see \WhatsAppStatusController::testEvent
* @see [unknown]:0
* @route '/api/whatsapp/test-event'
*/
const testEventForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: testEvent.url(options),
    method: 'post',
})

/**
* @see \WhatsAppStatusController::testEvent
* @see [unknown]:0
* @route '/api/whatsapp/test-event'
*/
testEventForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: testEvent.url(options),
    method: 'post',
})

testEvent.form = testEventForm

const WhatsAppStatusController = { status, ready, qr, clearCache, testEvent }

export default WhatsAppStatusController