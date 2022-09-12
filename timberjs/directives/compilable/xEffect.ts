import { DirectiveHandler, makeBaseGlobals, makeFuncFromString, makeGlobalsProxy } from "../../directives"
import { effect } from "../../state"
import { CompilableDirective } from "../compilerDirectives"

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