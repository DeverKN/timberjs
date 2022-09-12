import { CompilableDirective, DirectiveHandler, makeBaseGlobals, makeFuncFromString, makeGlobalsProxy } from "../../directives"
import { handleChild } from "../../parser"
import { effect } from "../../state"

type xBindData = {
    attributeName: string,
    boundValueGetter: DirectiveHandler<any>
}

export const xBind: CompilableDirective<xBindData> = {
    middleware: (value, directiveArgument, _directiveModifiers) => {
        return {
            attributeName: directiveArgument,
            boundValueGetter: makeFuncFromString<any>(value)
        }
    },
    instance: (element, scope, {attributeName, boundValueGetter}) => {
        const globals = makeGlobalsProxy(scope, makeBaseGlobals(element))
        effect(() => {
            element.setAttribute(attributeName, boundValueGetter(globals))
        })
        return scope
    }
}