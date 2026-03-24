import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\CatalogController::index
 * @see app/Http/Controllers/CatalogController.php:12
 * @route '/catalogs'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/catalogs',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CatalogController::index
 * @see app/Http/Controllers/CatalogController.php:12
 * @route '/catalogs'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CatalogController::index
 * @see app/Http/Controllers/CatalogController.php:12
 * @route '/catalogs'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CatalogController::index
 * @see app/Http/Controllers/CatalogController.php:12
 * @route '/catalogs'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CatalogController::index
 * @see app/Http/Controllers/CatalogController.php:12
 * @route '/catalogs'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\CatalogController::index
 * @see app/Http/Controllers/CatalogController.php:12
 * @route '/catalogs'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\CatalogController::index
 * @see app/Http/Controllers/CatalogController.php:12
 * @route '/catalogs'
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
* @see \App\Http\Controllers\CatalogController::create
 * @see app/Http/Controllers/CatalogController.php:23
 * @route '/catalogs/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/catalogs/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CatalogController::create
 * @see app/Http/Controllers/CatalogController.php:23
 * @route '/catalogs/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CatalogController::create
 * @see app/Http/Controllers/CatalogController.php:23
 * @route '/catalogs/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CatalogController::create
 * @see app/Http/Controllers/CatalogController.php:23
 * @route '/catalogs/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CatalogController::create
 * @see app/Http/Controllers/CatalogController.php:23
 * @route '/catalogs/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\CatalogController::create
 * @see app/Http/Controllers/CatalogController.php:23
 * @route '/catalogs/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\CatalogController::create
 * @see app/Http/Controllers/CatalogController.php:23
 * @route '/catalogs/create'
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
* @see \App\Http\Controllers\CatalogController::store
 * @see app/Http/Controllers/CatalogController.php:28
 * @route '/catalogs'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/catalogs',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\CatalogController::store
 * @see app/Http/Controllers/CatalogController.php:28
 * @route '/catalogs'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CatalogController::store
 * @see app/Http/Controllers/CatalogController.php:28
 * @route '/catalogs'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\CatalogController::store
 * @see app/Http/Controllers/CatalogController.php:28
 * @route '/catalogs'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\CatalogController::store
 * @see app/Http/Controllers/CatalogController.php:28
 * @route '/catalogs'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\CatalogController::show
 * @see app/Http/Controllers/CatalogController.php:43
 * @route '/catalogs/{catalog}'
 */
