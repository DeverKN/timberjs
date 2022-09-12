import { CompilableDirective, DirectiveHandler, makeBaseGlobals, makeFuncFromString, makeGlobalsProxy } from "../../directives"
import { effect } from "../../state"

type xHideData = {
    shouldHide: DirectiveHandler<boolean>
}

export const xHide: CompilableDirective<xHideData> = {
    middleware: (value, _directiveArgument, _directiveModifiers) => {
        return {
            shouldHide: makeFuncFromString<boolean>(value)
        }
    },
    instance: (element, scope, {shouldHide}) => {
        const globals = makeGlobalsProxy(scope, makeBaseGlobals(element))
        effect(() => {
            if (shouldHide(globals)) {
                element.setAttribute("hidden", "")
            } else {
                element.removeAttribute("hidden")
            }
        })
        return scope
    }
}