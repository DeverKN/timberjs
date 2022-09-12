type SerializeableObject = {
    [key: string | number | symbol]: SerializeableValue
}

type Primitive = number | string | boolean | BigInt | Symbol | null | undefined
type SerializeableValue = Primitive | Function | SerializeableValue[] | SerializeableObject

const escapeString = (stringToEscape: string) => {
    return stringToEscape.replaceAll(`"`, `\\"`).replaceAll(`'`, `\\'`).replaceAll("`", "\`")
}

export const serialize = (objectToSerialize: SerializeableValue): string => {
    if (objectToSerialize === null) return `null`
    if (objectToSerialize === undefined) return `undefined`
    if (typeof objectToSerialize === "bigint") return `${objectToSerialize.toString()}n`
    if (typeof objectToSerialize === "boolean") return `${objectToSerialize.toString()}`
    if (typeof objectToSerialize === "symbol") return serialize(objectToSerialize.description || undefined)
    if (typeof objectToSerialize === "number") return `${objectToSerialize.toString()}`
    if (typeof objectToSerialize === "string") return `\`${escapeString(objectToSerialize)}\``
    if (typeof objectToSerialize === "function") return `${objectToSerialize.toString()}`
    if (Array.isArray(objectToSerialize)) return `[${objectToSerialize.map(serialize).join(',')}]`
    return `{${Object.entries(objectToSerialize).map(([key, val]) => {
        if (typeof key === "string") {
            return `${key}:${serialize(val)}`
        } else {
            return `["${serialize(key)}"]:${serialize(val)}`
        }
    }).join(',\n')}}`
}