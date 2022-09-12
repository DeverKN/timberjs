import { compilerDirectives, FirstElementCloner } from "../directives/compilerDirectives"
import { Scope } from "../state"

export const scopes = new Map<string, Scope>()

export const handleDirective = (directiveName: string, element: HTMLElement, directiveData: object, scopeOrId: string | Scope, cloneFirstChild: FirstElementCloner) => {
    const directive = compilerDirectives.get(directiveName)
    if (directive) {
        const scope = typeof scopeOrId === "string" ? scopes.get(scopeOrId) ?? {} : scopeOrId
        console.log({scope})
        directive.instance(element, scope, directiveData, cloneFirstChild)
    } else {
        console.error(`Unknown directive ${directiveName}`)
    }
}