import { useTimer, setupTimer } from "./useTimer"
const $ = (arg) => arg
export let count = 0
let time = useTimer(1)
let otherTime = 0
setupTimer($(otherTime), 10)
// let count = initialCount
const inc = () => count++
const dec = () => count--