import { ComponentResolver } from "../timberjs/compiler/compiler"
import { ComponentCompiler } from "../timberjs/compiler/components/compileToTimberComponent"
import { compileComponent } from "./compiler"

export const folderComponentResolver: ComponentResolver = (tagName, element, compilerOptions, ComponentCompiler: ComponentCompiler) => {
    return compileComponent(tagName, compilerOptions, false, ComponentCompiler)
}