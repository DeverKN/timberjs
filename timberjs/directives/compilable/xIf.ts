import { DirectiveHandler, makeBaseGlobals, makeFuncFromString, makeGlobalsProxy } from "../../directives"
import { handleChild } from "../../parser"
import { effect } from "../../state"
import { CompilableDirective } from "../compilerDirectives"

type xIfData = {
    ifCondition: DirectiveHandler<boolean>
}

export const xIf: CompilableDirective<xIfData> = {
    middleware: (value, _directiveArgument, _directiveModifiers) => {
        return {
            ifCondition: makeFuncFromString<boolean>(value)
        }
    },
    instance: (element, scope, {ifCondition}) => {
        const globals = makeGlobalsProxy(scope, makeBaseGlobals(element))
        let child = element.firstElementChild!
        // element.appendChild(newChild)
        handleChild(child, scope)
        let shown = true
        effect(() => {
            // element.setAttribute(directiveArgument, scope[value])
            const ifTrue = ifCondition(globals)
            console.log({ifTrue})
            if (ifTrue) {
                if (!shown) {
                    console.log("append")
                    element.appendChild(child)
                    shown = true
                }
            } else if (shown) {
                // console.log({remove: element.firstElementChild})
                console.log("remove")
                element.removeChild(element.firstElementChild!)
                shown = false
            }
        })
    
        return scope
    },
    usesChildren: true
}