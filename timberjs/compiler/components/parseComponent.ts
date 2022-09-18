import { NodeTag } from "posthtml-parser"
import { parse } from "../compiler"

export type PropType = 'str' | 'num' | 'any'
type ComponentInfo = {
    componentName: string,
    props: {
        [name: string]: {
            type: PropType,
            default: any
        }
    },
    styles: string,
    template: NodeTag,
    modelAttribute: string,
    modelEvent: string
}

export const escapeComponentName = (componentName: string): string => {
    return componentName.replaceAll("-", "_")
}

export const parseComponent = (rawHtml: string, componentName: string): ComponentInfo => {
    const root = parse(rawHtml.trim());

    const component = root[0]
    if (typeof component === "string" || typeof component === "number") throw Error("cannot compile string")
    const modelDirectiveRegex = /([A-z0-9\-]+) with ([A-z0-9\-]+)/
    const modelMatch = component.attrs?.["model"]?.toString()?.match(modelDirectiveRegex)?.slice(1)

    const [modelAttr, modelEvent] = (modelMatch ?? ["value", "input"])
    if (!componentName) componentName = component.attrs!["x-template"].toString() ?? undefined
    if (!componentName) {
        throw Error("Timber component templates must specify a component name using x-template='component-name'")
    }
    const compilerDirectiveNames = ["x-template", "model"]
    const attrs = component.attrs
    const propsObject = attrs ? Object.fromEntries(Object.entries(attrs).filter(([key, _]) => !compilerDirectiveNames.includes(key))) : {}
    // const props = Object.keys(propsObject).map(key => {
    //     const segments = key.split(':')
    //     if (segments.length === 2) {
    //         return segments[1]
    //     } else {
    //         return segments[0]
    //     }
    // })

    const props = Object.fromEntries(Object.entries(propsObject).map(([attr, val]) => {
        const parseType = (type: string): PropType => {
            const validTypes = ['str', 'num', 'any']
            const parsedType = (validTypes.includes(type) ? type : 'any') as PropType
            return parsedType
        }
        const segments = attr.split(':')
        if (segments.length === 2) {
            const [type, prop] = segments
            return [prop, { type: parseType(type), default: val }]
        } else {
            const prop = segments[0]
            const type: PropType = "str"
            return [prop, { type, default: val }]
        }
    }))

    if (!Array.isArray(component.content)) throw Error("e")
    const styleTag = component.content.filter((el) => {
        if (Array.isArray(el) || typeof el !== "object") return false 
        return el.tag === "style"
    })[0] as NodeTag

    const styles = styleTag?.content?.[0] ?? ""

    const componentInner = component?.content[0]
    // console.log({componentInner})
    if (typeof componentInner !== "object") throw Error()
    if (Array.isArray(componentInner)) throw Error()

    const escapedComponentName = escapeComponentName(componentName)

    return {
        componentName: escapedComponentName,
        props,
        styles,
        template: componentInner,
        modelAttribute: modelAttr,
        modelEvent: modelEvent
    }
}