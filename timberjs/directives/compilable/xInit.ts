import { DirectiveHandler, makeBaseGlobals, makeFuncFromString, makeGlobalsProxy } from "../../directives"
import { CompilableDirective } from "../compilerDirectives"

type xInitData = {
    initCallback: DirectiveHandler<void>
}

export const xInit: CompilableDirective<xInitData> = {
    middleware: (value, _directiveArgument, _directiveModifiers) => {
        return {
            initCallback: makeFuncFromString(value)
        }
    },
    instance: (element, scope, {initCallback}) => {
        const globals = makeGlobalsProxy(scope, makeBaseGlobals(element))
        initCallback(globals)
        return scope
    }
}