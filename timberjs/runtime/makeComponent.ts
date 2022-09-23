import { PropType } from "../compiler/components/parseComponent"
import { effect, Scope } from "../state"
import { handleDirective } from "./handleDirective"

type HydrationFunction = (element: Element, scope: Scope, handleDirective: Function) => void
type ComponentOptions = {
    $$hydrate: HydrationFunction,
    $$template: string
    $$propNames: string[],
    $$styles: string,
    $$types: TypesObj,
    $$defaults: DefaultsObj,
    $$model: {
        event: string,
        attr: string
    }
}

type TypesObj = {
    [propName: string]: PropType
}

type DefaultsObj = {
    [propName: string]: string
}

type PropsObj = {
    [propName: string]: any
}

type BindingsObj = {
    [propName: string]: () => any
}

type ModelObj = {
    get: () => any,
    set: (newVal: any) => any
}

type EventsObj = {
    [eventName: string]: (...args: any) => void
}

type ComponentConstructor = (scope: Scope, props: PropsObj, bindings: BindingsObj, events: EventsObj, slots: any[], model?: ModelObj) => Element

const handleType = (type: string, val: string) => {
    switch(type) {
        case 'str':
            return val
        case 'num':
            return parseInt(val)
        default:
            return val
    }
}

const computeProps = (types: TypesObj, defaults: DefaultsObj, props: PropsObj): PropsObj => {
    const computedProps = {}

    for (const [prop, defaultVal] of Object.entries(defaults)) {
        const type = types[prop] ?? 'any'
        computedProps[prop] = handleType(type, defaultVal)
    }

    for (const [prop, val] of Object.entries(props)) {
        const type = types[prop] ?? 'any'
        computedProps[prop] = handleType(type, val)
    }

    return computedProps
}

export const defineComponent = (options: ComponentOptions) => {
    const {
        $$hydrate,
        $$template,
        $$propNames,
        $$styles,
        $$types,
        $$defaults,
        $$model
    } = options

    const styleSheet = new CSSStyleSheet()
    styleSheet.replace($$styles)
    document.adoptedStyleSheets.push(styleSheet)

    const templateElement = document.createElement('template')
    templateElement.innerHTML = $$template
    const template = templateElement.content.firstElementChild

    const instance: ComponentConstructor = (scope: Scope, props: PropsObj, bindings: BindingsObj, events: EventsObj, slots: any[], model?: ModelObj) => {
        
        const instanceEl = template.cloneNode() as Element
        if (model) {
            const { get, set } = model
            instanceEl.addEventListener($$model.event, () => {
                set(scope[$$model.attr])
            })
            effect(() => {
                scope[$$model.attr] = get()
            })
        }

        const computedProps = computeProps($$types, $$defaults, props)
        Object.entries(computedProps).forEach(([prop, val]) => {
            scope[prop] = val
        })

        Object.entries(bindings).forEach(([prop, getter]) => {
            effect(() => {
                scope[prop] = getter()
            })
        })

        Object.entries(events).forEach(([event, callback]) => {
            instanceEl.addEventListener(event, callback)
        })

        scope.$slots = slots
        $$hydrate(instanceEl, scope, handleDirective)

        return instanceEl
    }

    return instance
}

export const handleComponent = (componentFunc: ComponentConstructor, host: HTMLElement, scope: Scope, props: PropsObj, bindings: BindingsObj, events: EventsObj, slots: any[], model?: ModelObj) => {
    host.replaceWith(componentFunc(scope, props, bindings, events, slots, model))
}