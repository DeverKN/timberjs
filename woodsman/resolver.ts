import { ComponentResolver } from "../timberjs/compiler/compiler"
import { compileComponent } from "./compiler"

export const folderComponentResolver: ComponentResolver = (tagName, element, compilerOptions) => {
    return compileComponent(tagName, compilerOptions, false)
}