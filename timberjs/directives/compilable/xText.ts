import { DirectiveHandler, makeBaseGlobals, makeFuncFromString, makeGlobalsProxy } from "../../directives"
import { effect } from "../../state"
import { CompilableDirective } from "../compilerDirectives"

type xTextData = {
    textCallback: DirectiveHandler<string>
}

export const xText: CompilableDirective<xTextData> = {
    middleware: (value, _directiveArgument, _directiveModifiers) => {
        const textCallback = makeFuncFromString<string>(value)
        return {
            textCallback
        }
    },
    instance: (element, scope, {textCallback}) => {
        const globals = makeGlobalsProxy(scope, makeBaseGlobals(element))
        effect(() => {
            element.textContent = textCallback(globals)
        })
        return scope
    }
}