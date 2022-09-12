import { CompilableDirective } from "../compilerDirectives"


type NoOpData = {}

export const noOp: CompilableDirective<NoOpData> = {
    middleware: (_value, _directiveArgument, _directiveModifiers) => {
        return {}
    },
    instance: (_element, scope, {}) => {
        return scope
    }
}