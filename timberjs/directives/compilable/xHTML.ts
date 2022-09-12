import { CompilableDirective, DirectiveHandler, makeBaseGlobals, makeFuncFromString, makeGlobalsProxy } from "../../directives"
import { handleChild } from "../../parser"
import { effect } from "../../state"

type xHTMLData = {
    htmlCallback: DirectiveHandler<string | Element>,
    isTimber: boolean
}

export const xHTML: CompilableDirective<xHTMLData> = {
    middleware: (value, directiveArgument, _directiveModifiers) => {
        return {
            htmlCallback: makeFuncFromString<string | Element>(value),
            isTimber: directiveArgument === "timber"
        }
    },
    instance: (element, scope, {htmlCallback, isTimber}) => {
        const globals = makeGlobalsProxy(scope, makeBaseGlobals(element))

        effect(() => {
            const innerHTML = htmlCallback(globals)
            if (typeof innerHTML === "string") {
                element.innerHTML = innerHTML
            } else {
                element.replaceChildren(innerHTML.cloneNode(true))
            }
            if (isTimber && element.firstChild) {
                handleChild(element.firstChild, scope)
            }
        })
        return scope
    }
}