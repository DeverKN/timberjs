import { parse } from 'node-html-parser';
import { CompilableDirective, compilerDirectives } from '../directives/compilerDirectives';
import { serialize } from './serialize';
import { readFileSync } from 'fs'
import { xText } from '../directives/compilable/xText';
import { xHTML } from '../directives/compilable/xHTML';

const voidElements = ['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'];

const TEXT_NODE = 3

let nextHydrationId = 0

const handleTextNode = (textNode: Text, scopeId: string, staticScope?: string): [string, string] => {
    const mustacheRegex = /{{([^}]*)}}/g
    const textTemplate = textNode["text"]
    // console.log({textTemplate, staticScope})
    const segments = textTemplate?.split(mustacheRegex)

    let htmlString = ""
    let hydrationString = ""

    if (segments) {
        let isStatic = true
        for (const segment of segments) {
            if (isStatic) {
                htmlString += segment
                isStatic = false
            } else {
                const isHTML = segment.startsWith("*") && segment.endsWith("*")
                let interpolation = isHTML ? segment.slice(1, -1) : segment
                const hydrationId = ++nextHydrationId
                htmlString += `<span data-hydration-id="${hydrationId}"></span>`
                const directiveData = (isHTML ? xHTML.middleware(interpolation, "element", []) : xText.middleware(interpolation, "", []))

                const templateHydration = `
                handleDirective("${(isHTML ? "x-html" : "x-text")}",
                selectorTarget.querySelector("[data-hydration-id='${hydrationId}']"),
                ${serialize(directiveData)}, 
                ${staticScope ? staticScope : `'${scopeId}'`});
                `

                hydrationString += templateHydration
                // console.log({staticScope, scopeId, templateHydration})
                isStatic = true
            }
        }
        // console.log(replacements)
        // textNode.replaceWith(...replacements)
    }
    return [htmlString, hydrationString]
}

type CompilerOptions = {
    componentResolution: "none" | "component-folder",
    definedWebComponents: Set<string>,
    loadedComponents: Set<string>
}

