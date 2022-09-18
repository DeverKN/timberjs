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

type xForType = "array" | "object" | "item"
type xForData = {
    getIterable: DirectiveHandler<object | any[] | number>,
    type: xForType,
    itemName: string,
    arrayNames?: string[],
    objectNames?: string[],
    indexName?: string,
    keyBy?: KeyByFunc
}

const updateScope = (scope: Scope, item: any, index: number, type: xForType, itemName: string, indexName?: string, arrayNames?: string[], objectNames?: string[]) => {
    if (indexName) scope[indexName] = index
    switch (type) {
        case("array"):
            objectNames!.forEach((objectName) => {
                scope[objectName] = item[objectName]
            })
            break;
        case("object"):
            arrayNames!.forEach((arrayName, index) => {
                scope[arrayName] = item[index]
            })
            break;
        case("item"):
            scope[itemName] = item
            break;
    }
}

const makeScope = (item: any, index: number, type: xForType, itemName: string, indexName?: string, arrayNames?: string[], objectNames?: string[]) => {
    const scope = {}
    if (indexName) scope[indexName] = index
    switch (type) {
        case("array"):
            objectNames!.forEach((objectName) => {
                scope[objectName] = item[objectName]
            })
            break;
        case("object"):
            arrayNames!.forEach((arrayName, index) => {
                scope[arrayName] = item[index]
            })
            break;
        case("item"):
            scope[itemName] = item
            break;
    }
    return scope
}

export const xFor: CompilableDirective<xForData> = {
    middleware: (value, _directiveArgument, _directiveModifiers) => {
        const xForRegex = /((?<itemName>[A-z0-9_$]+)|(\((?<itemNameWIndex>[A-z0-9_$]+), ?(?<indexName>[A-z0-9_$]+)\))) in (?<iterable>[A-z0-9_$]+)( by (?<key>.+))?/
        const arrayDestructRegex = /\[([^\],])(?:, ?([^\],])+)+\]/
        const objectDestructRegex = /\{([^,])(?:, ?([^,])+)+\}/
        const match = value.match(xForRegex)!
        const itemName = match.groups!.itemName ?? match.groups!.itemNameWIndex 
        const indexName = match.groups!.indexName ?? null
        const iterable = match.groups!.iterable
        const key = match.groups!.key ?? null
        
        const arrayDestructMatch = itemName.match(arrayDestructRegex)
        const objectDestructMatch = itemName.match(objectDestructRegex)

        let type: xForType = "item"

        let arrayNames;
        if (arrayDestructMatch) {
            arrayNames = arrayDestructMatch.slice(1)
            type = "array"
        }

        let objectNames;
        if (objectDestructMatch) {
            objectNames = objectDestructMatch.slice(1)
            type = "object"
        }
        // let [itemName, interableName] = value.split(" in ")
        // let indexName: string | null = null;
        // if (itemName.includes(",")) {
        //     const nameIndexRegex = /\((?<itemName>[^,]+), *(?<indexName>[^,]+)\)/
        //     const match = itemName.match(nameIndexRegex)
        //     itemName = match?.groups!.itemName!
        //     indexName = match?.groups!.indexName!
        // } 
        // const getIterable = makeFuncFromString<any>(interableName)
        const keyBy = key ? makeKeyBy(key, itemName) : undefined
        return {
            getIterable: makeFuncFromString<any>(iterable),
            type,
            indexName,
            itemName,
            arrayNames,
            objectNames,
            keyBy
        }
    },
    instance: (element, scope, { type, getIterable, indexName, itemName, arrayNames, objectNames, keyBy}, cloneElement) => {
        const globals = makeGlobalsProxy(scope, makeBaseGlobals(element))
        // const baseChild = element.children[0]
        // console.log({baseChild})
        element.replaceChildren()

        let oldKeys = new Map<string, [HTMLElement, Scope]>()
        let scopes: Scope[] = []
        effect(() => {

            let currChild = element.firstChild
            const res = getIterable(globals)
            const iterable = (typeof res === "number" ? 
                            [...Array(res ?? 0).keys()] : 
                            ((Symbol.iterator in Object(res)) ? res : Object.entries(res))) as any[]
    
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
                        updateScope(scope, item, index, type, itemName, indexName, arrayNames, objectNames)
                        newKeys.set(key, [iterElement, iterScope])
                    } else {
                        const scopeVals = makeScope(item, index, type, itemName, indexName, arrayNames, objectNames)
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
                    console.log({iterable})
                    if (currChild) {
                        const nextChild = currChild.nextSibling
                        console.log({scopes})
                        let currScope = scopes[index]
                        updateScope(currScope, item, index, type, itemName, indexName, arrayNames, objectNames)
                        console.log({currScope})
                        currChild = nextChild
                    } else {
                        const scopeVals = makeScope(item, index, type, itemName, indexName, arrayNames, objectNames)
                        const newScope = makeScopeProxy(scopeVals, scope)
                        const newChild = cloneElement(newScope)
                        console.log("push")
                        scopes.push(newScope)
                        console.log({newChild})
                        element.appendChild(newChild)
                        // handleChild(newChild, makeScopeProxy(scopeVals, scope))
                    }
                }
        
                while (currChild) {
                    const nextChild = currChild.nextSibling
                    currChild.remove()
                    console.log("pop")
                    scopes.pop()
                    currChild = nextChild
                }
            }
        })
        return scope
    },
    usesChildren: true
}