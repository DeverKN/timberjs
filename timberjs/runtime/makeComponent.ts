import { PropType } from "../compiler/components/parseComponent"
import { Scope } from "../state"
import { handleDirective } from "./handleDirective"

type HydrationFunction = (element: Element, scope: Scope, handleDirective: Function) => void
type ComponentOptions = {
    $$hydrate: HydrationFunction,
    $$template: string
    $$propNames: string[],
    $$styles: string,
    $$types: {
        [propName: string]: PropType
    },
    $$defaults: {
        [propName: string]: string
    },
}

type PropsObj = {
    [propName: string]: any
}

export const defineComponent = (name: string, options: ComponentOptions) => {
    const {
        $$hydrate,
        $$template,
        $$propNames,
        $$styles,
        $$types,
        $$defaults
    } = options

    const styleSheet = new CSSStyleSheet()
    styleSheet.replace($$styles)
    document.adoptedStyleSheets.push(styleSheet)

    const templateElement = document.createElement('template')
    templateElement.innerHTML = $$template
    const template = templateElement.content.firstElementChild
    const instance = (scope: Scope, props: PropsObj, slots: any[]) => {
        const instanceEl = template.cloneNode() as Element
        scope.$slots = slots
        $$hydrate(instanceEl, scope, handleDirective)
    }

    return instance
}