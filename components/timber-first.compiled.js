(() => {
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
    .label[data-x-style-scope='2'] {
        background-color: red;
    }
`).then(() => {
    document.adoptedStyleSheets.push(timber_clicker_styles)
})

const $$template = Timber.template(/*html*/`
<div x-context:name="'Me!'">
<div>
    <span class="label">The first child is... <span x-slot="first">Fallback One</span></span>
</div>
<div>
    <span class="label">The second child is... <span x-slot="second">Fallback Two</span></span>
</div>
</div>`)

const $$defaults = {}
const $$types = {}

const timber_clicker = ($$scope, $$slots, $$namedSlots) => {
    const $$instance = $$template.cloneNode(true)
    handleProps($$scope, $$props, $$defaults, $$types)
    $$scope.$slots = $$slots
    $$scope.$namedSlots = $$namedSlots
    return hydrate_timber_clicker($$instance)
}

return timber_clicker
})()

defineComponent('timber-clicker', {
    hydrate: ($$el, $$scope) => {
        
    },
    styles: `
        .label[data-x-style-scope='2'] {
            background-color: red;
        }
    `,
    $$template: /*html*/`
    <div x-context:name="'Me!'">
    <div>
        <span class="label">The first child is... <span x-slot="first">Fallback One</span></span>
    </div>
    <div>
        <span class="label">The second child is... <span x-slot="second">Fallback Two</span></span>
    </div>
    </div>`,
    $$props: [],
    $$defaults: {},
    $$types: {}
    })