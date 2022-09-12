import { CompilableDirective, DirectiveHandler, makeFuncFromString, makeGlobalsProxy } from "../../directives"

type xOnData = {
    event: string,
    handler: DirectiveHandler<void>,
    options: AddEventListenerOptions,
    target: "self" | "document" | "window"
}

export const xOn: CompilableDirective<xOnData> = {
    middleware: (value: string, directiveArgument, directiveModifiers) => {
        const eventCallback = makeFuncFromString<void>(value)
        const nonOptionModifiers = ["window", "document"]
        const options: AddEventListenerOptions = Object.fromEntries(directiveModifiers.filter(modifier => !nonOptionModifiers.includes(modifier)).map(modifier => [modifier, true]))
        let target: ("self" | "document" | "window") = "self"
        if (directiveModifiers.includes("window")) target = "window"
        if (directiveModifiers.includes("document")) target = "document"
        return {
            event: directiveArgument,
            handler: eventCallback,
            options,
            target
        }
    },
    instance: (element, scope, {event, handler, options, target}) => {
        const globals = makeGlobalsProxy(scope, element)
        let eventTarget: EventTarget;
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
            handler(globals)
        }, options)

        return scope
    }
}