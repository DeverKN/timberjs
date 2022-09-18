
        __components__['timber-clicker'] = defineComponent('timber-clicker', {
            $$hydrate: ($$el, $$scope, handleDirective) => {
                let selectorTarget = $$el
                
                handleDirective("x-text",
                selectorTarget.querySelector("[data-hydration-id='1']"),
                {textCallback:function anonymous(additionalGlobals = {}
) {
with (additionalGlobals) {
                                return  msg 
                            }
}}, 
                '$$scope');
                
                handleDirective("x-text",
                selectorTarget.querySelector("[data-hydration-id='2']"),
                {textCallback:function anonymous(additionalGlobals = {}
) {
with (additionalGlobals) {
                                return  count 
                            }
}}, 
                '$$scope');
                
        __components__['timber-clicker'] = defineComponent('timber-clicker', {
            $$hydrate: ($$el, $$scope, handleDirective) => {
                let selectorTarget = $$el
                
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
                        $$scope
                        );
                        
                handleDirective("x-text",
                selectorTarget.querySelector("[data-hydration-id='1']"),
                {textCallback:function anonymous(additionalGlobals = {}
) {
with (additionalGlobals) {
                                return  label 
                            }
}}, 
                '$$scope');
                
                handleDirective("x-text",
                selectorTarget.querySelector("[data-hydration-id='2']"),
                {textCallback:function anonymous(additionalGlobals = {}
) {
with (additionalGlobals) {
                                return  count 
                            }
}}, 
                '$$scope');
                
                        handleDirective("x-on",
                        selectorTarget.querySelector("[data-hydration-id='3']"),
                        {event:`click`,
handler:function anonymous(additionalGlobals = {}
) {
with (additionalGlobals) {
                                return count++
                            }
},
options:{},
target:`self`},
                        $$scope
                        );
                        
            },
            $$styles: `[data-x-style-scope='timber-clicker'] button {color: red;}`,
            $$template: `<div data-hydration-id="1" data-x-style-scope='timber-clicker'><button data-hydration-id="1" data-x-style-scope='timber-clicker'>-</button><span data-hydration-id="1"></span><span data-hydration-id="2"></span><button data-hydration-id="3" data-x-style-scope='timber-clicker'>+</button><!-- <div x-effect="(count++, $emit('test'))">Click Me</div> --></div>`,
            $$propNames: ['label', 'count'],
            $$defaults: {label:'Count is ', count:'0'},
            $$types: {label:'str', count:'num'},
        })(selectorTarget.querySelector("[data-hydration-id='3']"), __components__['timber_clicker'])
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
                        $$scope
                        );
                        
                        handleDirective("x-on",
                        selectorTarget.querySelector("[data-hydration-id='1']"),
                        {event:`click`,
handler:function anonymous(additionalGlobals = {}
) {
with (additionalGlobals) {
                                return count++
                            }
},
options:{},
target:`self`},
                        $$scope
                        );
                        
            },
            $$styles: ``,
            $$template: `<div data-hydration-id="1" data-x-style-scope='timber-clicker'>
    <span data-hydration-id="1"></span>
    <span data-hydration-id="2"></span>
    <timber-clicker data-hydration-id="3" label="Count = " count="69" data-x-style-scope='timber-clicker'></timber-clicker>
    <button data-hydration-id="1" data-x-style-scope='timber-clicker'>-</button>
    <button data-hydration-id="1" data-x-style-scope='timber-clicker'>+</button>
</div>`,
            $$propNames: ['x-scope'],
            $$defaults: {x-scope:'{count: baseCount}'},
            $$types: {x-scope:'str'},
        })