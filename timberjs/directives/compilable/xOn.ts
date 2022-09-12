import { DirectiveHandler, makeFuncFromString, makeGlobalsProxy } from "../../directives"
import { CompilableDirective } from "../compilerDirectives"

type xOnData = {
    event: string,
    handler: DirectiveHandler<Function | void>,
    options: AddEventListenerOptions,
    target: "self" | "document" | "window"
}

export const xOn: CompilableDirective<xOnData> = {
    middleware: (value: string, directiveArgument, directiveModifiers) => {
        const nonOptionModifiers = ["window", "document"]
        const options: AddEventListenerOptions = Object.fromEntries(directiveModifiers.filter(modifier => !nonOptionModifiers.includes(modifier)).map(modifier => [modifier, true]))
        let target: ("self" | "document" | "window") = "self"
        if (directiveModifiers.includes("window")) target = "window"
        if (directiveModifiers.includes("document")) target = "document"
        return {
            event: directiveArgument,
            handler: makeFuncFromString<Function | void>(value),
            options,
            target
        }
    },
    instance: (element, scope, {event, handler, options, target}) => {
        const globals = makeGlobalsProxy(scope, element)
        let eventTarget: EventTarget = element;
        switch (target) {
            case ("self"):
                eventTarget = element
                break; 
            case ("window"):
                eventTarget = window
                break; 
            case ("document"):
                eventTarget = document
                break; 
        }

        eventTarget.addEventListener(event, (event) => {
            globals.$event = event
            const returnValue = handler(globals)
            if (typeof returnValue === "function") {
                returnValue(event, scope)
            }
        }, options)

        return scope
    }
}