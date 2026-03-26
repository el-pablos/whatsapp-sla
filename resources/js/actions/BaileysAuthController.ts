import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../wayfinder'
/**
* @see \BaileysAuthController::status
* @see [unknown]:0
* @route '/api/baileys/status'
*/
export const status = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: status.url(options),
    method: 'get',
})

status.definition = {
    methods: ["get","head"],
    url: '/api/baileys/status',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \BaileysAuthController::status
* @see [unknown]:0
* @route '/api/baileys/status'
*/
status.url = (options?: RouteQueryOptions) => {
    return status.definition.url + queryParams(options)
}

/**
* @see \BaileysAuthController::status
* @see [unknown]:0
* @route '/api/baileys/status'
*/
status.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: status.url(options),
    method: 'get',
})

/**
* @see \BaileysAuthController::status
* @see [unknown]:0
* @route '/api/baileys/status'
*/
status.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: status.url(options),
    method: 'head',
})

/**
* @see \BaileysAuthController::status
* @see [unknown]:0
* @route '/api/baileys/status'
*/
const statusForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: status.url(options),
    method: 'get',
})

/**
* @see \BaileysAuthController::status
* @see [unknown]:0
* @route '/api/baileys/status'
*/
statusForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: status.url(options),
    method: 'get',
})

/**
* @see \BaileysAuthController::status
* @see [unknown]:0
* @route '/api/baileys/status'
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
* @see \BaileysAuthController::requestQR
* @see [unknown]:0
* @route '/api/baileys/qr/request'
*/
export const requestQR = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: requestQR.url(options),
    method: 'post',
})

requestQR.definition = {
    methods: ["post"],
    url: '/api/baileys/qr/request',
} satisfies RouteDefinition<["post"]>

/**
* @see \BaileysAuthController::requestQR
* @see [unknown]:0
* @route '/api/baileys/qr/request'
*/
requestQR.url = (options?: RouteQueryOptions) => {
    return requestQR.definition.url + queryParams(options)
}

/**
* @see \BaileysAuthController::requestQR
* @see [unknown]:0
* @route '/api/baileys/qr/request'
*/
requestQR.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: requestQR.url(options),
    method: 'post',
})

/**
* @see \BaileysAuthController::requestQR
* @see [unknown]:0
* @route '/api/baileys/qr/request'
*/
const requestQRForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: requestQR.url(options),
    method: 'post',
})

/**
* @see \BaileysAuthController::requestQR
* @see [unknown]:0
* @route '/api/baileys/qr/request'
*/
requestQRForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: requestQR.url(options),
    method: 'post',
})

requestQR.form = requestQRForm

/**
* @see \BaileysAuthController::getQR
* @see [unknown]:0
* @route '/api/baileys/qr'
*/
export const getQR = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getQR.url(options),
    method: 'get',
})

getQR.definition = {
    methods: ["get","head"],
    url: '/api/baileys/qr',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \BaileysAuthController::getQR
* @see [unknown]:0
* @route '/api/baileys/qr'
*/
getQR.url = (options?: RouteQueryOptions) => {
    return getQR.definition.url + queryParams(options)
}

/**
* @see \BaileysAuthController::getQR
* @see [unknown]:0
* @route '/api/baileys/qr'
*/
getQR.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getQR.url(options),
    method: 'get',
})

/**
* @see \BaileysAuthController::getQR
* @see [unknown]:0
* @route '/api/baileys/qr'
*/
getQR.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getQR.url(options),
    method: 'head',
})

/**
* @see \BaileysAuthController::getQR
* @see [unknown]:0
* @route '/api/baileys/qr'
*/
const getQRForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getQR.url(options),
    method: 'get',
})

/**
* @see \BaileysAuthController::getQR
* @see [unknown]:0
* @route '/api/baileys/qr'
*/
getQRForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getQR.url(options),
    method: 'get',
})

/**
* @see \BaileysAuthController::getQR
* @see [unknown]:0
* @route '/api/baileys/qr'
*/
getQRForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getQR.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

getQR.form = getQRForm

