
import { compile, CompilerOptions } from "../compiler";
import { parseComponent } from "./parseComponent";
import postcss from "postcss";
import namespace from "postcss-plugin-namespace"

const scopeStyles = async (unscopedStyles: string, scopeSelector: string): Promise<string> => {
    const scopedStyles = (await postcss(namespace(scopeSelector)).process(unscopedStyles, { from: 'src/app.css', to: 'dest/app.css' })).css
    return scopedStyles
}

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
            additionalAttrs: [styleScope]
        })
    ])
    nextHydrationId = newNextHydrationId

    const propNames = Object.keys(props)
    const propDefaults = Object.fromEntries(Object.entries(props).map(([propName, {default: defaultVal}]) => [propName, defaultVal]))
    const propTypes = Object.fromEntries(Object.entries(props).map(([propName, {type}]) => [propName, type]))
    return `
        const __component__${escapedComponentName} = defineComponent('${componentName}', {
            $$hydrate: ($$el, $$scope, handleDirective) => {
                let selectorTarget = $$el
                ${hydration}
            },
            $$styles: \`${scopedStyles}\`,
            $$template: \`${html}\`,
            $$propNames: [${propNames.map(name => `'${name}'`).join(', ')}],
            $$defaults: {${Object.entries(propDefaults).map((propAndDefault) => `${propAndDefault[0]}:'${propAndDefault[1]}'`).join(', ')}},
            $$types: {${Object.entries(propTypes).map((propAndType) => `${propAndType[0]}:'${propAndType[1]}'`).join(', ')}},
        })\n`
}