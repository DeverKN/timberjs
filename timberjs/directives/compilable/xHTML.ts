import { DirectiveHandler, makeBaseGlobals, makeFuncFromString, makeGlobalsProxy } from "../../directives"
import { handleChild } from "../../parser"
import { effect } from "../../state"
import { CompilableDirective } from "../compilerDirectives"

type xHTMLData = {
    htmlCallback: DirectiveHandler<string | Element>,
    isTimber: boolean,
    isElement: boolean
}

export const xHTML: CompilableDirective<xHTMLData> = {
    middleware: (value, directiveArgument, _directiveModifiers) => {
        return {
            htmlCallback: makeFuncFromString<string | Element>(value),
            isTimber: directiveArgument === "timber",
            isElement: directiveArgument === "element"
        }
    },
    instance: (element, scope, {htmlCallback, isTimber, isElement}) => {
        const globals = makeGlobalsProxy(scope, makeBaseGlobals(element))

        effect(() => {
            if (isElement) {
                // console.log({funcStr: htmlCallback.toString()})
                const innerHTML = htmlCallback(globals) as Element
                console.log({innerHTML})
                element.replaceChildren(innerHTML/*.cloneNode(true)*/)
            } else {
                const innerHTML = htmlCallback(globals) as string
                element.innerHTML = innerHTML
            }
            if (isTimber && element.firstChild) {
                handleChild(element.firstChild, scope)
            }
        })
        return scope
    }
}