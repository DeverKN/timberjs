import { noOp } from "./compilable/noOp"
import { xBind } from "./compilable/xBind"
import { xCloak } from "./compilable/xCloak"
import { xEffect } from "./compilable/xEffect"
import { xOn } from "./compilable/xOn"
import { xScope } from "./compilable/xScope"
import { xText } from "./compilable/xText"
import { xFor } from "./compilable/xFor"
import { xHide } from "./compilable/xHide"
import { xHTML } from "./compilable/xHTML"
import { xIf } from "./compilable/xIf"
import { xInit } from "./compilable/xInit"
import { xModel } from "./compilable/xModel"
import { xRef } from "./compilable/xRef"
import { xTeleport } from "./compilable/xTeleport"
import { Scope } from "../state"
import { handleChild } from "../parser"

export const compilerDirectives = new Map<string, CompilableDirective<any>>()

export type FirstElementCloner = (scope: Scope) => HTMLElement;

export type CompilableDirective<T> = {
    middleware: (value: string, argument: string, modifiers: string[]) => T,
    instance: (element: HTMLElement, scope: Scope, data: T, cloneFirstChild: FirstElementCloner) => void
}


compilerDirectives.set("x-root", noOp)
compilerDirectives.set("x-scope", xScope)
compilerDirectives.set("x-on", xOn)
compilerDirectives.set("x-model", xModel)
compilerDirectives.set("x-bind", xBind)
compilerDirectives.set("x-effect", xEffect)
compilerDirectives.set("x-text", xText)
compilerDirectives.set("x-for", xFor)
compilerDirectives.set("x-if", xIf)
compilerDirectives.set("x-hide", xHide)
compilerDirectives.set("x-HTML", xHTML)
compilerDirectives.set("x-init", xInit)
compilerDirectives.set("x-ref", xRef)
compilerDirectives.set("x-cloak", xCloak)
compilerDirectives.set("x-teleport", xTeleport)

export const runtimeDirective = (directiveName: string, element: HTMLElement, scope: Scope, value: string, argument: string, modifiers: string[]) => {
    const directive = compilerDirectives.get(directiveName)
    if (directive) {
        const data = directive.middleware(value, argument, modifiers)
        const firstChild = element.firstElementChild!.cloneNode(true) as Element
        const cloneFirstChild: FirstElementCloner = (scope) => {
            const newChild = firstChild.cloneNode(true)
            handleChild(newChild, scope)
            return newChild as HTMLElement
        }
        directive.instance(element, scope, data, cloneFirstChild)
    }
}