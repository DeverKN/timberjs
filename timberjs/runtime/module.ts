// import { defineCustomModel } from "../directives/compilable/xModel";
import { init } from "../parser";
import { effect, makeDefineMagic, makeScopeProxy } from "../state";
import { handleDirective, scopes } from "./handleDirective";
import { defineComponent, handleComponent } from "./makeComponent";

const scopedScript = (script, scopeOrId, type) => {
    const $scope = typeof scopeOrId === "string" ? scopes.get(scopeOrId) ?? {} : scopeOrId
    console.log({$scope})
    const $define = (type === "scoped" ? makeDefineMagic($scope) : ((type, varName, val) => {
        console.log({define: {varName, val}})
        return $scope.$define[varName] = val
    }));
    script($scope, $define)
}

console.log("loading")
window["Timber"] = {
    handleDirective,
    makeScopeProxy,
    effect,
    defineComponent,
    handleComponent,
    scopedScript
}

// console.log(window.Timber)

console.log("loaded")

init()