/**
* @see \BaileysAuthController::requestPairing
* @see [unknown]:0
* @route '/api/baileys/pairing'
*/
export const requestPairing = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: requestPairing.url(options),
    method: 'post',
})

requestPairing.definition = {
    methods: ["post"],
    url: '/api/baileys/pairing',
} satisfies RouteDefinition<["post"]>

/**
* @see \BaileysAuthController::requestPairing
* @see [unknown]:0
* @route '/api/baileys/pairing'
*/
requestPairing.url = (options?: RouteQueryOptions) => {
    return requestPairing.definition.url + queryParams(options)
}

/**
* @see \BaileysAuthController::requestPairing
* @see [unknown]:0
* @route '/api/baileys/pairing'
*/
requestPairing.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: requestPairing.url(options),
    method: 'post',
})

/**
* @see \BaileysAuthController::requestPairing
* @see [unknown]:0
* @route '/api/baileys/pairing'
*/
const requestPairingForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: requestPairing.url(options),
    method: 'post',
})

/**
* @see \BaileysAuthController::requestPairing
* @see [unknown]:0
* @route '/api/baileys/pairing'
*/
requestPairingForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: requestPairing.url(options),
    method: 'post',
})

requestPairing.form = requestPairingForm

/**
* @see \BaileysAuthController::logout
* @see [unknown]:0
* @route '/api/baileys/logout'
*/
const logout9e4781a4aa82a04151729ba124b4c7ff = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: logout9e4781a4aa82a04151729ba124b4c7ff.url(options),
    method: 'post',
})

logout9e4781a4aa82a04151729ba124b4c7ff.definition = {
    methods: ["post"],
    url: '/api/baileys/logout',
} satisfies RouteDefinition<["post"]>

/**
* @see \BaileysAuthController::logout
* @see [unknown]:0
* @route '/api/baileys/logout'
*/
logout9e4781a4aa82a04151729ba124b4c7ff.url = (options?: RouteQueryOptions) => {
    return logout9e4781a4aa82a04151729ba124b4c7ff.definition.url + queryParams(options)
}

/**
* @see \BaileysAuthController::logout
* @see [unknown]:0
* @route '/api/baileys/logout'
*/
logout9e4781a4aa82a04151729ba124b4c7ff.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: logout9e4781a4aa82a04151729ba124b4c7ff.url(options),
    method: 'post',
})

/**
* @see \BaileysAuthController::logout
* @see [unknown]:0
* @route '/api/baileys/logout'
*/
const logout9e4781a4aa82a04151729ba124b4c7ffForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: logout9e4781a4aa82a04151729ba124b4c7ff.url(options),
    method: 'post',
})

/**
* @see \BaileysAuthController::logout
* @see [unknown]:0
* @route '/api/baileys/logout'
*/
logout9e4781a4aa82a04151729ba124b4c7ffForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: logout9e4781a4aa82a04151729ba124b4c7ff.url(options),
    method: 'post',
})

logout9e4781a4aa82a04151729ba124b4c7ff.form = logout9e4781a4aa82a04151729ba124b4c7ffForm
/**
* @see \BaileysAuthController::logout
* @see [unknown]:0
* @route '/whatsapp/auth/logout'
*/
const logout7ed0d53644ec3ba31a1b2d98ac3184cb = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: logout7ed0d53644ec3ba31a1b2d98ac3184cb.url(options),
    method: 'post',
})

logout7ed0d53644ec3ba31a1b2d98ac3184cb.definition = {
    methods: ["post"],
    url: '/whatsapp/auth/logout',
} satisfies RouteDefinition<["post"]>

/**
* @see \BaileysAuthController::logout
* @see [unknown]:0
* @route '/whatsapp/auth/logout'
*/
logout7ed0d53644ec3ba31a1b2d98ac3184cb.url = (options?: RouteQueryOptions) => {
    return logout7ed0d53644ec3ba31a1b2d98ac3184cb.definition.url + queryParams(options)
}

