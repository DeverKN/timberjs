// import { defineCustomModel } from "../directives/compilable/xModel";
import { init } from "../parser";
import { makeScopeProxy } from "../state";
import { handleDirective } from "./handleDirective";

console.log("loading")

window["Timber"] = {
    handleDirective,
    makeScopeProxy
}

// console.log(window.Timber)

console.log("loaded")

init()