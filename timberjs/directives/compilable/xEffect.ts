import { CompilableDirective, DirectiveHandler, makeBaseGlobals, makeFuncFromString, makeGlobalsProxy } from "../../directives"
import { handleChild } from "../../parser"
import { effect } from "../../state"

type xEffectData = {
    effectFunc: DirectiveHandler<void>
}

export const xEffect: CompilableDirective<xEffectData> = {
    middleware: (value, _directiveArgument, _directiveModifiers) => {
        return {
            effectFunc: makeFuncFromString<void>(value)
        }
    },
    instance: (element, scope, {effectFunc}) => {
        const globals = makeGlobalsProxy(scope, makeBaseGlobals(element))
        effect(() => {
            effectFunc(globals)
        })
        return scope
    }
}