/**
* @see \BaileysAuthController::logout
* @see [unknown]:0
* @route '/whatsapp/auth/logout'
*/
logout7ed0d53644ec3ba31a1b2d98ac3184cb.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: logout7ed0d53644ec3ba31a1b2d98ac3184cb.url(options),
    method: 'post',
})

/**
* @see \BaileysAuthController::logout
* @see [unknown]:0
* @route '/whatsapp/auth/logout'
*/
const logout7ed0d53644ec3ba31a1b2d98ac3184cbForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: logout7ed0d53644ec3ba31a1b2d98ac3184cb.url(options),
    method: 'post',
})

/**
* @see \BaileysAuthController::logout
* @see [unknown]:0
* @route '/whatsapp/auth/logout'
*/
logout7ed0d53644ec3ba31a1b2d98ac3184cbForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: logout7ed0d53644ec3ba31a1b2d98ac3184cb.url(options),
    method: 'post',
})

logout7ed0d53644ec3ba31a1b2d98ac3184cb.form = logout7ed0d53644ec3ba31a1b2d98ac3184cbForm

export const logout = {
    '/api/baileys/logout': logout9e4781a4aa82a04151729ba124b4c7ff,
    '/whatsapp/auth/logout': logout7ed0d53644ec3ba31a1b2d98ac3184cb,
}

/**
* @see \BaileysAuthController::restart
* @see [unknown]:0
* @route '/api/baileys/restart'
*/
const restart863cecbfdd1a8c84f94fa3db9af9f83c = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: restart863cecbfdd1a8c84f94fa3db9af9f83c.url(options),
    method: 'post',
})

restart863cecbfdd1a8c84f94fa3db9af9f83c.definition = {
    methods: ["post"],
    url: '/api/baileys/restart',
} satisfies RouteDefinition<["post"]>

/**
* @see \BaileysAuthController::restart
* @see [unknown]:0
* @route '/api/baileys/restart'
*/
restart863cecbfdd1a8c84f94fa3db9af9f83c.url = (options?: RouteQueryOptions) => {
    return restart863cecbfdd1a8c84f94fa3db9af9f83c.definition.url + queryParams(options)
}

/**
* @see \BaileysAuthController::restart
* @see [unknown]:0
* @route '/api/baileys/restart'
*/
restart863cecbfdd1a8c84f94fa3db9af9f83c.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: restart863cecbfdd1a8c84f94fa3db9af9f83c.url(options),
    method: 'post',
})

/**
* @see \BaileysAuthController::restart
* @see [unknown]:0
* @route '/api/baileys/restart'
*/
const restart863cecbfdd1a8c84f94fa3db9af9f83cForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: restart863cecbfdd1a8c84f94fa3db9af9f83c.url(options),
    method: 'post',
})

/**
* @see \BaileysAuthController::restart
* @see [unknown]:0
* @route '/api/baileys/restart'
*/
restart863cecbfdd1a8c84f94fa3db9af9f83cForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: restart863cecbfdd1a8c84f94fa3db9af9f83c.url(options),
    method: 'post',
})

restart863cecbfdd1a8c84f94fa3db9af9f83c.form = restart863cecbfdd1a8c84f94fa3db9af9f83cForm
/**
* @see \BaileysAuthController::restart
* @see [unknown]:0
* @route '/whatsapp/auth/restart'
*/
const restart3aedb5d35662f0cc39442d9d8a93678b = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: restart3aedb5d35662f0cc39442d9d8a93678b.url(options),
    method: 'post',
})

restart3aedb5d35662f0cc39442d9d8a93678b.definition = {
    methods: ["post"],
    url: '/whatsapp/auth/restart',
} satisfies RouteDefinition<["post"]>

/**
* @see \BaileysAuthController::restart
* @see [unknown]:0
* @route '/whatsapp/auth/restart'
*/
restart3aedb5d35662f0cc39442d9d8a93678b.url = (options?: RouteQueryOptions) => {
    return restart3aedb5d35662f0cc39442d9d8a93678b.definition.url + queryParams(options)
}

/**
* @see \BaileysAuthController::restart
* @see [unknown]:0
* @route '/whatsapp/auth/restart'
*/
restart3aedb5d35662f0cc39442d9d8a93678b.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: restart3aedb5d35662f0cc39442d9d8a93678b.url(options),
    method: 'post',
})

