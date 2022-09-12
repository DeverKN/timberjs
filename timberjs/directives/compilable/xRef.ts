import { CompilableDirective, DirectiveHandler, makeBaseGlobals, makeFuncFromString, makeGlobalsProxy } from "../../directives"
import { effect } from "../../state"

type xRefData = {
    refVar: string
}

export const xRef: CompilableDirective<xRefData> = {
    middleware: (value, _directiveArgument, _directiveModifiers) => {
        return {
            refVar: value
        }
    },
    instance: (element, scope, {refVar}) => {
        scope[refVar] = element
        return scope
    }
}