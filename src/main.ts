// import './style.css'
// import typescriptLogo from './typescript.svg'
// import { setupCounter } from './counter'
if (typeof window !== "undefined" && window?.addEventListener) {
  window.addEventListener("DOMContentLoaded", () => console.log("loaded"), false);
}

import {init} from "../timberjs/parser"
import { addDirective } from "./public"
import { makeFuncFromString, makeGlobalsProxy } from "../timberjs/directives"
import { Scope } from "../timberjs/state"

console.log("start")

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

const makeDefineMagic = (scope: Scope) => {
  return new Proxy(scope, {
    set: (target, prop, val, reciever) => {
      scope.$$add(prop, val)
      return true
    }
  })
}

addDirective("x-scoped", (element, value, scope, argument, modifiers) => {
  console.log("scoped")
  const isModule = (argument === "module")
  const globals = makeGlobalsProxy(scope, {$el: element})
  const scopedScriptBody = element.innerHTML
  // console.log({scopedScriptBody})
  const scriptCallback = isModule ? new Function("$scope",`(() => {${scopedScriptBody}})()`) : new Function("$scope",`(() => {with ($scope) {${scopedScriptBody}}})()`);
  scriptCallback(globals)
  console.log({scope})
  element.remove()
  // const scopedScript = document.createElement('script')
  // scopedScript.innerHTML = scriptCallback.toString()

  return scope
})

// addDirective("x-let", (element, value, scope, argument, modifiers) => {
//   const globals = makeGlobalsProxy(scope, {$el: element})
//   const methodBody = element.innerHTML.trim()
//   const letCallback = makeFuncFromString<any>(methodBody);
//   console.log({argument})
//   const val = letCallback(globals)
//   scope[argument] = val
//   element.remove()
//   console.log({scope})

//   return scope
// })

console.log("init")
init()
// const counterScope = getScope("counter")
// setInterval(() => counterScope!.count++, 100)