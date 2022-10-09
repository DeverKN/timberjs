//const postfix = "[data-test-prefix]"
let nextBindId = 0
const binds = new Map()

const escapeCSSBind = (cssBind) => {
  return cssBind.replaceAll(/[^a-z0-9]/g, "_")
}
const plugin = (scope, binds = []) => {
  const postfix = `[data-x-${scope}]`;
  return {
    postcssPlugin: 'postcss-reverse-props',
    Once(root) {
        // Transform CSS AST here
        root.walkRules(rule => {
            // Transform each rule here
          	const rawSelector = rule.selector
            const isGlobal = rawSelector.startsWith(":global(")
            const deepCombinators = [">>>","/deep/"]
            if (isGlobal) {
              const globalSelector = rawSelector.slice(8, -1)
              rule.selector = globalSelector
            } else {
              if (rawSelector.includes(">>>")) {
                const [deepParent, deepRule] = rawSelector.split(">>>")
                rule.selector = `${deepParent.trim()}${postfix} ${deepRule.trim()}`
              } else if (rawSelector.includes("/deep/")) {
                const [deepParent, deepRule] = rawSelector.split("/deep/")
                rule.selector = `${deepParent.trim()}${postfix} ${deepRule.trim()}`
              } else {
                rule.selector = `${rawSelector}${postfix}`
              }
            }
            rule.walkDecls(decl => {
                // Transform each property declaration here
              	const { value } = decl
                const cssBindRegex = /x-bind\(('([^)]+)'|[A-z0-9]+)\)/g
                decl.value = decl.value.replaceAll(cssBindRegex, (match, g1, g2) => {
                  const bindExp = g2 ? g2 : g1
                  const escapedBind = escapeCSSBind(bindExp)
                  const bindVar = `--${scope}-${escapedBind}`
                  return `var(${bindVar})`
                })
              	/*const isBind = value.startsWith("x-bind(")
                if (isBind) {
                  const bindExp = value.slice(7, -1)
                  const bindId = `--x-bind-${nextBindId++}`
                  decl.value = `var(${bindId})`
                  binds.push({id: bindId, exp: bindExp})
                }*/
                //decl.prop = decl.prop.split('').reverse().join('');
            });
        });
    	}
	}
};

plugin.postcss = true;

export default plugin;
