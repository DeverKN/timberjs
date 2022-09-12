import { CompilableDirective } from "../compilerDirectives"


type xTeleportData = {
    selector: string
}

export const xTeleport: CompilableDirective<xTeleportData> = {
    middleware: (value, _directiveArgument, _directiveModifiers) => {
        return {
            selector: value
        }
    },
    instance: (element, scope, {selector}) => {
        const host = document.querySelector(selector)
        host?.appendChild(element)
        return scope
    }
}