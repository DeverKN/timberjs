import { init } from "../parser";
import { handleDirective } from "./handleDirective";

console.log("loading")
window["Timber"] = {
    handleDirective
}

// console.log(window.Timber)

console.log("loaded")

init()