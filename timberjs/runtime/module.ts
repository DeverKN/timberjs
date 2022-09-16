// import { defineCustomModel } from "../directives/compilable/xModel";
import { init } from "../parser";
import { effect, makeScopeProxy } from "../state";
import { handleDirective } from "./handleDirective";

console.log("loading")
window["Timber"] = {
    handleDirective,
    makeScopeProxy,
    effect
}

// console.log(window.Timber)

console.log("loaded")

init()