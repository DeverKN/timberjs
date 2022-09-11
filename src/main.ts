// import './style.css'
// import typescriptLogo from './typescript.svg'
// import { setupCounter } from './counter'
import {init} from "../timberjs/parser"
import { addDirective } from "./public"
import { makeFuncFromString, makeGlobalsProxy } from "../timberjs/directives"

// document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
//   <div>
//     <a href="https://vitejs.dev" target="_blank">
//       <img src="/vite.svg" class="logo" alt="Vite logo" />
//     </a>
//     <a href="https://www.typescriptlang.org/" target="_blank">
//       <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
//     </a>
//     <h1>Vite + TypeScript</h1>
//     <div class="card">
//       <button id="counter" type="button"></button>
//     </div>
//     <p class="read-the-docs">
//       Click on the Vite and TypeScript logos to learn more
//     </p>
//   </div>
// `

// setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)

addDirective("x-interval", (element, value, scope, argument, _modifiers) => {
  const globals = makeGlobalsProxy(scope, {$el: element})
  const intervalCallback = makeFuncFromString<void>(value);
  setInterval(() => {
    intervalCallback(globals)
  }, parseInt(argument))
  return scope
})

init()
// const counterScope = getScope("counter")
// setInterval(() => counterScope!.count++, 100)