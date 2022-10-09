export const useTimer = (interval: number) => {
    const time = ref(0)
    setInterval(() => time.value++, interval)
    return time
}

export const setupTimer = (time: any, interval: number) => {
    setInterval(() => time.value++, interval)
    return time
}