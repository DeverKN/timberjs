import { effect, makeScopeProxy, Scope } from "./state"

export type Directive = (element: Element, value: string, scope: Scope, argument: string, modifiers: string[]) => Scope

type GlobalsObj = {
    [key: string | symbol]: any
}

type DirectiveHandler<T> = (globals: GlobalsObj) => T

const bindEmit = (element: Element) => {
    const emit = (eventName: string) => {
        element.dispatchEvent(new Event(eventName))
    }
    return emit
}

export const directives = new Map<string, Directive>()

const AsyncFunction = (async function () {}).constructor;

const makeBaseGlobals = (element: Element) => {
    return {
        $el: element,
        $emit: bindEmit(element)
    }
}

export const makeGlobalsProxy = (scope: Scope, otherGlobals: GlobalsObj): GlobalsObj => {
    return new Proxy({}, {
        has: (_target, key) => {
            return (key in scope || key in otherGlobals)
        },
        get: (_target, prop, _reciever) => {
            if (prop in scope) {
                return scope[prop]
            } else {
                return otherGlobals[prop]
            }
        },
        set: (_target, prop, value, _reciever) => {
            if (prop in scope) {
                scope[prop] = value
            } else {
                otherGlobals[prop] = value
            }
            return true
        }
    })
}

export const makeFuncFromString = <T>(funcString: string): DirectiveHandler<T> => {
    return new Function("additionalGlobals = {}", 
                            `with (additionalGlobals) {
                                return ${funcString}
                            }`) as DirectiveHandler<T>
}


const xOn: Directive = (element, value, scope, directiveArgument, _directiveModifiers) => {
    const globals = makeGlobalsProxy(scope, element)
    const eventCallback = makeFuncFromString<void>(value)
    element.addEventListener(directiveArgument, (event) => {
        globals.$event = event
        eventCallback(globals)
    })
    return scope
}

const xText: Directive = (element, value, scope, _directiveArgument, _directiveModifiers) => {
    const globals = makeGlobalsProxy(scope, makeBaseGlobals(element))
    const textCallback = makeFuncFromString<string>(value)
    effect(() => {
        element.textContent = textCallback(globals)
    })
    return scope
}

export const scopes = new Map<string, Scope>()

let nextScopeId = 0
const xScope: Directive = (element, value, scope, directiveArgument, _directiveModifiers) => {
    const globals = makeGlobalsProxy(scope, makeBaseGlobals(element))
    const baseData = makeFuncFromString<object>(value)(globals) ?? {}
    const newScope = makeScopeProxy(baseData, scope)
    let scopeId = directiveArgument || `__scope_${nextScopeId++}`
    element.dataset.scopeId = scopeId
    scopes.set(scopeId, newScope)
    return newScope
}

const xInit: Directive = (element, value, scope, _directiveArgument, _directiveModifiers) => {
    const globals = makeGlobalsProxy(scope, makeBaseGlobals(element))
    makeFuncFromString<object>(value)(globals)
    return scope
}

const xNoOp: Directive = (_element, _value, scope, _directiveArgument, _directiveModifiers) => {
    return scope
}

const xCloak: Directive = (element, _value, scope, _directiveArgument, _directiveModifiers) => {
    element.removeAttribute("x-cloak")
    return scope
}

const xRef: Directive = (element, value, scope, _directiveArgument, _directiveModifiers) => {
    scope[value] = element
    return scope
}

const xHide: Directive = (element, value, scope, _directiveArgument, _directiveModifiers) => {
    const globals = makeGlobalsProxy(scope, makeBaseGlobals(element))
    const shouldHide = makeFuncFromString<boolean>(value)
    effect(() => {
        if (shouldHide(globals)) {
            element.setAttribute("hidden", "")
        } else {
            element.removeAttribute("hidden")
        }
    })
    return scope
}

const xModel: Directive = (element, value, scope, directiveArgument, _directiveModifiers) => {
    element.addEventListener("input", () => {
        const newVal = element[directiveArgument]
        scope[value] = newVal
    })
    effect(() => {
        element.setAttribute(directiveArgument, scope[value])
    })
    return scope
}

