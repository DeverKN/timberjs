import { DirectiveHandler, makeBaseGlobals, makeFuncFromString, makeGlobalsProxy } from "../../directives"
import { effect, makeScopeProxy } from "../../state"
import { CompilableDirective } from "../compilerDirectives"

type xOutletData = {
    slotName: string,
    getSlotData: DirectiveHandler<object> | null
}

export const xOutlet: CompilableDirective<xOutletData> = {
    middleware: (value, directiveArgument, _directiveModifiers) => {
        const getSlotData = directiveArgument !== "" ? makeFuncFromString<object>(directiveArgument) : null
        return {
            slotName: value,
            getSlotData
        }
    },
    instance: (element, scope, { slotName, getSlotData }, cloneFirstChild) => {
        const globals = makeGlobalsProxy(scope, makeBaseGlobals(element))
        const innerScope = makeScopeProxy({}, scope)
        effect(() => {
            if (getSlotData) {
                const slotInstance = getSlotData(globals)
                for (const [prop, val] of Object.entries(slotInstance)) {
                    innerScope[prop] = val
                }
            }
        })
        
        const slotItem = scope.$slots[slotName].clone
        if (slotItem) {
            element.replaceChildren(slotItem())
        } else {
            element.replaceChildren(cloneFirstChild(innerScope))
        }
    
        return scope
    },
    usesChildren: true
}