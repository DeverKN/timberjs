import { effect } from "../../state"
import { CompilableDirective } from "../compilerDirectives"

type xSlotData = {
    slotName: string
}

export const xSlot: CompilableDirective<xSlotData> = {
    middleware: (value, _directiveArgument, _directiveModifiers) => {
        return {
            slotName: value
        }
    },
    instance: (element, scope, {slotName}, cloneFirstChild) => {
        effect(() => {
            const slotItem = scope.$$namedSlots[slotName]
            if (slotItem) {
                element.replaceChildren(slotItem())
            } else {
                element.replaceChildren(cloneFirstChild(scope))
            }
        })
    
        return scope
    },
    usesChildren: true
}