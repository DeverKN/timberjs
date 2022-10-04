import postcss from "postcss";
import namespace from "postcss-plugin-namespace"

export const scopeStyles = async (unscopedStyles: string, scopeSelector: string): Promise<string> => {
    const scopedStyles = (await postcss(namespace(scopeSelector)).process(unscopedStyles, { from: 'src/app.css', to: 'dest/app.css' })).css
    return scopedStyles
}