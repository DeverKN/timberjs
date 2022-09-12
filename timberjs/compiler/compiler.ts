import { parse } from 'node-html-parser';
import { CompilableDirective, compilerDirectives } from '../directives/compilerDirectives';
import { serialize } from './serialize';
import { writeFileSync } from 'fs'
import { xText } from '../directives/compilable/xText';

const voidElements = ['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'];

const TEXT_NODE = 3

let nextHydrationId = 0

const handleTextNode = (textNode: Text, scopeId: string): [string, string] => {
    const mustacheRegex = /{{([^}]*)}}/g
    // const textTemplate = textNode.nodeValue
    const segments = textNode["text"]?.split(mustacheRegex)

    let htmlString = ""
    let hydrationString = ""

    if (segments) {
        let isStatic = true
        for (const segment of segments) {
            if (isStatic) {
                htmlString += segment
                isStatic = false
            } else {
                const hydrationId = ++nextHydrationId
                htmlString += `<span data-hydration-id="${hydrationId}"></span>`
                const directiveData = xText.middleware(segment, "", []) as any

                hydrationString += `
                handleDirective("x-text",
                selectorTarget.querySelector("[data-hydration-id='${hydrationId}']"),
                ${serialize(directiveData)}, 
                '${scopeId}');
                `

                isStatic = true
            }
        }
        // console.log(replacements)
        // textNode.replaceWith(...replacements)
    }
    return [htmlString, hydrationString]
}

const compile = (element: Element, shouldIgnore = false, scopeId = null, staticScope: string | null = null): [string, string] => {
    if (element.nodeType === TEXT_NODE) {
        return handleTextNode(element as unknown as Text, scopeId!)
    }
    // console.log(element["structure"])
    let htmlString = ''
    let hydrationString = ''
    console.log({tag: element.tagName})
    const tagName = element.tagName.toLowerCase()
    const isVoid = voidElements.includes(tagName)
    shouldIgnore = shouldIgnore || element.hasAttribute("x-ignore")
    if (element.hasAttribute("x-root")) shouldIgnore = false
    const hydrationId = ++nextHydrationId
    htmlString += `<${tagName} data-hydration-id="${hydrationId}"`
    // console.log(element.attributes)

    const children = element.childNodes as unknown as HTMLElement[]
    let cloneFirstChild = "() => {}"
    const firstChild = children[0]
    if (firstChild && firstChild.nodeType !== TEXT_NODE) {
        const [childHTML, childHydration] = compile(firstChild, shouldIgnore, scopeId, "$scope")
        cloneFirstChild = `($scope) => {
            const template = document.createElement(template);
            template.innerHTML = ${childHTML};
            const clone = template.content
            let selectorTarget = clone
            ${childHydration}
            return clone
        }`
    }

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
                    ${staticScope ? staticScope : `'${scopeId}'`},
                    ${cloneFirstChild});
                    `

                    if (name === "x-cloak") {
                        htmlString += ` x-cloak`
                    }

                    if (directiveName === "x-scope") {
                        scopeId = directiveData.scopeId
                        staticScope = null
                        // console.log({scopeId})
                    }
                } else {
                    console.error(`Unknown directive ${directiveName} (full directive ${name})`)
                    htmlString += ` ${name}="${value}"`
                }
            }

        } else {
            htmlString += ` ${name}="${value}"`
        }
    }
    htmlString += `>`

    if (!isVoid) {
        const children = element.childNodes as unknown as HTMLElement[]
        for (const child of children) {
            const [childHTML, childHydration] = compile(child, shouldIgnore, scopeId)
            htmlString += childHTML
            hydrationString += childHydration
        }
        htmlString += `</${tagName}>`
    }

    return [htmlString, hydrationString]
}

const parseTimber = (rawHtml: string) => {
    const root: HTMLElement = parse(rawHtml.trim()) as unknown as HTMLElement;
    // console.log(root.nodeType);
    // console.log(root["structure"])
    const [html, hydration] = compile(root.firstChild as Element)
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
    <body>
    ${html}
    </body>
    <script src="/timberjs/runtime/module.ts" type="module"></script>
    <script>
    window.addEventListener('timber-init', () => {
        const {handleDirective} = Timber
        let selectorTarget = document
        ${hydration}
    })
    </script>`
}