/**
* @see \BaileysAuthController::restart
* @see [unknown]:0
* @route '/whatsapp/auth/restart'
*/
const restart3aedb5d35662f0cc39442d9d8a93678bForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: restart3aedb5d35662f0cc39442d9d8a93678b.url(options),
    method: 'post',
})

/**
* @see \BaileysAuthController::restart
* @see [unknown]:0
* @route '/whatsapp/auth/restart'
*/
restart3aedb5d35662f0cc39442d9d8a93678bForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: restart3aedb5d35662f0cc39442d9d8a93678b.url(options),
    method: 'post',
})

restart3aedb5d35662f0cc39442d9d8a93678b.form = restart3aedb5d35662f0cc39442d9d8a93678bForm

export const restart = {
    '/api/baileys/restart': restart863cecbfdd1a8c84f94fa3db9af9f83c,
    '/whatsapp/auth/restart': restart3aedb5d35662f0cc39442d9d8a93678b,
}

/**
* @see \BaileysAuthController::metrics
* @see [unknown]:0
* @route '/api/baileys/metrics'
*/
export const metrics = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: metrics.url(options),
    method: 'get',
})

metrics.definition = {
    methods: ["get","head"],
    url: '/api/baileys/metrics',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \BaileysAuthController::metrics
* @see [unknown]:0
* @route '/api/baileys/metrics'
*/
metrics.url = (options?: RouteQueryOptions) => {
    return metrics.definition.url + queryParams(options)
}

/**
* @see \BaileysAuthController::metrics
* @see [unknown]:0
* @route '/api/baileys/metrics'
*/
metrics.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: metrics.url(options),
    method: 'get',
})

/**
* @see \BaileysAuthController::metrics
* @see [unknown]:0
* @route '/api/baileys/metrics'
*/
metrics.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: metrics.url(options),
    method: 'head',
})

/**
* @see \BaileysAuthController::metrics
* @see [unknown]:0
* @route '/api/baileys/metrics'
*/
const metricsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: metrics.url(options),
    method: 'get',
})

/**
* @see \BaileysAuthController::metrics
* @see [unknown]:0
* @route '/api/baileys/metrics'
*/
metricsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: metrics.url(options),
    method: 'get',
})

/**
* @see \BaileysAuthController::metrics
* @see [unknown]:0
* @route '/api/baileys/metrics'
*/
metricsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: metrics.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

metrics.form = metricsForm

/**
* @see \BaileysAuthController::showQR
* @see [unknown]:0
* @route '/whatsapp/auth'
*/
export const showQR = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showQR.url(options),
    method: 'get',
})

showQR.definition = {
    methods: ["get","head"],
    url: '/whatsapp/auth',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \BaileysAuthController::showQR
* @see [unknown]:0
* @route '/whatsapp/auth'
*/
showQR.url = (options?: RouteQueryOptions) => {
    return showQR.definition.url + queryParams(options)
}

/**
* @see \BaileysAuthController::showQR
* @see [unknown]:0
* @route '/whatsapp/auth'
*/
showQR.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showQR.url(options),
    method: 'get',
})

/**
* @see \BaileysAuthController::showQR
* @see [unknown]:0
* @route '/whatsapp/auth'
*/
showQR.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: showQR.url(options),
    method: 'head',
})

/**
* @see \BaileysAuthController::showQR
* @see [unknown]:0
* @route '/whatsapp/auth'
*/
const showQRForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: showQR.url(options),
    method: 'get',
})

/**
* @see \BaileysAuthController::showQR
* @see [unknown]:0
* @route '/whatsapp/auth'
*/
showQRForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: showQR.url(options),
    method: 'get',
})

/**
* @see \BaileysAuthController::showQR
* @see [unknown]:0
* @route '/whatsapp/auth'
*/
showQRForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: showQR.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

showQR.form = showQRForm

const BaileysAuthController = { status, requestQR, getQR, requestPairing, logout, restart, metrics, showQR }

export default BaileysAuthController