export const show = (args: { catalog: number | { id: number } } | [catalog: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/catalogs/{catalog}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CatalogController::show
 * @see app/Http/Controllers/CatalogController.php:43
 * @route '/catalogs/{catalog}'
 */
show.url = (args: { catalog: number | { id: number } } | [catalog: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { catalog: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { catalog: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    catalog: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        catalog: typeof args.catalog === 'object'
                ? args.catalog.id
                : args.catalog,
                }

    return show.definition.url
            .replace('{catalog}', parsedArgs.catalog.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CatalogController::show
 * @see app/Http/Controllers/CatalogController.php:43
 * @route '/catalogs/{catalog}'
 */
show.get = (args: { catalog: number | { id: number } } | [catalog: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CatalogController::show
 * @see app/Http/Controllers/CatalogController.php:43
 * @route '/catalogs/{catalog}'
 */
show.head = (args: { catalog: number | { id: number } } | [catalog: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CatalogController::show
 * @see app/Http/Controllers/CatalogController.php:43
 * @route '/catalogs/{catalog}'
 */
    const showForm = (args: { catalog: number | { id: number } } | [catalog: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\CatalogController::show
 * @see app/Http/Controllers/CatalogController.php:43
 * @route '/catalogs/{catalog}'
 */
        showForm.get = (args: { catalog: number | { id: number } } | [catalog: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\CatalogController::show
 * @see app/Http/Controllers/CatalogController.php:43
 * @route '/catalogs/{catalog}'
 */
        showForm.head = (args: { catalog: number | { id: number } } | [catalog: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\CatalogController::edit
 * @see app/Http/Controllers/CatalogController.php:50
 * @route '/catalogs/{catalog}/edit'
 */
export const edit = (args: { catalog: number | { id: number } } | [catalog: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/catalogs/{catalog}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CatalogController::edit
 * @see app/Http/Controllers/CatalogController.php:50
 * @route '/catalogs/{catalog}/edit'
 */
edit.url = (args: { catalog: number | { id: number } } | [catalog: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { catalog: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { catalog: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    catalog: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        catalog: typeof args.catalog === 'object'
                ? args.catalog.id
                : args.catalog,
                }

    return edit.definition.url
            .replace('{catalog}', parsedArgs.catalog.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CatalogController::edit
 * @see app/Http/Controllers/CatalogController.php:50
 * @route '/catalogs/{catalog}/edit'
 */
edit.get = (args: { catalog: number | { id: number } } | [catalog: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CatalogController::edit
 * @see app/Http/Controllers/CatalogController.php:50
 * @route '/catalogs/{catalog}/edit'
 */
edit.head = (args: { catalog: number | { id: number } } | [catalog: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CatalogController::edit
 * @see app/Http/Controllers/CatalogController.php:50
 * @route '/catalogs/{catalog}/edit'
 */
    const editForm = (args: { catalog: number | { id: number } } | [catalog: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\CatalogController::edit
 * @see app/Http/Controllers/CatalogController.php:50
 * @route '/catalogs/{catalog}/edit'
 */
        editForm.get = (args: { catalog: number | { id: number } } | [catalog: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\CatalogController::edit
 * @see app/Http/Controllers/CatalogController.php:50
 * @route '/catalogs/{catalog}/edit'
 */
        editForm.head = (args: { catalog: number | { id: number } } | [catalog: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\CatalogController::update
 * @see app/Http/Controllers/CatalogController.php:57
 * @route '/catalogs/{catalog}'
 */
export const update = (args: { catalog: number | { id: number } } | [catalog: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/catalogs/{catalog}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\CatalogController::update
 * @see app/Http/Controllers/CatalogController.php:57
 * @route '/catalogs/{catalog}'
 */
update.url = (args: { catalog: number | { id: number } } | [catalog: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { catalog: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { catalog: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    catalog: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        catalog: typeof args.catalog === 'object'
                ? args.catalog.id
                : args.catalog,
                }

    return update.definition.url
            .replace('{catalog}', parsedArgs.catalog.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CatalogController::update
 * @see app/Http/Controllers/CatalogController.php:57
 * @route '/catalogs/{catalog}'
 */
update.put = (args: { catalog: number | { id: number } } | [catalog: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\CatalogController::update
 * @see app/Http/Controllers/CatalogController.php:57
 * @route '/catalogs/{catalog}'
 */
update.patch = (args: { catalog: number | { id: number } } | [catalog: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\CatalogController::update
 * @see app/Http/Controllers/CatalogController.php:57
 * @route '/catalogs/{catalog}'
 */
    const updateForm = (args: { catalog: number | { id: number } } | [catalog: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\CatalogController::update
 * @see app/Http/Controllers/CatalogController.php:57
 * @route '/catalogs/{catalog}'
 */
        updateForm.put = (args: { catalog: number | { id: number } } | [catalog: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\CatalogController::update
 * @see app/Http/Controllers/CatalogController.php:57
 * @route '/catalogs/{catalog}'
 */
        updateForm.patch = (args: { catalog: number | { id: number } } | [catalog: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\CatalogController::destroy
 * @see app/Http/Controllers/CatalogController.php:72
 * @route '/catalogs/{catalog}'
 */
export const destroy = (args: { catalog: number | { id: number } } | [catalog: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/catalogs/{catalog}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\CatalogController::destroy
 * @see app/Http/Controllers/CatalogController.php:72
 * @route '/catalogs/{catalog}'
 */
destroy.url = (args: { catalog: number | { id: number } } | [catalog: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { catalog: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { catalog: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    catalog: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        catalog: typeof args.catalog === 'object'
                ? args.catalog.id
                : args.catalog,
                }

    return destroy.definition.url
            .replace('{catalog}', parsedArgs.catalog.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CatalogController::destroy
 * @see app/Http/Controllers/CatalogController.php:72
 * @route '/catalogs/{catalog}'
 */
destroy.delete = (args: { catalog: number | { id: number } } | [catalog: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\CatalogController::destroy
 * @see app/Http/Controllers/CatalogController.php:72
 * @route '/catalogs/{catalog}'
 */
    const destroyForm = (args: { catalog: number | { id: number } } | [catalog: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\CatalogController::destroy
 * @see app/Http/Controllers/CatalogController.php:72
 * @route '/catalogs/{catalog}'
 */
        destroyForm.delete = (args: { catalog: number | { id: number } } | [catalog: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const CatalogController = { index, create, store, show, edit, update, destroy }

export default CatalogController