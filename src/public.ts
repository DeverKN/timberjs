import { Directive, directives, scopes, makeFuncFromString, makeGlobalsProxy } from "../timberjs/directives";
import { effect } from "../timberjs/state";

export const makeDirective = (callback: any) => {
    const [name, directive] = callback({makeFuncFromString, makeGlobalsProxy})
    addDirective(name, directive)
}

export const addDirective = (directiveName: string, directiveFunc: Directive) => {
    directives.set(directiveName, directiveFunc)
}

export const getScope = (scopeId: string) => {
    return scopes.get(scopeId)
}

export {effect}