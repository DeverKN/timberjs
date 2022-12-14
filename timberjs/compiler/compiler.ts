// import { parse } from 'node-html-parser';
import { CompilableDirective, compilerDirectives } from '../directives/compilerDirectives';
import { serialize } from './serialize';
import { writeFileSync, readFileSync } from 'fs'
import { readFile } from 'fs/promises'
import { xText } from '../directives/compilable/xText';
import { xHTML } from '../directives/compilable/xHTML';
import { Node, NodeTag, parser } from 'posthtml-parser'
import { compileToTimberComponent, ComponentCompiler } from './components/compileToTimberComponent';
import { folderComponentResolver } from '../../woodsman/resolver';
import { escapeComponentName } from './components/parseComponent';
import { transpileSetupScript } from './transpiler/SetupScript';
import { scopeStyles } from './transpiler/ScopedStyles';
import { resolve } from 'path'

const voidElements = ['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'];

const TEXT_NODE = 3

export const parse = (htmlString: string) => {
    return parser(htmlString, {
        xmlMode: true
    })
}

type CompilerReturn = [string, string, number]

const handleTextNode = (text: string, nextHydrationId: number, scopeId: string, staticScope?: string): CompilerReturn => {
    // console.log({nextHydrationId})
    const mustacheRegex = /{{([^}]*)}}/g
    const textTemplate = text
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
    // console.log({text: nextHydrationId})
    return [htmlString, hydrationString, nextHydrationId]
}

export type ComponentResolver = (tagName: string, element: NodeTag, compilerOptions: CompilerOptions, componentCompiler: ComponentCompiler) => Promise<string> | string

export type CompilerOptions = {
    componentCompiler: ComponentCompiler
    componentResolver: ComponentResolver,
    definedWebComponents: Set<string>,
    loadedComponents: Set<string>,
    componentType: 'WebComponent' | 'Timber' ,
    initialHydrationId?: number,
    path?: string
}

export type AdditionalCompileOptions = {
    shouldIgnore?: boolean, 
    scopeId?: any, 
    staticScope?: string,
    additionalAttrs?: string[],
    styleScope?: string,
}

type SlotObj = {
    [slotName: string]: SlotDetails
}

type SlotDetails = {
    cloneBody: string,
    slotBinding: string
}

const makeCloneFunc = async (el: Node, compilerOptions: CompilerOptions, nextHydrationId: number, additionalOptions: AdditionalCompileOptions): Promise<[string, number]> => {
    const { shouldIgnore, scopeId } = additionalOptions
    // console.log("make clone")

    const [childHTML, childHydration, newNextHydrationId] = await compile(el, compilerOptions, nextHydrationId, {
        shouldIgnore, 
        scopeId, 
        staticScope: '$scope'
    })
    // console.log("made")
    nextHydrationId = newNextHydrationId
    // console.log({clone: el, childHTML})
    const cloneFirstChild = `($scope) => {
        const template = document.createElement('template');
        template.innerHTML = \`${childHTML}\`;
        const clone = template.content
        let selectorTarget = clone
        ${childHydration}
        const el = clone.firstChild
        console.log({template, clone, el})
        return el
    }`
    return [cloneFirstChild, nextHydrationId]
}

