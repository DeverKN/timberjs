import { CompilableDirective, DirectiveHandler, makeFuncFromString, makeGlobalsProxy } from "../../directives"
import { effect } from "../../state"

type xModelData = {
    boundVal: string
}

export const xModel: CompilableDirective<xModelData> = {
    middleware: (_value, directiveArgument, _directiveModifiers) => {
        return {
            boundVal: directiveArgument
        }
    },
    instance: (element, scope, {boundVal}) => {
        const tagName = element.tagName.toLowerCase()
        switch (tagName) {
            case ("input"):
                const inputElement = element as HTMLInputElement
                const inputType = inputElement.getAttribute("type") ?? "text"
                if (inputType === "checkbox" || inputType === "radio") {
                    inputElement.addEventListener("change", () => {
                        const newVal = inputElement.checked
                        scope[boundVal] = newVal
                    })
    
                    effect(() => {
                        inputElement.setAttribute("checked", scope[boundVal])
                    })
                } else {
                    inputElement.addEventListener("input", () => {
                        const newVal = inputElement.value
                        scope[boundVal] = newVal
                    })
    
                    effect(() => {
                        inputElement.setAttribute("value", scope[boundVal])
                    })
                }
                break;
            case ("textarea"):
                const textAreaElement = element as HTMLTextAreaElement
                textAreaElement.addEventListener("input", () => {
                    const newVal = textAreaElement.value
                    scope[boundVal] = newVal
                })
    
                effect(() => {
                    textAreaElement.setAttribute("value", scope[boundVal])
                })
                break;
            case ("select"):
                const selectElement = element as HTMLSelectElement
                selectElement.addEventListener("change", () => {
                    const newVal = selectElement.value
                    scope[boundVal] = newVal
                })
    
                effect(() => {
                    selectElement.setAttribute("value", scope[boundVal])
                })
                break;
            default:
                console.error(`The x-model directive can only be used on <input>, <textarea>, or <select> elements. You tried to use it on a <${tagName}> element`)
        }
        return scope
    }
}