// parseTimber(`<div id="app"><div x-root x-scope=""><template x-template="timer"><div x-scope="{ time: initialTime }" x-interval:1000="time++" x-on:click="time--">{{ time }} s</div></template><template x-template="counter"><div x-scope="{ count: initialCount }">Name = <span x-html="$slots[0]"></span><button @click="count--">-</button>Count is {{count}} 2x count is {{ count * 2 }}<button @click="count++">+</button><span x-effect="(() => {if (count > 20) {$emit('high'); console.log('high');}})()"></span></div></template><template x-template="router"><div x-scope="{ route: location.pathname.split('/')[1] }"><span><span @client-navigate.window="console.log('test')"></span><span @client-navigate.window="route = location.pathname.split('/')[1]"></span><span x-effect="console.log({route})"></span><span x-for="namedSlot in $namedSlots"><span><!-- Route:{{route}} slotRoute:{{namedSlot[0]}} --><span x-if="route === namedSlot[0]" x-effect="console.log({route, slotRoute: namedSlot[0]})"><span x-html="namedSlot[1]"></span></span></span></span></span></div></template><template x-template="link"><div><span @click="(history.pushState({}, '', to), window.dispatchEvent(new Event('client-navigate', {bubbles: true})))" x-html="$slots[0]" x-bind:href="to"></span><span x-effect="console.log({to})">To = {{ to }}</span></div></template><div x-scope="{ count: 0, countRef: null, name: 'Dever' }"><span id="top"></span><span x-teleport="body">From the bottom ...</span><input x-model="name"><button @click="count--">-</button>{{ count }}<button @click="count++">+</button><!-- <template x-effect="console.log({count})"></template> --><div x-if="!(count < 5)" x-scope="{ count: 5 }"><div><button @click="count--">-</button>{{ count }}<button @click="count++">+</button><ul x-for="(item, i) in count"><li>Num: {{ item + 1 }} Index: {{ i / 2 }}</li></ul></div></div>Hello {{name}}<!-- <div x-component:timer="{ initialTime: 2 }"></div><div x-component:timer="{ initialTime: 5 }"></div> --><div x-component:counter="{ initialCount: 5 }"><slot><span>Btn 1</span></slot></div><div x-component:counter="{ initialCount: 10 }" @high.once="alert('Count is dangerously high!')"><slot><span>Btn 2</span></slot></div><span x-teleport="#top">to the top</span><div x-scope="{ href: '/index' }">Go to <input x-model="href"><span x-component:link="{ to: href }"><slot><span>Go to {{ href }}</span></slot></span></div><div x-component:router><slot name="hello"><span>Hellow</span></slot><slot name="index"><span>index</span></slot></div></div></div></div><script>const testAlert = () => alert("test!")</script><script type="module" src="/src/main.ts"></script>`)
// parseTimber(`<ul x-on:click="alert('1')" id="list"><li>Hello World</li></ul>`)

const compileToWebComponent = (rawHtml: string) => {

    const root: HTMLElement = parse(rawHtml.trim()) as unknown as HTMLElement;
    // console.log(root.nodeType);
    // console.log(root["structure"])
    const component = root.firstChild! as Element
    const componentName = component.tagName.toLowerCase()
    const props = Object.keys(component.attributes)
    // const propDefaults = Object.values(component.attributes)
    const propsWithDefalts = Object.entries(component.attributes) as unknown as any[]
    console.log([component.firstChild])
    const [html, hydration] = compile(component.firstChild as Element, false, null, '$scope')

    const escapedComponentName = componentName.replaceAll("-", "_")

    return `
    window.addEventListener('timber-init', () => {
        (() => {
            const hydrate_${escapedComponentName} = (element, $scope) => {
                const { handleDirective } = Timber
                let selectorTarget = element
                ${hydration}
            }
    
            class ${escapedComponentName} extends HTMLElement {

                static get observedAttributes() { return [${props.map(prop => `'${prop}'`).join(',')}]; }

                constructor() {
                    // Always call super first in constructor
                    super();
                    const { makeScopeProxy } = Timber
                    this.$scope = makeScopeProxy({${propsWithDefalts.map(propDefault => `${propDefault[0]}:'${propDefault[1]}'`).join(',')}})
                }

                connectedCallback() {
                    this.attachShadow({mode: 'open'});
                    const wrapper = document.createElement('template');
                    wrapper.innerHTML = \`${html}\`
                    const element = wrapper.content.firstElementChild
                    // Element functionality written in here
                    hydrate_${escapedComponentName}(wrapper.content, this.$scope)
                    this.shadowRoot.append(element)
                }

                attributeChangedCallback(name, oldValue, newValue) {
                    this.$scope[name] = newValue
                }
                  
            }
    
          customElements.define('${componentName}', ${escapedComponentName});
        })()
    })
      `
      
}

const counterHTML = `<timber-counter count='5' name='Jeff Bezos'><div x-root x-scope="{}">
        <button @click="count--">-</button>
        <input x-model="name">
        Hello {{ name }}! Count is {{ count }}
        <button @click="count++">+</button>
        <Counter></Counter>
    </div>
</timber-counter>`
const body = parseTimber(counterHTML)

writeFileSync("test.html", body)
writeFileSync("counter.cjs", compileToWebComponent(counterHTML))
// console.log(body)