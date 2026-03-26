import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\ChatController::index
* @see app/Http/Controllers/ChatController.php:24
* @route '/chats'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/chats',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ChatController::index
* @see app/Http/Controllers/ChatController.php:24
* @route '/chats'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ChatController::index
* @see app/Http/Controllers/ChatController.php:24
* @route '/chats'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ChatController::index
* @see app/Http/Controllers/ChatController.php:24
* @route '/chats'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ChatController::index
* @see app/Http/Controllers/ChatController.php:24
* @route '/chats'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ChatController::index
* @see app/Http/Controllers/ChatController.php:24
* @route '/chats'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ChatController::index
* @see app/Http/Controllers/ChatController.php:24
* @route '/chats'
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
* @see \App\Http\Controllers\ChatController::create
* @see app/Http/Controllers/ChatController.php:0
* @route '/chats/create'
*/
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/chats/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ChatController::create
* @see app/Http/Controllers/ChatController.php:0
* @route '/chats/create'
*/
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ChatController::create
* @see app/Http/Controllers/ChatController.php:0
* @route '/chats/create'
*/
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ChatController::create
* @see app/Http/Controllers/ChatController.php:0
* @route '/chats/create'
*/
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ChatController::create
* @see app/Http/Controllers/ChatController.php:0
* @route '/chats/create'
*/
const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: create.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ChatController::create
* @see app/Http/Controllers/ChatController.php:0
* @route '/chats/create'
*/
createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: create.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ChatController::create
* @see app/Http/Controllers/ChatController.php:0
* @route '/chats/create'
*/
createForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: create.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

create.form = createForm

