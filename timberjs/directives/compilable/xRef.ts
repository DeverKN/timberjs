import { CompilableDirective, nonSSR } from "../compilerDirectives"

type xRefData = {
    refVar: string
}

export const xRef: CompilableDirective<xRefData> = {
    middleware: (value, _directiveArgument, _directiveModifiers) => {
        return {
            refVar: value
        }
    },
    instance: (element, scope, {refVar}) => {
        scope[refVar] = element
        return scope
    }/*,
    ssrInstance: nonSSR*/
}