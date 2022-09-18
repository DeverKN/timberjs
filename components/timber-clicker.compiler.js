const handleProp = (prop, type) => {
    switch (type) {
        case 'string':
            return prop.toString();
        case 'number':
            return parseFloat(prop);
        default:
            return prop
    }
}

const handleProps = ($$scope, $$props, $$defaults, $$types) => {
    for (const [prop, val] of $$defaults) {
        const type = $$types[prop] ?? 'any'
        $$scope[prop] = handleProp(val, type)
    }

    for (const [prop, val] of $$props) {
        const type = $$types[prop] ?? 'any'
        $$scope[prop] = handleProp(val, type)
    }
}

const hydrate_timber_clicker = ($$el, $$scope) => {
    
}

const timber_clicker_styles = new CSSStyleSheet()
timber_clicker_styles.replace(`
    button[data-x-style-scope='1'] {
        color: red;
    }
`)

const $$template = Timber.template(/*html*/`
<div data-hydration-id='1' data-x-style-scope='1'>
<button data-hydration-id='2' data-x-style-scope='1'>-</button>
<span x-test='label' data-hydration-id='3' data-x-style-scope='1'></span> <span x-test='count' data-hydration-id='4' data-x-style-scope='1'></span>
<button data-hydration-id='5' data-x-style-scope='1'>+</button>
</div>`)

const timber_clicker = ($$scope, $$props, $$defaults, $$types, $$slots, $$namedSlots) => {
    const $$instance = $$template.cloneNode(true)
    handleProps($$scope, $$props, $$defaults, $$types)
    $$scope.$slots = $$slots
    $$scope.$namedSlots = $$namedSlots
    return hydrate_timber_clicker($$instance)
}