const xIf: Directive = (element, value, scope, _directiveArgument, _directiveModifiers) => {
    const globals = makeGlobalsProxy(scope, makeBaseGlobals(element))
    const ifCondition = makeFuncFromString<boolean>(value)
    let child = element.firstChild!
    let shown = true
    effect(() => {
        // element.setAttribute(directiveArgument, scope[value])
        const ifTrue = ifCondition(globals)
        // console.log({ifTrue})
        if (ifTrue) {
            if (!shown) {
                element.appendChild(child)
                shown = true
            }
        } else if (shown) {
            element.removeChild(child)
            shown = false
        }
    })

    return scope
}

const xEffect: Directive = (element, value, scope, _directiveArgument, _directiveModifiers) => {
    const globals = makeGlobalsProxy(scope, makeBaseGlobals(element))
    const effectFunc = makeFuncFromString<any>(value)
    effect(() => {
        effectFunc(globals)
    })
    return scope
}

const xTemplate: Directive = (element, value, scope, _directiveArgument, _directiveModifiers) => {
    scope[value] = element.content
    return scope
}

const xComponent: Directive = (element, value, scope, directiveArgument, _directiveModifiers) => {
    const outerScope = document.createElement("span")
    outerScope.setAttribute("x-scope", value)
    outerScope.appendChild(scope[directiveArgument].cloneNode(true))
    element.appendChild(outerScope)
    return scope
}

const xTeleport: Directive = (element, value, scope, _directiveArgument, _directiveModifiers) => {
    const host = document.querySelector(value)
    host?.appendChild(element)
    return scope
}

const xBind: Directive = (element, value, scope, directiveArgument, _directiveModifiers) => {
    const globals = makeGlobalsProxy(scope, makeBaseGlobals(element))
    const effectFunc = makeFuncFromString<any>(value)
    effect(() => {
        element.setAttribute(directiveArgument, effectFunc(globals))
    })
    return scope
}

const xFor: Directive = (element, value, scope, _directiveArgument, _directiveModifiers) => {
    const globals = makeGlobalsProxy(scope, makeBaseGlobals(element))
    const baseChild = element.firstChild!
    // console.log({baseChild})
    element.removeChild(baseChild)
    let [itemName, interableName] = value.split(" in ")
    let indexName: string | null = null;
    if (itemName.includes(",")) {
        const nameIndexRegex = /\((?<itemName>[^,]+), *(?<indexName>[^,]+)\)/
        const match = itemName.match(nameIndexRegex)
        itemName = match?.groups!.itemName!
        indexName = match?.groups!.indexName!
    } 
    const getIterable = makeFuncFromString<any>(interableName)
    console.log({itemName, interableName})
    effect(() => {
        // element.replaceChildren()
        let currChild = element.firstChild
        const res = getIterable(globals)
        const iterable = (typeof res === "number" ? 
                        [...Array(scope[interableName]).keys()] : 
                        ((Symbol.iterator in Object(res)) ? res : Object.keys(res)))

        for (let index = 0; index < iterable.length; ++index) {
            const item = iterable[index]
            if (currChild) {
                currChild = currChild.nextSibling
            } else {
                const outerScope = document.createElement("span")
                const scopeVals = indexName ? `{${itemName}: ${item}, ${indexName}: ${index}}` : `{${itemName}: ${item}}`
                outerScope.setAttribute("x-scope", scopeVals)
                outerScope.appendChild(baseChild.cloneNode(true))
                element.appendChild(outerScope)
            }
        }

        while (currChild) {
            const nextChild = currChild.nextSibling
            currChild.remove()
            currChild = nextChild
        }
        // element.setAttribute(directiveArgument, effectFunc(globals))
    })
    return scope
}

directives.set("x-on", xOn)
directives.set("x-scope", xScope)
directives.set("x-text", xText)
directives.set("x-init", xInit)
directives.set("x-cloak", xCloak)
directives.set("x-ref", xRef)
directives.set("x-hide", xHide)
directives.set("x-model", xModel)
directives.set("x-if", xIf)
directives.set("x-effect", xEffect)
directives.set("x-template", xTemplate)
directives.set("x-component", xComponent)
directives.set("x-teleport", xTeleport)
directives.set("x-bind", xBind)
directives.set("x-root", xNoOp)
directives.set("x-for", xFor)