import { CompilableDirective } from "../compilerDirectives"


type xCloakData = null

export const xCloak: CompilableDirective<xCloakData> = {
    middleware: (_value, _directiveArgument, _directiveModifiers) => {
        return null
    },
    instance: (element, scope) => {
        element.removeAttribute("x-cloak")
        return scope
    }
}