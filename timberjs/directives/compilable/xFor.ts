import { DirectiveHandler, makeBaseGlobals, makeFuncFromString, makeGlobalsProxy } from "../../directives"
import { handleChild } from "../../parser"
import { effect, makeScopeProxy } from "../../state"
import { CompilableDirective } from "../compilerDirectives"

type xForData = {
    getIterable: DirectiveHandler<object | any[] | number>,
    itemName: string,
    indexName: string | null
}

export const xFor: CompilableDirective<xForData> = {
    middleware: (value, _directiveArgument, _directiveModifiers) => {
        let [itemName, interableName] = value.split(" in ")
        let indexName: string | null = null;
        if (itemName.includes(",")) {
            const nameIndexRegex = /\((?<itemName>[^,]+), *(?<indexName>[^,]+)\)/
            const match = itemName.match(nameIndexRegex)
            itemName = match?.groups!.itemName!
            indexName = match?.groups!.indexName!
        } 
        const getIterable = makeFuncFromString<any>(interableName)
        return {
            getIterable,
            indexName,
            itemName
        }
    },
    instance: (element, scope, {getIterable, indexName, itemName}) => {
        const globals = makeGlobalsProxy(scope, makeBaseGlobals(element))
        const baseChild = element.children[0]
        // console.log({baseChild})
        element.replaceChildren()

        effect(() => {
            let currChild = element.firstChild
            const res = getIterable(globals)
            const iterable = (typeof res === "number" ? 
                            [...Array(res).keys()] : 
                            ((Symbol.iterator in Object(res)) ? res : Object.entries(res))) as any[]
    
            for (let index = 0; index < iterable.length; ++index) {
                const item = iterable[index]
                if (currChild) {
                    const nextChild = currChild.nextSibling
                    currChild = nextChild
                } else {
                    const scopeVals = indexName ? {[itemName]: item, [indexName]: index} : {[itemName]: item}
                    const newChild = baseChild.cloneNode(true)
                    element.appendChild(newChild)
                    handleChild(newChild, makeScopeProxy(scopeVals, scope))
                }
            }
    
            while (currChild) {
                const nextChild = currChild.nextSibling
                currChild.remove()
                currChild = nextChild
            }
        })
        return scope
    }
}