
import { compile, CompilerOptions } from "../compiler";
import { ComponentCompiler } from "./compileToTimberComponent";
import { parseComponent } from "./parseComponent";

export const compileToWebComponent: ComponentCompiler = async (rawHtml: string, compilerOptions: CompilerOptions, nextHydrationId: number, componentName?: string) => {

    const {
        componentName: escapedComponentName,
        props,
        styles,
        template,
        modelAttribute,
        modelEvent
    } = parseComponent(rawHtml, componentName)

    const [html, hydration, newNextHydrationId] = await compile(template, compilerOptions, nextHydrationId, { staticScope: '$scope' })
    nextHydrationId = newNextHydrationId

    return `
        (() => {
            const hydrate_${escapedComponentName} = (element, $scope) => {
                const { handleDirective } = Timber
                let selectorTarget = element
                ${hydration}
            }
    
            class ${escapedComponentName} extends HTMLElement {

                static get observedAttributes() { return [${Object.keys(props).map(prop => `'${prop}'`).join(',')}]; }
                static get attributeTypes() { return {${Object.entries(props).map(([prop, {type}]) => `${prop}:'${type}'`).join(',')}}; }

                constructor() {
                    // Always call super first in constructor
                    super();
                    const { makeScopeProxy } = Timber
                    this.$scope = makeScopeProxy({${Object.entries(props).map(([prop, typeAndDefault]) => {
                        // return '';
                        const {
                            type, 
                            default: defaultVal
                        } = typeAndDefault
                        if (type === 'num') {
                            return `${prop}:${defaultVal}`
                        } else {
                            return `${prop}:'${defaultVal}'`;
                        }
                    }).join(',')}})
                }

                connectedCallback() {
                    this.attachShadow({mode: 'open'});
                    const wrapper = document.createElement('template');
                    wrapper.innerHTML = \`${html}\`
                    const element = wrapper.content.firstElementChild

                    // const slots = Array.from(this.querySelectorAll('slot'))
                    // const namedSlots = Object.fromEntries(slots.filter((slotEl) => slotEl.hasAttribute('name')).map((slotEl) => {
                    //     return [slotEl.getAttribute('name'), slotEl]
                    // }))

                    // this.replaceChildren()

                    // this.$scope.$slots = slots
                    // this.$scope.$namedSlots = namedSlots

                    for (const {name, value} of this.attributes) {
                        if (${escapedComponentName}.observedAttributes.includes(name)) {
                            this.$scope[name] = this.parseAttr(name, value)
                        }
                        Timber.effect(() => {
                            this.setAttribute(name, this.$scope[name])
                        })
                    }

                    this.$scope.$root = element

                    // Hydrate Element
                    hydrate_${escapedComponentName}(wrapper.content, this.$scope)
                    const style = document.createElement('style');
                    style.textContent = \`${styles}\`

                    this.shadowRoot.append(style, element)
                }

                attributeChangedCallback(name, oldValue, newValue) {
                    console.log({name, oldValue, newValue})
                    if (newValue !== oldValue) this.$scope[name] = this.parseAttr(name, newValue)
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

                getModelOptions() {
                    return {
                        attributeName: '${modelAttribute}',
                        eventName: '${modelEvent}'
                    }
                }
                  
            }
    
          
          customElements.define('${componentName}', ${escapedComponentName});
        })();`
}