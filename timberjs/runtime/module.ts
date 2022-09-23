// import { defineCustomModel } from "../directives/compilable/xModel";
import { init } from "../parser";
import { effect, makeScopeProxy } from "../state";
import { handleDirective } from "./handleDirective";
import { defineComponent, handleComponent } from "./makeComponent";

console.log("loading")
window["Timber"] = {
    handleDirective,
    makeScopeProxy,
    effect,
    defineComponent,
    handleComponent
}

// console.log(window.Timber)

console.log("loaded")

init()