const compile = (element: Element, compilerOptions: CompilerOptions, shouldIgnore = false, scopeId = null, staticScope?: string): [string, string] => {
    // console.log({scopeId, staticScope})
    if (element.nodeType === TEXT_NODE) {
        // console.log({scopeId, staticScope})
        return handleTextNode(element as unknown as Text, scopeId!, staticScope)
    }
    // console.log(element["structure"])
    let htmlString = ''
    let hydrationString = ''
    // console.log({tag: element.tagName})
    const tagName = element.tagName.toLowerCase()
    const {definedWebComponents, loadedComponents} = compilerOptions
    if (tagName.includes("-") && !(definedWebComponents.has(tagName) || loadedComponents.has(tagName))) {
        //Load custom component
        // if (compilerOptions.)
        // const componentHTML = 
        const componentDeclaration = compileComponent(tagName, compilerOptions, false)
        hydrationString += componentDeclaration
        loadedComponents.add(tagName)
    }
    const isVoid = voidElements.includes(tagName)
    shouldIgnore = shouldIgnore || element.hasAttribute("x-ignore")
    if (element.hasAttribute("x-root")) shouldIgnore = false
    const hydrationId = ++nextHydrationId
    htmlString += `<${tagName} data-hydration-id="${hydrationId}"`
    // console.log(element.attributes)

    // const children = element.childNodes as unknown as HTMLElement[]
    let cloneFirstChild = "() => {}"
    const firstChild = element.firstChild
    // console.log({firstChild})
    if (firstChild && firstChild.nodeType !== TEXT_NODE) {
        // compile(component.firstChild as Element, false, null, '$scope')
        // console.log("with $scope")
        const [childHTML, childHydration] = compile(firstChild as Element, compilerOptions, shouldIgnore, scopeId, '$scope')
        cloneFirstChild = `($scope) => {
            const template = document.createElement('template');
            template.innerHTML = \`${childHTML}\`;
            const clone = template.content
            let selectorTarget = clone
            ${childHydration}
            const el = clone.firstChild
            console.log({template, clone, el})
            return el
        }`
    }

    let shouldParseChildren = true;

    for (const [name, value] of Object.entries(element.attributes)) {
        if (!shouldIgnore) {
            if ((name.includes("-") && !name.startsWith("data")) || name.startsWith("@") || name.startsWith(":")) {
                let directiveName: string;
                let directive: CompilableDirective<any> | undefined;
                let directiveBody = ""
                let directiveArgument = ""
                let directiveModifiers: string[] = []
                // console.log({name})
                if (name.startsWith(":")) {
                    directiveName = "x-bind";
                    const directiveString = name.substring(1);
                    [directiveArgument, ...directiveModifiers] = directiveString.split(".");
                } else if (name.startsWith("@")) {
                    directiveName = "x-on";
                    const directiveString = name.substring(1);
                    [directiveArgument, ...directiveModifiers] = directiveString.split(".");
                } else if (name.includes(":")) {
                    [directiveName, directiveBody] = name.split(":");
                    [directiveArgument, ...directiveModifiers] = directiveBody.split(".");
                } else {
                    directiveName = name
                }

                directive = compilerDirectives.get(directiveName)

                if (directive) {
                    const directiveData = directive.middleware(value as unknown as string, directiveArgument, directiveModifiers)

                    hydrationString += `
                    handleDirective("${directiveName}",
                    selectorTarget.querySelector("[data-hydration-id='${hydrationId}']"),
                    ${serialize(directiveData)},
                    ${staticScope ? staticScope : `'${scopeId}'`}
                    ${directive.usesChildren ? `, ${cloneFirstChild}` : ''});
                    `

                    if (name === "x-cloak") {
                        htmlString += ` x-cloak`
                    }

                    if (directiveName === "x-scope") {
                        scopeId = directiveData.scopeId
                        // console.log({scopeId, staticScope})
                        staticScope = undefined
                        // console.log({scopeId})
                    }

                    if (directive.usesChildren) shouldParseChildren = false
                } else {
                    console.error(`Unknown directive ${directiveName} (full directive ${name})`)
                    htmlString += ` ${name}="${value}"`
                }
            } else {
                htmlString += ` ${name}="${value}"`
            }
        } else {
            htmlString += ` ${name}="${value}"`
        }
    }
    htmlString += `>`

    console.log({tagName, attrs: Object.entries(element.attributes), htmlString})

    if (!isVoid) {
        if (shouldParseChildren) {
            const children = element.childNodes as unknown as HTMLElement[]
            for (const child of children) {
                const [childHTML, childHydration] = compile(child, compilerOptions, shouldIgnore, scopeId, staticScope)
                htmlString += childHTML
                hydrationString += childHydration
            }
        }

        htmlString += `</${tagName}>`
    }

    return [htmlString, hydrationString]
}

export const parseTimber = (rawHtml: string, compilerOptions: CompilerOptions) => {
    nextHydrationId = 0
    const root: HTMLElement = parse(rawHtml.trim()) as unknown as HTMLElement;
    // console.log(root.nodeType);
    // console.log(root["structure"])
    const [html, hydration] = compile(root.firstChild as Element, compilerOptions)
    // console.log(`
    // <body>
    // ${html}
    // </body>
    // <script src="/timberjs/runtime/module.ts" type="module"></script>
    // <script>
    // window.addEventListener('timber-init', () => {
    //     const {handleDirective} = Timber
    //     ${hydration}
    // })
    // </script>
    // `)
    // console.log(html)
    return `
    <head>
        <link rel="icon" href="data:,">
    </head>
    <body>
    ${html}
    </body>
    <script src="../timberjs/runtime/module.ts" type="module"></script>
    <script>
    window.addEventListener('timber-init', () => {
        const {handleDirective} = Timber
        let selectorTarget = document;
        ${hydration}
    })
    </script>`
}

