import { contexts } from "./directives/compilable/xContext"
import { handleChild } from "./parser"
import { effect, makeScopeProxy, Scope } from "./state"

export type Directive = (element: HTMLElement, value: string, scope: Scope, argument: string, modifiers: string[]) => Scope

export type GlobalsObj = {
    [key: string | symbol]: any
}

export type DirectiveHandler<T> = (globals: GlobalsObj) => T

export type BoundEmit = (eventName: string, payload: any, options: CustomEventInit<any>) => void

const bindEmit = (element: HTMLElement): BoundEmit => {
    const emit = (eventName: string, payload = null, options = {}) => {
        console.log({eventName})
        element.dispatchEvent(new CustomEvent(eventName, { detail: payload, bubbles: true, composed: true, ...options}))
    }
    return emit
}

export const directives = new Map<string, Directive>()

// const AsyncFunction = (async function () {}).constructor;

// const makeContextProxy = (element: HTMLElement) => {
//  return new Proxy({}, {
//     get: (target, prop, reciever) => {
//         if (typeof prop === "string") {
//             const contextProvider = (element.closest(`[data-context-name="${prop}"]`) ?? element.shadowRoot.closest(`[data-context-name="${prop}"]`)) as HTMLElement
//             const resolvedContextId = contextProvider.dataset.contextId
//             return contexts[resolvedContextId]
//         } else {
//             throw Error("Symbols cannot be used as context keys")
//         }
//     },
//     set: (target, prop, newVal, reciever) => {
//         throw Error("Cannot set properties of '$context', it is read-only")
//     }
// })
// } 

export const makeBaseGlobals = (element: HTMLElement) => {
    return {
        $el: element,
        $emit: bindEmit(element),
        // $context: makeContextProxy(element),
    }
}

