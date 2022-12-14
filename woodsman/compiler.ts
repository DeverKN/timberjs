import { compile, CompilerOptions, parse } from "../timberjs/compiler/compiler"
import { readFile } from "fs/promises"
import { compileToWebComponent } from "../timberjs/compiler/components/compileToWebComponent"
import { ComponentCompiler } from "../timberjs/compiler/components/compileToTimberComponent"
// import { parser } from "posthtml-parser"

export const compileComponent = async (componentName: string, compilerOptions: CompilerOptions, standAlone = true, compilerFunc: ComponentCompiler) => {
    const spaceRegex = /(\n +)/g
    const componentString = (await readFile(`./components/${componentName}.html`)).toString('utf-8').replaceAll(spaceRegex, "")
    const elementDeclaration = compilerFunc(componentString, compilerOptions, 0, componentName)
    if (standAlone) {
        return `
        window.addEventListener(("timber-init") => {
            ${elementDeclaration}
        })`
    } else {
        return elementDeclaration
    }
}

export const compileToInjectable = async (rawHtml: string, compilerOptions: CompilerOptions) => {
    const root = parse(rawHtml.trim())[0];

    const [html, hydration] = await compile(root, compilerOptions, 0, { staticScope: "__defaultScope__" })

    const before = `
    <head>
        <link rel="icon" href="data:,">
    </head>
    <body>
    ${html}
    </body>
    <script src="../timberjs/runtime/module.ts" type="module"></script>
    <script>
    window.addEventListener('timber-init', () => {
        const {handleDirective} = Timber
        let selectorTarget = document;
        const { makeScopeProxy } = Timber`
    
    const after = `
        ${hydration}
    })
    </script>`
    return [before, after]
}