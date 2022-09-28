import { makeDirective } from "../src/public";
import { directives } from "./directives"
import { Scope } from "./state";

export const handleChild = (child: Node, scope: Scope) => {
    switch (child.nodeType) {
        case (Node.TEXT_NODE):
            const textNode = child as Text
            return handleTextNode(textNode, scope)
        case (Node.ELEMENT_NODE):
            const elementNode = child as Element
            return handleElement(elementNode, scope)
        case (Node.COMMENT_NODE):
            return
        default:
            console.log({child})
            throw Error(`unknown node type ${child.nodeType}`)
    }
}

const handleTextNode = (textNode: Text, scope: Scope) => {
    const mustacheRegex = /{{([^}]*)}}/g
    // const textTemplate = textNode.nodeValue
    const segments = textNode.nodeValue?.split(mustacheRegex)
    if (segments) {
        let replacements = []
        let isStatic = true
        for (const segment of segments) {
            if (isStatic) {
                replacements.push(document.createTextNode(segment))
                isStatic = false
            } else {
                const dynamicSpan = document.createElement("span")
                dynamicSpan.setAttribute("x-text", segment)
                handleElement(dynamicSpan, scope)
                replacements.push(dynamicSpan)
                isStatic = true
            }
        }
        // console.log(replacements)
        textNode.replaceWith(...replacements)
    }
}

const handleElement = (element: Element, scope: Scope) => {
    // if (isTextNode) 
    if (element.hasAttribute("x-ignore")) return
    for (const {name, value} of Array.from(element.attributes)) {
        if (name.includes("-") || name.includes("@") || name.includes(":") || name.includes("$")) {
            let directiveName, directive;
            let directiveBody = ""
            let directiveArgument = ""
            let directiveModifiers: string[] = []
            // console.log({name})
            if (name.startsWith(":")) {
                directiveName = "x-bind";
                [directiveArgument, ...directiveModifiers] = name.substring(1).split(".");
            } else if (name.startsWith("@")) {
                // console.log({event: name})
                directiveName = "x-on";
                [directiveArgument, ...directiveModifiers] = name.substring(1).split(".");
            } else if (name.startsWith("$")) {
                // console.log({name})
                directiveName = "x-let";
                [directiveArgument, ...directiveModifiers] = name.substring(1).split("."); 
            } else if (name.includes(":")) {
                [directiveName, directiveBody] = name.split(":");
                [directiveArgument, ...directiveModifiers] = directiveBody.split(".");
            } else {
                directiveName = name
            }
            directive = directives.get(directiveName)
            console.log({name, directive})
            if (directive) {
                scope = directive(element as HTMLElement, value, scope, directiveArgument, directiveModifiers)
                element.removeAttribute(name)
            } else {
                console.error(`Unknown directive ${directiveName} (full directive ${name})`)
            }
        }
    }

    for (const child of Array.from(element.childNodes)) {
        handleChild(child, scope)
    }
}

const handleBaseScope = (scopeElement: Element) => {
    handleElement(scopeElement, {})
}

export const init = (rootElement?: Element) => {
    window.dispatchEvent(new CustomEvent('timber-init', { detail: makeDirective }));
    const queryRoot = rootElement ?? document
    const roots = queryRoot.querySelectorAll("[x-root]")

    // const observer = new MutationObserver((mutations) => {
    //     for (const mutation of mutations) {
    //         if (mutation.type === "childList") {
    //             console.log({mutations})
    //             Array.from(mutation.addedNodes).forEach((addedNode) => {
    //                 if (addedNode.nodeType === Node.ELEMENT_NODE) {
    //                     const addedElement = addedNode as Element
    //                     const scopeId = addedElement.closest("[data-scope-id]")!.dataset.scopeId
    //                     const scope = scopes.get(scopeId) ?? {}
    //                     handleChild(addedNode, scope)
    //                 }
    //             })
    //         }
    //     }
    // })
      
    roots.forEach((root) => {
        handleBaseScope(root)
        // observer.observe(root, {
        //     childList: true,
        //     subtree: true
        // })
    })
}