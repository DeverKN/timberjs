type Callback = () => void
export const call = (callback: Callback) => callback()

export const callAll = (callbacks: Callback[]) => callbacks.forEach(call)