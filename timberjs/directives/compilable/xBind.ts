import { DirectiveHandler, makeBaseGlobals, makeFuncFromString, makeGlobalsProxy } from "../../directives"
import { effect } from "../../state"
import { CompilableDirective } from "../compilerDirectives"

type xBindData = {
    attributeName: string,
    boundValueGetter: DirectiveHandler<any>,
    once: boolean
}

export const xBind: CompilableDirective<xBindData> = {
    middleware: (value, directiveArgument, directiveModifiers) => {
        return {
            attributeName: directiveArgument,
            boundValueGetter: makeFuncFromString<any>(value),
            once: directiveModifiers.includes('once')
        }
    },
    instance: (element, scope, {attributeName, boundValueGetter, once}) => {
        const globals = makeGlobalsProxy(scope, makeBaseGlobals(element))
        if (once) {
            element.setAttribute(attributeName, boundValueGetter(globals))
        } else {
            effect(() => {
                element.setAttribute(attributeName, boundValueGetter(globals))
            })
        }
        return scope
    }
}