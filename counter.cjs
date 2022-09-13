
    window.addEventListener('timber-init', () => {
        (() => {
            const hydrate_timber_counter = (element, $scope) => {
                const { handleDirective } = Timber
                let selectorTarget = element
                
                    handleDirective("x-on",
                    selectorTarget.querySelector("[data-hydration-id='1']"),
                    {event:`click`,
handler:function anonymous(additionalGlobals = {}
) {
with (additionalGlobals) {
                                return count--
                            }
},
options:{},
target:`self`},
                    $scope
                    );
                    
            }
    
            class timber_counter extends HTMLElement {

                static get observedAttributes() { return ['count','name']; }
                static get attributeTypes() { return {count:'num',name:'str'}; }

                constructor() {
                    // Always call super first in constructor
                    super();
                    const { makeScopeProxy } = Timber
                    this.$scope = makeScopeProxy({count:5,name:'Jeff Bezos'})
                }

                connectedCallback() {
                    this.attachShadow({mode: 'open'});
                    const wrapper = document.createElement('template');
                    wrapper.innerHTML = `<button data-hydration-id="1">-</button>`
                    const element = wrapper.content.firstElementChild
                    // Element functionality written in here
                    hydrate_timber_counter(wrapper.content, this.$scope)
                    for (const {name, value} of this.attributes) {
                        if (timber_counter.observedAttributes.includes(name)) {
                            this.$scope[name] = this.parseAttr(name, value)
                        }
                    }
                    this.shadowRoot.append(element)
                }

                attributeChangedCallback(name, oldValue, newValue) {
                    this.$scope[name] = this.parseAttr(name, newValue)
                }

                parseAttr(name, val) {
                    const type = timber_counter.attributeTypes[name]
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
    
          customElements.define('timber-counter', timber_counter);
        })()
    })