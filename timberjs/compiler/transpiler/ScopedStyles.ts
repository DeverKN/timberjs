import postcss from "postcss";
import scoped from "./ScopedStylePlugin"

type CSSBinding = {
    id: string,
    exp: string
}

export const scopeStyles = async (unscopedStyles: string, scopedName: string): Promise<[string, CSSBinding[]]> => {
    const binds: CSSBinding[] =  []
    const scopedStyles = (await postcss(scoped(scopedName, binds)).process(unscopedStyles, { from: 'src/app.css', to: 'dest/app.css' })).css
    return [scopedStyles, binds]
}