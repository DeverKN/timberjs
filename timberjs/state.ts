import { callAll } from "../utils/call"

export type Callback = () => void

export type Scope = {
    [key: string | symbol]: any
}

let effectBeingBound: Callback | null = null

export const effect = (effectFunc: Callback) => {
    effectBeingBound = effectFunc
    effectBeingBound()
    effectBeingBound = null
}

export const makeScopeProxy = (baseData: object, parentScope: Scope = {}): Scope => {
    const listeners = new Map<string | symbol, Callback[]>()
    
    return new Proxy(baseData, {
        has: (target, key) => {
            return (key in target || key in parentScope)
        },
        get: (target, prop, reciever) => {
            if (prop in target) {
                if (effectBeingBound) listeners.set(prop, [...(listeners.get(prop) ?? []), effectBeingBound])
                return Reflect.get(target, prop, reciever)
            } else {
                return parentScope[prop]
            }
        },
        set: (target, prop, value, reciever) => {
            if (prop in target) {
                // console.log({prop, value, exists: prop in target})
                Reflect.set(target, prop, value, reciever)
                callAll(listeners.get(prop) ?? [])
            } else {
                parentScope[prop] = value
            }
            return true
        }
    })
}