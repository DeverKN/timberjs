import { DirectiveHandler, makeBaseGlobals, makeFuncFromString, makeGlobalsProxy } from "../../directives"
import { scopes } from "../../runtime/handleDirective"
import { makeScopeProxy } from "../../state"
import { CompilableDirective } from "../compilerDirectives"

type xScopeData = {
    dataGetter: DirectiveHandler<object>,
    scopeId: string
}

let nextScopeId = 0
export const xScope: CompilableDirective<xScopeData> = {
    middleware: (value, _directiveArgument, _directiveModifiers) => {
        return {
            dataGetter: makeFuncFromString(value),
            scopeId: `__scope_${nextScopeId++}`
        }
    },
    instance: (element, scope, {dataGetter, scopeId}) => {
        console.log({parentscope: scope})
        const globals = makeGlobalsProxy(scope, makeBaseGlobals(element))
        const baseData = dataGetter(globals) ?? {}
        const newScope = makeScopeProxy(baseData, scope)
        element.dataset.scopeId = scopeId
        scopes.set(scopeId, newScope)
        return newScope
    }
}