export const compile = async (element: Node, compilerOptions: CompilerOptions, nextHydrationId: number, additionalOptions: AdditionalCompileOptions): Promise<CompilerReturn> => {
    // console.log({scopeId, staticScope})
    // if (typeof element === "number") throw Error("Numbers are not allowed")
    // console.log({compile: nextHydrationId})
    let {
        shouldIgnore = false, 
        scopeId = null, 
        staticScope = null, 
        styleScope = "global",
        additionalAttrs = [],
    } = additionalOptions
    if (typeof element === "string" || typeof element === "number") {
        // console.log({scopeId, staticScope})
        return handleTextNode(element.toString(), nextHydrationId, scopeId, staticScope)
    }
    if (typeof element !== "object") throw Error("e")
    // console.log(element["structure"])
    let htmlString = ''
    let hydrationString = ''
    // console.log({tag: element.tagName})
    const tagName = element.tag as string
    const {definedWebComponents, loadedComponents, componentType, componentCompiler} = compilerOptions
    // console.log({preInc: nextHydrationId})
    const hydrationId = ++nextHydrationId
    // console.log({hydrationId, nextHydrationId})

    if (tagName === "script") {
        //Handle Script tag
        // const scriptType =  ?? 'inline'
        let scriptContent;
        const source = element.attrs.src?.toString()
        if (source) {
            scriptContent = await readFile(resolve(compilerOptions.path, "..", source))
        } else {
            scriptContent = element.content.toString()
        }
        const lang = element.attrs?.lang?.toString() ?? 'js'
        switch (element.attrs.context) {
            case ('scoped'):
                `scopedScript(($scoped, $declare) => {
                    ${scriptContent}
                }, ${staticScope ? staticScope : `'${scopeId}'`}, 'scoped')`
                break;
            case ('setup'):
                hydrationString += `scopedScript(($$scoped, $$declare) => {
                    const $$empty = null
                    ${transpileSetupScript(scriptContent, lang)}
                }, ${staticScope ? staticScope : `'${scopeId}'`}, 'setup')`
                break;
            default:
                htmlString += `<script ${Object.entries(element.attrs).map(([attr, val]) => `${attr}='${val}'`).join(' ')}>
                ${scriptContent}
                </script>`
                break;
        }

        return [htmlString, hydrationString, nextHydrationId]
    }

    if (tagName === "style" && element?.attrs?.hasOwnProperty('scoped')) {
        const source = element.attrs.src?.toString()
        let styles;
        if (source) {
            styles = await readFile(resolve(compilerOptions.path, "..", source))
        } else {
            styles = element.content.toString()
        }

        const excludedAttrs = ["src", "scoped"]
        const attrsString = Object.entries(element.attrs).filter((([attr]) => !excludedAttrs.includes(attr))).map(([attr, val]) => {
            // console.log({attr})
            return `${attr}='${val}'`
        }).join(' ')
        const [scopedStyles, styleBindings] = await scopeStyles(styles, styleScope)
        htmlString += `<style ${attrsString}>
            ${scopedStyles}
        </style>`
        return [htmlString, hydrationString, nextHydrationId]
    }

    if (tagName === "include-html") {
        if (!compilerOptions.path) {
            console.error(`Must specify a base path when using <include-html>`)
        }
        const type = element.attrs.type ?? "timber"
        const isRaw = (type === "raw")
        const path = element.attrs.src.toString()
        const resolvedPath = resolve(compilerOptions.path, "..", path)
        // console.log({resolvedPath})
        const rawHtmlString = (await readFile(resolvedPath)).toString()
        if (isRaw) {
            htmlString += rawHtmlString
        } else {
            const [includedHTML, includedScript, newNextHydrationId] = await parseTimberBase(rawHtmlString, {
                ...compilerOptions,
                initialHydrationId: nextHydrationId,
                path: resolvedPath
            })
            nextHydrationId = newNextHydrationId
            htmlString += includedHTML
            hydrationString += includedScript
        }
        // const parsedHtmlString = isRaw ? rawHtmlString : 
        // console.log({parsedHtmlString})
        
        return [htmlString, hydrationString, nextHydrationId]
    }

    if (tagName.includes("-")) {
        //Load custom component
        // if (compilerOptions.)
        // const componentHTML = 
        if (!(definedWebComponents.has(tagName) || loadedComponents.has(tagName))) {
            const componentDeclaration = await compilerOptions.componentResolver(tagName, element, compilerOptions, componentCompiler)
            hydrationString += componentDeclaration
            loadedComponents.add(tagName)
        }

        if (componentType === 'Timber') {
            const content = element.content ?? []
            const children = Array.isArray(content) ? content : [content]
            const defaultSlot = []
            const slotItems: SlotObj = {}
            for (const child of children) {
                const isObject = typeof child === "object"
                const isArray = Array.isArray(child)
                if (isObject && !isArray) {
                    const [slotDirectiveName, slotBinding] = Object.entries(child.attrs).find(([name, val]) => {
                        return name.startsWith("#") || name.startsWith("x-slot")
                    })
                    const [_, slotName] = slotDirectiveName.split(slotDirectiveName.startsWith("#") ? "#" : ":")
                    // console.log({slotDirectiveName, slotName, slotBinding})
                    console.log({pre: nextHydrationId})
                    const [cloneBody, newNextHydrationId] = await makeCloneFunc(child, compilerOptions, nextHydrationId, additionalOptions)
                    nextHydrationId = newNextHydrationId
                    slotItems[slotName] = {
                        cloneBody,
                        slotBinding: slotBinding.toString()
                    }
                }
            }
            const props = element.attrs ?? {}
            hydrationString += `Timber.handleComponent(__component__${escapeComponentName(tagName)}, 
                                selectorTarget.querySelector("[data-hydration-id='${hydrationId}']"),
                                /*scope*/${staticScope ? staticScope : `'${scopeId}'`},
                                /*props*/{
                                    ${Object.entries(props).map(([name, val]) => {
                                        return `${name}: '${val}'`
                                    })}
                                },
                                /*bindings*/{

                                },
                                /*events*/{
                                    
                                },
                                /*slots*/{
                                    ${Object.entries(slotItems).map(([name, {cloneBody, slotBinding}]) => {
                                        return `${name}: {
                                            clone: ${cloneBody},
                                            binding: '${slotBinding}'
                                        }`
                                    }).join(',')}
                                },
                                /*model*/{})\n`
        }
    }
    const isVoid = voidElements.includes(tagName)
    const hasIgnore = (element.attrs && element.attrs.hasOwnProperty("x-ignore")) ?? false
    shouldIgnore = shouldIgnore || hasIgnore
    if (element.attrs && element.attrs.hasOwnProperty("x-root")) shouldIgnore = false
    htmlString += `<${tagName} data-hydration-id="${hydrationId}"`
    // console.log(element.attributes)

    // const children = element.childNodes as unknown as HTMLElement[]
    let cloneFirstChild = "() => {}"
    let firstChildIndex = 0
    let firstChild;
    do {
        firstChild = element.content?.[firstChildIndex++]
    } while (firstChild && typeof firstChild === 'string' && firstChild.trim().length === 0)
    // console.log({firstChild})
    if (firstChild) {        
        // console.log({pre: nextHydrationId})
        const [clone, newNextHydrationId] = await makeCloneFunc(firstChild, compilerOptions, nextHydrationId, additionalOptions)
        console.log({element, firstChild, clone})
        // console.log({post: newNextHydrationId})
        nextHydrationId = newNextHydrationId
        cloneFirstChild = clone
    }

    let shouldParseChildren = true;

    // console.log({attrs: nextHydrationId})
    if (element.attrs) {
        
        for (const [name, value] of Object.entries(element.attrs)) {
            if (!shouldIgnore) {
                // console.log({name})
                // const xBindShorthandRegex = /\[([^.]+)\](?:\.([^.]+))*/
                // const bindMatch = name.match(xBindShorthandRegex)
                const isOn = name.startsWith("@")
                const isBind = name.startsWith(":")
                // console.log({name})
                if ((name.includes("-") && !name.startsWith("data")) || isOn || isBind) {
                    let directiveName: string;
                    let directive: CompilableDirective<any> | undefined;
                    let directiveBody = ""
                    let directiveArgument = ""
                    let directiveModifiers: string[] = []
    
                    if (isBind) {
                        directiveName = "x-bind";
                        // const directiveString = name.slice(1, -1);
                        const directiveString = name.substring(1);
                        [directiveArgument, ...directiveModifiers] = directiveString.split(".");
                        // console.log({directiveArgument, directiveModifiers})
                    } else if (isOn) {
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
                            styleScope = `${scopeId}`
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
    }

    // additionalAttrs.forEach(attr => htmlString += ` ${attr}`)
    htmlString += ` data-x-style-scope='${styleScope}'`
    htmlString += `>`

    // console.log({tagName, attrs: Object.entries(element.attributes), htmlString})

    // console.log({children: nextHydrationId})
    if (!isVoid) {
        if (shouldParseChildren) {
            const content = element.content ?? []
            const children = Array.isArray(content) ? content : [content]
            // console.log({content, children})
            // if (!Array.isArray(children)) throw Error("content must be an array")
            for (const child of children) {
                if (Array.isArray(child)) throw Error("content must be an array")
                // console.log({child: nextHydrationId})
                const [childHTML, childHydration, newNextHydrationId] = await compile(child, compilerOptions, nextHydrationId, {
                    shouldIgnore,
                    scopeId, 
                    staticScope,
                    additionalAttrs,
                    styleScope
                })
                nextHydrationId = newNextHydrationId
                htmlString += childHTML
                hydrationString += childHydration
            }
        }

        htmlString += `</${tagName}>`
    }

    // console.log({nextHydrationId})
    return [htmlString, hydrationString, nextHydrationId]
}

export const parseTimber = async (rawHtml: string, compilerOptions: CompilerOptions, defaultState = {}) => {
    const root = parse(rawHtml.trim())[0];
    // console.log(root.nodeType);
    // console.log(root["structure"])
    // console.log({root})
    // if (Array.isArray(root)) throw Error()
    const [html, hydration] = await parseTimberBase(rawHtml, compilerOptions)
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
        const { handleDirective, makeScopeProxy, scopedScript } = Timber
        let selectorTarget = document;
        const __defaultScope__ = makeScopeProxy(${serialize(defaultState)});
        ${hydration}
    })
    </script>`
}

export const parseTimberBase = async (rawHtml: string, compilerOptions: CompilerOptions, defaultState = {}): Promise<[string, string, number]> => {
    const trimmedHTML = rawHtml.trim()
    // console.log({ trimmedHTML, rawHtml })
    const root = parse(trimmedHTML)[0];
    // console.log(root.nodeType);
    // console.log(root["structure"])
    // console.log({root})
    // if (Array.isArray(root)) throw Error()
    const [html, hydration, nextHydrationId] = await compile(root, compilerOptions, compilerOptions.initialHydrationId ?? 0, {
        staticScope: "__defaultScope__"
    })
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
    return [html, hydration, nextHydrationId]
}


// parseTimber(`<div id="app"><div x-root x-scope=""><template x-template="timer"><div x-scope="{ time: initialTime }" x-interval:1000="time++" x-on:click="time--">{{ time }} s</div></template><template x-template="counter"><div x-scope="{ count: initialCount }">Name = <span x-html="$slots[0]"></span><button @click="count--">-</button>Count is {{count}} 2x count is {{ count * 2 }}<button @click="count++">+</button><span x-effect="(() => {if (count > 20) {$emit('high'); console.log('high');}})()"></span></div></template><template x-template="router"><div x-scope="{ route: location.pathname.split('/')[1] }"><span><span @client-navigate.window="console.log('test')"></span><span @client-navigate.window="route = location.pathname.split('/')[1]"></span><span x-effect="console.log({route})"></span><span x-for="namedSlot in $namedSlots"><span><!-- Route:{{route}} slotRoute:{{namedSlot[0]}} --><span x-if="route === namedSlot[0]" x-effect="console.log({route, slotRoute: namedSlot[0]})"><span x-html="namedSlot[1]"></span></span></span></span></span></div></template><template x-template="link"><div><span @click="(history.pushState({}, '', to), window.dispatchEvent(new Event('client-navigate', {bubbles: true})))" x-html="$slots[0]" x-bind:href="to"></span><span x-effect="console.log({to})">To = {{ to }}</span></div></template><div x-scope="{ count: 0, countRef: null, name: 'Dever' }"><span id="top"></span><span x-teleport="body">From the bottom ...</span><input x-model="name"><button @click="count--">-</button>{{ count }}<button @click="count++">+</button><!-- <template x-effect="console.log({count})"></template> --><div x-if="!(count < 5)" x-scope="{ count: 5 }"><div><button @click="count--">-</button>{{ count }}<button @click="count++">+</button><ul x-for="(item, i) in count"><li>Num: {{ item + 1 }} Index: {{ i / 2 }}</li></ul></div></div>Hello {{name}}<!-- <div x-component:timer="{ initialTime: 2 }"></div><div x-component:timer="{ initialTime: 5 }"></div> --><div x-component:counter="{ initialCount: 5 }"><slot><span>Btn 1</span></slot></div><div x-component:counter="{ initialCount: 10 }" @high.once="alert('Count is dangerously high!')"><slot><span>Btn 2</span></slot></div><span x-teleport="#top">to the top</span><div x-scope="{ href: '/index' }">Go to <input x-model="href"><span x-component:link="{ to: href }"><slot><span>Go to {{ href }}</span></slot></span></div><div x-component:router><slot name="hello"><span>Hellow</span></slot><slot name="index"><span>index</span></slot></div></div></div></div><script>const testAlert = () => alert("test!")</script><script type="module" src="/src/main.ts"></script>`)
// parseTimber(`<ul x-on:click="alert('1')" id="list"><li>Hello World</li></ul>`)

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

// console.log("test")
try {
    (async () => {
        console.log("compile")
        const compiled = await parseTimber(readFileSync("./components/todo-list/todo-list.html").toString().trim(), {
            componentCompiler: compileToTimberComponent,
            componentResolver: folderComponentResolver,
            definedWebComponents: new Set(),
            loadedComponents: new Set(),
            componentType: 'Timber',
            path: resolve("./components/todo-list/todo-list.html")
        })
        writeFileSync("todo-list.compiled.html", compiled)
        // console.log({compiled})
        // console.log("compiled")
    })()
} catch (e) {
    console.log(e)
}

// console.log(body)