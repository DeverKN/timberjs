import { CompilableDirective, DirectiveHandler, makeBaseGlobals, makeFuncFromString, makeGlobalsProxy, scopes } from "../../directives"
import { handleChild } from "../../parser"
import { effect, makeScopeProxy } from "../../state"

type xScopeData = {
    getIterable: DirectiveHandler<object | any[] | number>,
    itemName: string,
    indexName: string | null
}

// const cloneTemplate = (arg: any): any => {}

// const xOnClick: any = {}

// const xText: any = {}

// const cloneChild = () => {
//     const template = `
//     <div data-template-id=1>
//         <button data-template-id=2>-</button>
//         Count is <span data-template-id=3>{{count}}</span>
//         </button data-template-id=4>+</button>
//     </div>
//     `
//     const instance = cloneTemplate(template)
//     xOnClick.instance((instance.querySelector("[data-template-id=2]")), {
//         eventHandler: (globals) => {
//             with (globals) {
//                 count--;
//             }
//         },
//         options: {

//         },
//         target: "self"
//     })
//     xText.instance((instance.querySelector("[data-template-id=3]")), {
//         textHandler: (globals) => {
//             with(globals) {
//                 return count
//             }
//         }
//     })
//     xOnClick.instance((instance.querySelector("[data-template-id=4]")), {
//         eventHandler: (globals) => {
//             with (globals) {
//                 count++;
//             }
//         },
//         options: {

//         },
//         target: "self"
//     })

// }

let nextScopeId = 0
export const xScope: CompilableDirective<xScopeData> = {
    middleware: (value, directiveArgument, _directiveModifiers) => {
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