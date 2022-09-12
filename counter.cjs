
    window.addEventListener('timber-init', () => {
        (() => {
            const hydrate_timber_counter = (element, $scope) => {
                const { handleDirective } = Timber
                let selectorTarget = element
                
                    handleDirective("x-root",
                    selectorTarget.querySelector("[data-hydration-id='16']"),
                    {}, 
                    $scope,
                    () => {});
                    
                    handleDirective("x-scope",
                    selectorTarget.querySelector("[data-hydration-id='16']"),
                    {dataGetter:function anonymous(additionalGlobals = {}
) {
with (additionalGlobals) {
                                return {}
                            }
},
scopeId:`__scope_2`}, 
                    $scope,
                    () => {});
                    
                    handleDirective("x-on",
                    selectorTarget.querySelector("[data-hydration-id='17']"),
                    {event:`click`,
handler:function anonymous(additionalGlobals = {}
) {
with (additionalGlobals) {
                                return count--
                            }
},
options:{},
target:`self`}, 
                    '__scope_2',
                    () => {});
                    
                    handleDirective("x-model",
                    selectorTarget.querySelector("[data-hydration-id='18']"),
                    {boundVal:`name`}, 
                    '__scope_2',
                    () => {});
                    
                handleDirective("x-text",
                selectorTarget.querySelector("[data-hydration-id='19']"),
                {textCallback:function anonymous(additionalGlobals = {}
) {
with (additionalGlobals) {
                                return  name 
                            }
}}, 
                '__scope_2');
                
                handleDirective("x-text",
                selectorTarget.querySelector("[data-hydration-id='20']"),
                {textCallback:function anonymous(additionalGlobals = {}
) {
with (additionalGlobals) {
                                return  count 
                            }
}}, 
                '__scope_2');
                
                    handleDirective("x-on",
                    selectorTarget.querySelector("[data-hydration-id='21']"),
                    {event:`click`,
handler:function anonymous(additionalGlobals = {}
) {
with (additionalGlobals) {
                                return count++
                            }
},
options:{},
target:`self`}, 
                    '__scope_2',
                    () => {});
                    
            }
    
            class timber_counter extends HTMLElement {

                static get observedAttributes() { return ['count','name']; }

                constructor() {
                    // Always call super first in constructor
                    super();
                    const { makeScopeProxy } = Timber
                    this.$scope = makeScopeProxy({count:'5',name:'Jeff Bezos'})
                }

                connectedCallback() {
                    this.attachShadow({mode: 'open'});
                    const wrapper = document.createElement('template');
                    wrapper.innerHTML = `<div data-hydration-id="16">
        <button data-hydration-id="17">-</button>
        <input data-hydration-id="18">
        Hello <span data-hydration-id="19"></span>! Count is <span data-hydration-id="20"></span>
        <button data-hydration-id="21">+</button>
        <counter data-hydration-id="22"></counter>
    </div>`
                    const element = wrapper.content.firstElementChild
                    // Element functionality written in here
                    hydrate_timber_counter(wrapper.content, this.$scope)
                    this.shadowRoot.append(element)
                }

                attributeChangedCallback(name, oldValue, newValue) {
                    this.$scope[name] = newValue
                }
                  
            }
    
          customElements.define('timber-counter', timber_counter);
        })()
    })
      