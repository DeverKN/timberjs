import { DirectiveHandler, makeBaseGlobals, makeFuncFromString, makeGlobalsProxy } from "../../directives"
// import { scopes } from "../../runtime/handleDirective"
import { effect, makeScopeProxy } from "../../state"
import { CompilableDirective } from "../compilerDirectives"

type xContextData = {
    contextGetter: DirectiveHandler<any>,
    contextName: string
}

export const contexts = makeScopeProxy({})

export const xContext: CompilableDirective<xContextData> = {
    middleware: (value, directiveArgument, _directiveModifiers) => {
        return {
            contextGetter: makeFuncFromString(value),
            contextName: directiveArgument
        }
    },
    instance: (element, scope, {contextGetter, contextName}) => {
        // console.log({parentscope: scope})
        const contextId = contexts.size
        const globals = makeGlobalsProxy(scope, makeBaseGlobals(element))
        effect(() => {
            const context = contextGetter(globals)
            contexts[contextId] = context
        })

        element.dataset.contextName = contextName
        element.dataset.contextId = contextId
        
        return scope
    }/*,
    ssrInstance: (element, scope, {dataGetter, scopeId}) => {
        const globals = makeGlobalsProxy(scope, {})
        const baseData = dataGetter(globals) ?? {}
        const newScope = makeScopeProxy(baseData, scope)
        newScope['$root'] = element
        // element.dataset.scopeId = scopeId
        // scopes.set(scopeId, newScope)
        return newScope
    }*/
}