
import { compile, CompilerOptions } from "../compiler";
import { scopeStyles } from "../transpiler/ScopedStyles";
import { parseComponent } from "./parseComponent";

export type ComponentCompiler = (rawHtml: string, compilerOptions: CompilerOptions, nextHydrationId: number, componentName?: string) => Promise<string>

export const compileToTimberComponent: ComponentCompiler = async (rawHtml: string, compilerOptions: CompilerOptions, nextHydrationId: number, componentName?: string) => {

    const {
        componentName: escapedComponentName,
        props,
        styles,
        template,
        modelAttribute,
        modelEvent
    } = parseComponent(rawHtml, componentName)

    const styleScope = `data-x-style-scope='${componentName}'`
    const [scopedStyles, [html, hydration, newNextHydrationId]] = await Promise.all([
        scopeStyles(styles, `[${styleScope}]`),
        compile(template, compilerOptions, nextHydrationId, {
            staticScope: '$$scope',
            styleScope: componentName
        })
    ])
    nextHydrationId = newNextHydrationId

    const propNames = Object.keys(props)
    const propDefaults = Object.fromEntries(Object.entries(props).map(([propName, {default: defaultVal}]) => [propName, defaultVal]))
    const propTypes = Object.fromEntries(Object.entries(props).map(([propName, {type}]) => [propName, type]))
    return `
        const __component__${escapedComponentName} = Timber.defineComponent({
            $$hydrate: ($$el, $$scope, handleDirective) => {
                let selectorTarget = $$el
                ${hydration}
            },
            $$styles: \`${scopedStyles}\`,
            $$template: \`${html}\`,
            $$propNames: [${propNames.map(name => `'${name}'`).join(', ')}],
            $$defaults: {${Object.entries(propDefaults).map((propAndDefault) => `${propAndDefault[0]}:'${propAndDefault[1]}'`).join(', ')}},
            $$types: {${Object.entries(propTypes).map((propAndType) => `${propAndType[0]}:'${propAndType[1]}'`).join(', ')}},
            $$model: {
                event: '${modelEvent}',
                attr: '${modelAttribute}'
            }
        })\n`
}