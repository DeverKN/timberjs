import { DirectiveHandler, GlobalsObj, makeBaseGlobals, makeFuncFromString, makeGlobalsProxy } from "../../directives"
// import { handleChild } from "../../parser"
import { effect, makeScopeProxy, Scope } from "../../state"
import { CompilableDirective } from "../compilerDirectives"

type KeyByFunc = (item: any, globals: GlobalsObj) => any

const makeKeyBy = <T>(funcString: string, itemName: string): KeyByFunc => {
    return new Function(itemName, "additionalGlobals = {}", 
                            `with (additionalGlobals) {
                                return ${funcString}
                            }`) as DirectiveHandler<T>
}

type xForData = {
    getIterable: DirectiveHandler<object | any[] | number>,
    itemName: string,
    indexName: string | null,
    keyBy: KeyByFunc| null
}

export const xFor: CompilableDirective<xForData> = {
    middleware: (value, _directiveArgument, _directiveModifiers) => {
        const xForRegex = /((?<itemName>[A-z0-9_$]+)|(\((?<itemNameWIndex>[A-z0-9_$]+), ?(?<indexName>[A-z0-9_$]+)\))) in (?<iterable>[A-z0-9_$]+)( by (?<key>.+))?/
        const match = value.match(xForRegex)!
        const itemName = match.groups!.itemName ?? match.groups!.itemNameWIndex 
        const indexName = match.groups!.indexName ?? null
        const iterable = match.groups!.iterable
        const key = match.groups!.key ?? null
        // let [itemName, interableName] = value.split(" in ")
        // let indexName: string | null = null;
        // if (itemName.includes(",")) {
        //     const nameIndexRegex = /\((?<itemName>[^,]+), *(?<indexName>[^,]+)\)/
        //     const match = itemName.match(nameIndexRegex)
        //     itemName = match?.groups!.itemName!
        //     indexName = match?.groups!.indexName!
        // } 
        // const getIterable = makeFuncFromString<any>(interableName)
        const keyBy = key ? makeKeyBy(key, itemName) : null
        return {
            getIterable: makeFuncFromString<any>(iterable),
            indexName,
            itemName,
            keyBy
        }
    },
    instance: (element, scope, {getIterable, indexName, itemName, keyBy}, cloneElement) => {
        const globals = makeGlobalsProxy(scope, makeBaseGlobals(element))
        // const baseChild = element.children[0]
        // console.log({baseChild})
        element.replaceChildren()

        effect(() => {

            let currChild = element.firstChild
            const res = getIterable(globals)
            const iterable = (typeof res === "number" ? 
                            [...Array(res ?? 0).keys()] : 
                            ((Symbol.iterator in Object(res)) ? res : Object.entries(res))) as any[]
    
            let oldKeys = new Map<string, [HTMLElement, Scope]>()
            let scopes: Scope[] = []
            if (keyBy) {
                //keyed
                const newKeys = new Map<string, [HTMLElement, Scope]>()
                const newKids: HTMLElement[] = []
                for (let index = 0; index < iterable.length; ++index) {
                    const item = iterable[index]
                    const key = keyBy(item, globals)
                    const oldEl = oldKeys.get(key)
                    if (oldEl) {
                        const [iterElement, iterScope] = oldEl
                        newKids.push(iterElement)
                        iterScope[itemName] = item
                        if (indexName) iterScope[indexName] = index
                        newKeys.set(key, [iterElement, iterScope])
                    } else {
                        const scopeVals = indexName ? {[itemName]: item, [indexName]: index} : {[itemName]: item}
                        const newScope = makeScopeProxy(scopeVals, scope)
                        const newChild = cloneElement(newScope)
                        newKids.push(newChild)
                        newKeys.set(key, [newChild, newScope])
                    }
                }
                oldKeys = newKeys
                element.replaceChildren(...newKids)
            } else {
                //Non-keyed
                for (let index = 0; index < iterable.length; ++index) {
                    const item = iterable[index]
                    if (currChild) {
                        const nextChild = currChild.nextSibling
                        scopes[index][itemName] = item
                        if (indexName) scopes[index][indexName] = index
                        currChild = nextChild
                    } else {
                        const scopeVals = indexName ? {[itemName]: item, [indexName]: index} : {[itemName]: item}
                        const newScope = makeScopeProxy(scopeVals, scope)
                        const newChild = cloneElement(newScope)
                        scopes.push(newScope)
                        console.log({newChild})
                        element.appendChild(newChild)
                        // handleChild(newChild, makeScopeProxy(scopeVals, scope))
                    }
                }
        
                while (currChild) {
                    const nextChild = currChild.nextSibling
                    currChild.remove()
                    scopes.pop()
                    currChild = nextChild
                }
            }
        })
        return scope
    },
    usesChildren: true
}