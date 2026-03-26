import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \BaileysAuthController::auth
* @see [unknown]:0
* @route '/whatsapp/auth'
*/
export const auth = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: auth.url(options),
    method: 'get',
})

auth.definition = {
    methods: ["get","head"],
    url: '/whatsapp/auth',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \BaileysAuthController::auth
* @see [unknown]:0
* @route '/whatsapp/auth'
*/
auth.url = (options?: RouteQueryOptions) => {
    return auth.definition.url + queryParams(options)
}

/**
* @see \BaileysAuthController::auth
* @see [unknown]:0
* @route '/whatsapp/auth'
*/
auth.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: auth.url(options),
    method: 'get',
})

/**
* @see \BaileysAuthController::auth
* @see [unknown]:0
* @route '/whatsapp/auth'
*/
auth.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: auth.url(options),
    method: 'head',
})

/**
* @see \BaileysAuthController::auth
* @see [unknown]:0
* @route '/whatsapp/auth'
*/
const authForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: auth.url(options),
    method: 'get',
})

/**
* @see \BaileysAuthController::auth
* @see [unknown]:0
* @route '/whatsapp/auth'
*/
authForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: auth.url(options),
    method: 'get',
})

/**
* @see \BaileysAuthController::auth
* @see [unknown]:0
* @route '/whatsapp/auth'
*/
authForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: auth.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

auth.form = authForm

/**
* @see \BaileysAuthController::logout
* @see [unknown]:0
* @route '/whatsapp/auth/logout'
*/
export const logout = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: logout.url(options),
    method: 'post',
})

logout.definition = {
    methods: ["post"],
    url: '/whatsapp/auth/logout',
} satisfies RouteDefinition<["post"]>

/**
* @see \BaileysAuthController::logout
* @see [unknown]:0
* @route '/whatsapp/auth/logout'
*/
logout.url = (options?: RouteQueryOptions) => {
    return logout.definition.url + queryParams(options)
}

/**
* @see \BaileysAuthController::logout
* @see [unknown]:0
* @route '/whatsapp/auth/logout'
*/
logout.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: logout.url(options),
    method: 'post',
})

/**
* @see \BaileysAuthController::logout
* @see [unknown]:0
* @route '/whatsapp/auth/logout'
*/
const logoutForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: logout.url(options),
    method: 'post',
})

/**
* @see \BaileysAuthController::logout
* @see [unknown]:0
* @route '/whatsapp/auth/logout'
*/
logoutForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: logout.url(options),
    method: 'post',
})

logout.form = logoutForm

/**
* @see \BaileysAuthController::restart
* @see [unknown]:0
* @route '/whatsapp/auth/restart'
*/
export const restart = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: restart.url(options),
    method: 'post',
})

restart.definition = {
    methods: ["post"],
    url: '/whatsapp/auth/restart',
} satisfies RouteDefinition<["post"]>

/**
* @see \BaileysAuthController::restart
* @see [unknown]:0
* @route '/whatsapp/auth/restart'
*/
restart.url = (options?: RouteQueryOptions) => {
    return restart.definition.url + queryParams(options)
}

/**
* @see \BaileysAuthController::restart
* @see [unknown]:0
* @route '/whatsapp/auth/restart'
*/
restart.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: restart.url(options),
    method: 'post',
})

/**
* @see \BaileysAuthController::restart
* @see [unknown]:0
* @route '/whatsapp/auth/restart'
*/
const restartForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: restart.url(options),
    method: 'post',
})

/**
* @see \BaileysAuthController::restart
* @see [unknown]:0
* @route '/whatsapp/auth/restart'
*/
restartForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: restart.url(options),
    method: 'post',
})

restart.form = restartForm

const baileys = {
    auth: Object.assign(auth, auth),
    logout: Object.assign(logout, logout),
    restart: Object.assign(restart, restart),
}

export default baileys