// parseTimber(`<div id="app"><div x-root x-scope=""><template x-template="timer"><div x-scope="{ time: initialTime }" x-interval:1000="time++" x-on:click="time--">{{ time }} s</div></template><template x-template="counter"><div x-scope="{ count: initialCount }">Name = <span x-html="$slots[0]"></span><button @click="count--">-</button>Count is {{count}} 2x count is {{ count * 2 }}<button @click="count++">+</button><span x-effect="(() => {if (count > 20) {$emit('high'); console.log('high');}})()"></span></div></template><template x-template="router"><div x-scope="{ route: location.pathname.split('/')[1] }"><span><span @client-navigate.window="console.log('test')"></span><span @client-navigate.window="route = location.pathname.split('/')[1]"></span><span x-effect="console.log({route})"></span><span x-for="namedSlot in $namedSlots"><span><!-- Route:{{route}} slotRoute:{{namedSlot[0]}} --><span x-if="route === namedSlot[0]" x-effect="console.log({route, slotRoute: namedSlot[0]})"><span x-html="namedSlot[1]"></span></span></span></span></span></div></template><template x-template="link"><div><span @click="(history.pushState({}, '', to), window.dispatchEvent(new Event('client-navigate', {bubbles: true})))" x-html="$slots[0]" x-bind:href="to"></span><span x-effect="console.log({to})">To = {{ to }}</span></div></template><div x-scope="{ count: 0, countRef: null, name: 'Dever' }"><span id="top"></span><span x-teleport="body">From the bottom ...</span><input x-model="name"><button @click="count--">-</button>{{ count }}<button @click="count++">+</button><!-- <template x-effect="console.log({count})"></template> --><div x-if="!(count < 5)" x-scope="{ count: 5 }"><div><button @click="count--">-</button>{{ count }}<button @click="count++">+</button><ul x-for="(item, i) in count"><li>Num: {{ item + 1 }} Index: {{ i / 2 }}</li></ul></div></div>Hello {{name}}<!-- <div x-component:timer="{ initialTime: 2 }"></div><div x-component:timer="{ initialTime: 5 }"></div> --><div x-component:counter="{ initialCount: 5 }"><slot><span>Btn 1</span></slot></div><div x-component:counter="{ initialCount: 10 }" @high.once="alert('Count is dangerously high!')"><slot><span>Btn 2</span></slot></div><span x-teleport="#top">to the top</span><div x-scope="{ href: '/index' }">Go to <input x-model="href"><span x-component:link="{ to: href }"><slot><span>Go to {{ href }}</span></slot></span></div><div x-component:router><slot name="hello"><span>Hellow</span></slot><slot name="index"><span>index</span></slot></div></div></div></div><script>const testAlert = () => alert("test!")</script><script type="module" src="/src/main.ts"></script>`)
// parseTimber(`<ul x-on:click="alert('1')" id="list"><li>Hello World</li></ul>`)

