import { CompilableDirective, DirectiveHandler, makeBaseGlobals, makeFuncFromString, makeGlobalsProxy, scopes } from "../../directives"
import { effect, makeScopeProxy } from "../../state"

type xCloakData = null

export const xCloak: CompilableDirective<xCloakData> = {
    middleware: (value, directiveArgument, _directiveModifiers) => {
        return null
    },
    instance: (element, scope) => {
        element.removeAttribute("x-cloak")
        return scope
    }
}