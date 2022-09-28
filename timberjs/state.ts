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

// const 

let nextScopeNum = 0
export const makeScopeProxy = (baseData: object, parentScope: Scope = {}): Scope => {
    const scopeNum = nextScopeNum++
    const listeners = new Map<string | symbol, Callback[]>()
    const addProp = (newProp, newVal) => baseData[newProp] = newVal
    const defineProxy = new Proxy({}, {
        set: (target, prop, value, reciever) => {
            addProp(prop, value)
            return true
        }
    })

    const getScopedID = (id: string) => {
        return `__scoped_id__${scopeNum}_${id}`
    }

    const internalKeys = ["$define", "$add", "$id"]
    return new Proxy(baseData, {
        has: (target, key) => {
            return (key in target || key in parentScope || (typeof key === "string" && internalKeys.includes(key)))
        },
        get: (target, prop, reciever) => {
            if (prop === "$define") return defineProxy
            if (prop === "$id") return addProp
            if (prop === "$add") return addProp
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
            } else if (prop in parentScope) {
                parentScope[prop] = value
            } else {
                Reflect.set(target, prop, value, reciever)
            }
            return true
        }
    })
}

export const makeDefineMagic = (scope) => {

}