const compileToWebComponent = (rawHtml: string, compilerOptions: CompilerOptions, componentName?: string) => {
    nextHydrationId = 0
    const root: HTMLElement = parse(rawHtml.trim()) as unknown as HTMLElement;
    // console.log(root.nodeType);
    // console.log(root["structure"])
    const component = root.firstChild! as Element
    if (!componentName) componentName = component.getAttribute("x-component") ?? undefined
    if (!componentName) {
        throw Error("Timber component templates must specify a component name using x-component='component-name'")
    }
    const propsObject = Object.fromEntries(Object.entries(component.attributes).filter(([key, _]) => key !== 'x-component'))
    const props = Object.keys(propsObject).map(key => {
        const segments = key.split(':')
        if (segments.length === 2) {
            return segments[1]
        } else {
            return segments[0]
        }
    })
    // const propDefaults = Object.values(component.attributes)
    const propsWithDefalts = Object.entries(propsObject).map(([attr, val]) => {
        let type = "string"
        let prop;
        const segments = attr.split(':')
        if (segments.length === 2) {
            [type, prop] = segments
        } else {
            prop = segments[0]
        }
        return { type, prop, default: val}
    }) as unknown as any[]
    // console.log([component.firstChild])
    const styles = component.querySelector("style")?.["text"] ?? ""
    console.log({styles})
    const [html, hydration] = compile(component.firstChild as Element, compilerOptions, false, null, '$scope')

    const escapedComponentName = componentName.replaceAll("-", "_")

        //

    return `
        (() => {
            const hydrate_${escapedComponentName} = (element, $scope) => {
                const { handleDirective } = Timber
                let selectorTarget = element
                ${hydration}
            }
    
            class ${escapedComponentName} extends HTMLElement {

                static get observedAttributes() { return [${props.map(prop => `'${prop}'`).join(',')}]; }
                static get attributeTypes() { return {${propsWithDefalts.map(propDefault => `${propDefault.prop}:'${propDefault.type}'`).join(',')}}; }

                constructor() {
                    // Always call super first in constructor
                    super();
                    const { makeScopeProxy } = Timber
                    this.$scope = makeScopeProxy({${propsWithDefalts.map(propDefault => {
                        // const {type, prop, default } = propDefault
                        if (propDefault.type === 'num' || propDefault.type === 'bool') {
                            return `${propDefault.prop}:${propDefault.default}`
                        } else {
                            return `${propDefault.prop}:'${propDefault.default}'`;
                        }
                    }).join(',')}})
                }

                connectedCallback() {
                    this.attachShadow({mode: 'open'});
                    const wrapper = document.createElement('template');
                    wrapper.innerHTML = \`${html}\`
                    const element = wrapper.content.firstElementChild
                    // Element functionality written in here
                    hydrate_${escapedComponentName}(wrapper.content, this.$scope)
                    for (const {name, value} of this.attributes) {
                        if (${escapedComponentName}.observedAttributes.includes(name)) {
                            this.$scope[name] = this.parseAttr(name, value)
                        }
                    }
                    const style = document.createElement('style');
                    style.textContent = \`${styles}\`
                    this.shadowRoot.append(style, element)
                }

                attributeChangedCallback(name, oldValue, newValue) {
                    this.$scope[name] = this.parseAttr(name, newValue)
                }

                parseAttr(name, val) {
                    const type = ${escapedComponentName}.attributeTypes[name]
                    switch (type) {
                        case("bool"):
                            return (val === 'true')
                        case("num"):
                            return parseFloat(val)
                        default:
                            return val
                    }
                }
                  
            }
    
          customElements.define('${componentName}', ${escapedComponentName});
        })()`
}

export const compileComponent = (componentName: string, compilerOptions: CompilerOptions, standAlone = true) => {
    const spaceRegex = /(\n +)/g
    const componentString = readFileSync(`./components/${componentName}.html`).toString('utf-8').replaceAll(spaceRegex, "")
    const elementDeclaration = compileToWebComponent(componentString, compilerOptions, componentName)
    if (standAlone) {
        return `
        window.addEventListener(("timber-init") => {
            ${elementDeclaration}
        })`
    } else {
        return elementDeclaration
    }
}

// const counterHTML = `<template x-component='timber-counter' num:count='5' str:name='Jeff Bezos'><div x-root x-scope="{}"><button @click="count--">-</button><input x-model="name">Hello {{ name }}! Count is {{ count }}<button @click="count++">+</button><div x-for="(item, i) in count"><div>{{item}}<div/></div></div>    <style>
// button {
//     color: red;
// }
// </style></template>`
// const body = parseTimber(counterHTML)

// writeFileSync("test.html", body)
// writeFileSync("counter.cjs", compileToWebComponent(counterHTML))

// writeFileSync("timber-counter.cjs", compileComponent("timber-clicker"))
// writeFileSync("index.compiled.html", parseTimber(readFileSync("./components/index.html").toString(), {
//     componentResolution: "component-folder",
//     definedWebComponents: new Set(),
//     loadedComponents: new Set()
// }))
// console.log(body)