export const makeGlobalsProxy = (scope: Scope, otherGlobals: GlobalsObj): GlobalsObj => {
    return new Proxy({}, {
        has: (_target, key) => {
            return (key in scope || key in otherGlobals || !(key in globalThis))
        },
        get: (_target, prop, _reciever) => {
            if (prop in scope) {
                return scope[prop]
            } else {
                return otherGlobals[prop]
            }
        },
        set: (_target, prop, value, _reciever) => {
            const local = prop in scope
            const global = prop in otherGlobals
            console.log({prop, local, global})
            if (local) {
                scope[prop] = value
            } else if (global) {
                otherGlobals[prop] = value
            } else if (prop in globalThis) {
                globalThis[prop] = value
            } else {
                scope[prop] = value
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


const xOn: Directive = (element, value, scope, directiveArgument, directiveModifiers) => {
    const nonOptionModifiers = ["window", "document"]
    const globals = makeGlobalsProxy(scope, element)
    const eventCallback = makeFuncFromString<void>(value)
    const options = Object.fromEntries(directiveModifiers.filter(modifier => !nonOptionModifiers.includes(modifier)).map(modifier => [modifier, true]))
    let eventTarget: EventTarget = element
    if (directiveModifiers.includes("window")) eventTarget = window
    if (directiveModifiers.includes("document")) eventTarget = document
    eventTarget.addEventListener(directiveArgument, (event) => {
        globals.$event = event
        eventCallback(globals)
    }, options)
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

const xHTML: Directive = (element, value, scope, directiveArgument, _directiveModifiers) => {
    const globals = makeGlobalsProxy(scope, makeBaseGlobals(element))
    const htmlCallback = makeFuncFromString<string | Element>(value)
    effect(() => {
        const innerHTML = htmlCallback(globals)
        if (typeof innerHTML === "string") {
            element.innerHTML = innerHTML
        } else {
            element.replaceChildren(innerHTML.cloneNode(true))
        }
        if (directiveArgument === "timber" && element.firstChild) {
            handleChild(element.firstChild, scope)
        }
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
    makeFuncFromString<void>(value)(globals)
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

const xModel: Directive = (element, value, scope, _directiveArgument, _directiveModifiers) => {
    const tagName = element.tagName.toLowerCase()
    switch (tagName) {
        case ("input"):
            const inputElement = element as HTMLInputElement
            const inputType = inputElement.getAttribute("type") ?? "text"
            if (inputType === "checkbox" || inputType === "radio") {
                inputElement.addEventListener("change", () => {
                    const newVal = inputElement.checked
                    scope[value] = newVal
                })

                effect(() => {
                    inputElement.setAttribute("checked", scope[value])
                })
            } else {
                inputElement.addEventListener("input", () => {
                    const newVal = inputElement.value
                    scope[value] = newVal
                })

                effect(() => {
                    inputElement.setAttribute("value", scope[value])
                })
            }
            break;
        case ("textarea"):
            const textAreaElement = element as HTMLTextAreaElement
            textAreaElement.addEventListener("input", () => {
                const newVal = textAreaElement.value
                scope[value] = newVal
            })

            effect(() => {
                textAreaElement.setAttribute("value", scope[value])
            })
            break;
        case ("select"):
            const selectElement = element as HTMLSelectElement
            selectElement.addEventListener("change", () => {
                const newVal = selectElement.value
                scope[value] = newVal
            })

            effect(() => {
                selectElement.setAttribute("value", scope[value])
            })
            break;
        default:
            console.error(`The x-model directive can only be used on <input>, <textarea>, or <select> elements. You tried to use it on a <${tagName}> element`)
    }
    return scope
}

const xIf: Directive = (element, value, scope, _directiveArgument, _directiveModifiers) => {
    const globals = makeGlobalsProxy(scope, makeBaseGlobals(element))
    const ifCondition = makeFuncFromString<boolean>(value)
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
    const tagName = element.tagName.toLowerCase()
    const isTemplate = tagName === "template"
    if (!isTemplate) {
        console.error(`x-template can only be use on <template> elements. You tried to use it on an <${tagName}> element`)
        return scope
    }
    const templateElement = element as HTMLTemplateElement
    const firstChild = templateElement.content.firstElementChild!
    // console.log({firstChild})
    scope[value] = firstChild
    return scope
}

type SlotsObject = {
    [slotName: string]: Element
}

const xComponent: Directive = (element, value, scope, directiveArgument, _directiveModifiers) => {
    const globals = makeGlobalsProxy(scope, makeBaseGlobals(element))
    const scopeVals = {}
    const namedSlots: SlotsObject = {}
    const slots = Array.from(element.children).filter((node) => node.tagName === "SLOT").map((element) => {
        const slot = element as HTMLSlotElement
        const slotChildren = slot.firstElementChild!
        console.log({slot})
        if (slot.name) {
            namedSlots[slot.name] = slotChildren
        }
        slot.remove()
        return slotChildren
    })
    console.log({slots})
    console.log({directiveArgument, scope})
    const newChild = scope[directiveArgument].cloneNode(true)
    element.appendChild(newChild)
    const newScope = makeScopeProxy({...scopeVals, $slots: slots, $namedSlots: namedSlots}, scope)
    effect(() => {
        Object.entries(makeFuncFromString<any>(value)(globals) ?? {}).forEach(([key, val]) => {
            console.log({key, val})
            newScope[key] = val
        })
    })
    handleChild(newChild, newScope)
    return scope
}

const xTeleport: Directive = (element, value, scope, _directiveArgument, _directiveModifiers) => {
    const host = document.querySelector(value)
    host?.appendChild(element)
    return scope
}

const xBind: Directive = (element, value, scope, directiveArgument, _directiveModifiers) => {
    const globals = makeGlobalsProxy(scope, makeBaseGlobals(element))
    const boundValueGetter = makeFuncFromString<any>(value)
    effect(() => {
        element.setAttribute(directiveArgument, boundValueGetter(globals))
    })
    return scope
}

const xFor: Directive = (element, value, scope, _directiveArgument, _directiveModifiers) => {
    const globals = makeGlobalsProxy(scope, makeBaseGlobals(element))
    const baseChild = element.children[0]
    // console.log({baseChild})
    element.replaceChildren()
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
                        ((Symbol.iterator in Object(res)) ? res : Object.entries(res)))

        console.log({iterable})
        for (let index = 0; index < iterable.length; ++index) {
            const item = iterable[index]
            if (currChild) {
                const nextChild = currChild.nextSibling
                // const scopeVals = indexName ? {[itemName]: item, [indexName]: index} : {[itemName]: item}
                // const newChild = baseChild.cloneNode(true)
                // currChild.replaceWith(newChild)
                // handleChild(newChild, makeScopeProxy(scopeVals, scope))
                currChild = nextChild
            } else {
                const scopeVals = indexName ? {[itemName]: item, [indexName]: index} : {[itemName]: item}
                const newChild = baseChild.cloneNode(true)
                element.appendChild(newChild)
                handleChild(newChild, makeScopeProxy(scopeVals, scope))
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

const xLet = (element, value, scope, argument, modifiers) => {
    console.log("let")
    const globals = makeGlobalsProxy(scope, {$el: element})
    const methodBody = value !== "" ? value : element.innerHTML.trim()
    console.log({methodBody})
    const letCallback = makeFuncFromString<any>(methodBody);
    console.log({argument})
    const val = letCallback(globals)
    scope.$$add(argument, val)
    element.remove()
    console.log({scope})
  
    return scope
}

directives.set("x-let", xLet)
directives.set("x-on", xOn)
directives.set("x-scope", xScope)
directives.set("x-text", xText)
directives.set("x-html", xHTML)
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