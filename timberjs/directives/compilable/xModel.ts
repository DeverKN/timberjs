import { effect } from "../../state"
import { CompilableDirective } from "../compilerDirectives"

type xModelData = {
    boundVal: string,
    customVal?: string
}

type CustomModelOptions = {
    attributeName: string,
    eventName: string 
}

export const customModels = new Map<string, CustomModelOptions>()
export const defineCustomModel = (componentTag: string, modelAttr: string, modelEvent: string) => {
    customModels.set(componentTag, {
        attributeName: modelAttr,
        eventName: modelEvent 
    })
}

export const xModel: CompilableDirective<xModelData> = {
    middleware: (value, directiveArgument, _directiveModifiers) => {
        return {
            boundVal: value,
            customVal: directiveArgument !== "" ? directiveArgument : undefined
        }
    },
    instance: (element, scope, {boundVal, customVal}) => {
        const tagName = element.tagName.toLowerCase()
        if (customVal) {
            element.addEventListener(`${customVal}changed`, (event) => {
                const newVal = event['detail']
                scope[boundVal] = newVal
            })

            effect(() => {
                element.setAttribute(customVal, scope[boundVal])
            })
        } else {
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
                            inputElement.value = scope[boundVal]
                            // inputElement.setAttribute("value", scope[boundVal])
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
                    // const selectElement = element as HTMLSelectElement
                    console.log(element['getModelOptions'])
                    const { attributeName, eventName } = element['getModelOptions']() ?? {attributeName: 'value', eventName: 'input'}
                    // if (customModels)

                    console.log({element, attributeName, eventName})
                    element.addEventListener(eventName, () => {
                        const newVal = element.getAttribute(attributeName)
                        scope[boundVal] = newVal
                    })
        
                    effect(() => {
                        element.setAttribute(attributeName, scope[boundVal])
                    })
                    break;
                    //console.error(`The x-model directive can only be used on <input>, <textarea>, or <select> elements. You tried to use it on a <${tagName}> element`)
            }
        }
        return scope
    }
}