/**
* @see \App\Http\Controllers\ChatController::store
* @see app/Http/Controllers/ChatController.php:0
* @route '/chats'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/chats',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ChatController::store
* @see app/Http/Controllers/ChatController.php:0
* @route '/chats'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ChatController::store
* @see app/Http/Controllers/ChatController.php:0
* @route '/chats'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ChatController::store
* @see app/Http/Controllers/ChatController.php:0
* @route '/chats'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ChatController::store
* @see app/Http/Controllers/ChatController.php:0
* @route '/chats'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\ChatController::show
* @see app/Http/Controllers/ChatController.php:63
* @route '/chats/{chat}'
*/
export const show = (args: { chat: string | number } | [chat: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/chats/{chat}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ChatController::show
* @see app/Http/Controllers/ChatController.php:63
* @route '/chats/{chat}'
*/
show.url = (args: { chat: string | number } | [chat: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { chat: args }
    }

    if (Array.isArray(args)) {
        args = {
            chat: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        chat: args.chat,
    }

    return show.definition.url
            .replace('{chat}', parsedArgs.chat.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ChatController::show
* @see app/Http/Controllers/ChatController.php:63
* @route '/chats/{chat}'
*/
show.get = (args: { chat: string | number } | [chat: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ChatController::show
* @see app/Http/Controllers/ChatController.php:63
* @route '/chats/{chat}'
*/
show.head = (args: { chat: string | number } | [chat: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ChatController::show
* @see app/Http/Controllers/ChatController.php:63
* @route '/chats/{chat}'
*/
const showForm = (args: { chat: string | number } | [chat: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ChatController::show
* @see app/Http/Controllers/ChatController.php:63
* @route '/chats/{chat}'
*/
showForm.get = (args: { chat: string | number } | [chat: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ChatController::show
* @see app/Http/Controllers/ChatController.php:63
* @route '/chats/{chat}'
*/
showForm.head = (args: { chat: string | number } | [chat: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\ChatController::edit
* @see app/Http/Controllers/ChatController.php:0
* @route '/chats/{chat}/edit'
*/
export const edit = (args: { chat: string | number } | [chat: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/chats/{chat}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ChatController::edit
* @see app/Http/Controllers/ChatController.php:0
* @route '/chats/{chat}/edit'
*/
edit.url = (args: { chat: string | number } | [chat: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { chat: args }
    }

    if (Array.isArray(args)) {
        args = {
            chat: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        chat: args.chat,
    }

    return edit.definition.url
            .replace('{chat}', parsedArgs.chat.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ChatController::edit
* @see app/Http/Controllers/ChatController.php:0
* @route '/chats/{chat}/edit'
*/
edit.get = (args: { chat: string | number } | [chat: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ChatController::edit
* @see app/Http/Controllers/ChatController.php:0
* @route '/chats/{chat}/edit'
*/
edit.head = (args: { chat: string | number } | [chat: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ChatController::edit
* @see app/Http/Controllers/ChatController.php:0
* @route '/chats/{chat}/edit'
*/
const editForm = (args: { chat: string | number } | [chat: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: edit.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ChatController::edit
* @see app/Http/Controllers/ChatController.php:0
* @route '/chats/{chat}/edit'
*/
editForm.get = (args: { chat: string | number } | [chat: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: edit.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ChatController::edit
* @see app/Http/Controllers/ChatController.php:0
* @route '/chats/{chat}/edit'
*/
editForm.head = (args: { chat: string | number } | [chat: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: edit.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

edit.form = editForm

/**
* @see \App\Http\Controllers\ChatController::update
* @see app/Http/Controllers/ChatController.php:0
* @route '/chats/{chat}'
*/
export const update = (args: { chat: string | number } | [chat: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/chats/{chat}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\ChatController::update
* @see app/Http/Controllers/ChatController.php:0
* @route '/chats/{chat}'
*/
update.url = (args: { chat: string | number } | [chat: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { chat: args }
    }

    if (Array.isArray(args)) {
        args = {
            chat: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        chat: args.chat,
    }

    return update.definition.url
            .replace('{chat}', parsedArgs.chat.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ChatController::update
* @see app/Http/Controllers/ChatController.php:0
* @route '/chats/{chat}'
*/
update.put = (args: { chat: string | number } | [chat: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\ChatController::update
* @see app/Http/Controllers/ChatController.php:0
* @route '/chats/{chat}'
*/
update.patch = (args: { chat: string | number } | [chat: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\ChatController::update
* @see app/Http/Controllers/ChatController.php:0
* @route '/chats/{chat}'
*/
const updateForm = (args: { chat: string | number } | [chat: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ChatController::update
* @see app/Http/Controllers/ChatController.php:0
* @route '/chats/{chat}'
*/
updateForm.put = (args: { chat: string | number } | [chat: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ChatController::update
* @see app/Http/Controllers/ChatController.php:0
* @route '/chats/{chat}'
*/
updateForm.patch = (args: { chat: string | number } | [chat: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

update.form = updateForm

/**
* @see \App\Http\Controllers\ChatController::destroy
* @see app/Http/Controllers/ChatController.php:0
* @route '/chats/{chat}'
*/
export const destroy = (args: { chat: string | number } | [chat: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/chats/{chat}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\ChatController::destroy
* @see app/Http/Controllers/ChatController.php:0
* @route '/chats/{chat}'
*/
destroy.url = (args: { chat: string | number } | [chat: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { chat: args }
    }

    if (Array.isArray(args)) {
        args = {
            chat: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        chat: args.chat,
    }

    return destroy.definition.url
            .replace('{chat}', parsedArgs.chat.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ChatController::destroy
* @see app/Http/Controllers/ChatController.php:0
* @route '/chats/{chat}'
*/
destroy.delete = (args: { chat: string | number } | [chat: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\ChatController::destroy
* @see app/Http/Controllers/ChatController.php:0
* @route '/chats/{chat}'
*/
const destroyForm = (args: { chat: string | number } | [chat: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ChatController::destroy
* @see app/Http/Controllers/ChatController.php:0
* @route '/chats/{chat}'
*/
destroyForm.delete = (args: { chat: string | number } | [chat: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\ChatController::takeover
* @see app/Http/Controllers/ChatController.php:83
* @route '/chats/{chat}/takeover'
*/
export const takeover = (args: { chat: string | number } | [chat: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: takeover.url(args, options),
    method: 'post',
})

takeover.definition = {
    methods: ["post"],
    url: '/chats/{chat}/takeover',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ChatController::takeover
* @see app/Http/Controllers/ChatController.php:83
* @route '/chats/{chat}/takeover'
*/
takeover.url = (args: { chat: string | number } | [chat: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { chat: args }
    }

    if (Array.isArray(args)) {
        args = {
            chat: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        chat: args.chat,
    }

    return takeover.definition.url
            .replace('{chat}', parsedArgs.chat.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ChatController::takeover
* @see app/Http/Controllers/ChatController.php:83
* @route '/chats/{chat}/takeover'
*/
takeover.post = (args: { chat: string | number } | [chat: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: takeover.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ChatController::takeover
* @see app/Http/Controllers/ChatController.php:83
* @route '/chats/{chat}/takeover'
*/
const takeoverForm = (args: { chat: string | number } | [chat: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: takeover.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ChatController::takeover
* @see app/Http/Controllers/ChatController.php:83
* @route '/chats/{chat}/takeover'
*/
takeoverForm.post = (args: { chat: string | number } | [chat: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: takeover.url(args, options),
    method: 'post',
})

takeover.form = takeoverForm

/**
* @see \App\Http\Controllers\ChatController::resolve
* @see app/Http/Controllers/ChatController.php:154
* @route '/chats/{chat}/resolve'
*/
export const resolve = (args: { chat: string | number } | [chat: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: resolve.url(args, options),
    method: 'post',
})

resolve.definition = {
    methods: ["post"],
    url: '/chats/{chat}/resolve',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ChatController::resolve
* @see app/Http/Controllers/ChatController.php:154
* @route '/chats/{chat}/resolve'
*/
resolve.url = (args: { chat: string | number } | [chat: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { chat: args }
    }

    if (Array.isArray(args)) {
        args = {
            chat: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        chat: args.chat,
    }

    return resolve.definition.url
            .replace('{chat}', parsedArgs.chat.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ChatController::resolve
* @see app/Http/Controllers/ChatController.php:154
* @route '/chats/{chat}/resolve'
*/
resolve.post = (args: { chat: string | number } | [chat: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: resolve.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ChatController::resolve
* @see app/Http/Controllers/ChatController.php:154
* @route '/chats/{chat}/resolve'
*/
const resolveForm = (args: { chat: string | number } | [chat: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: resolve.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ChatController::resolve
* @see app/Http/Controllers/ChatController.php:154
* @route '/chats/{chat}/resolve'
*/
resolveForm.post = (args: { chat: string | number } | [chat: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: resolve.url(args, options),
    method: 'post',
})

resolve.form = resolveForm

const chats = {
    index: Object.assign(index, index),
    create: Object.assign(create, create),
    store: Object.assign(store, store),
    show: Object.assign(show, show),
    edit: Object.assign(edit, edit),
    update: Object.assign(update, update),
    destroy: Object.assign(destroy, destroy),
    takeover: Object.assign(takeover, takeover),
    resolve: Object.assign(resolve, resolve),
}

export default chats