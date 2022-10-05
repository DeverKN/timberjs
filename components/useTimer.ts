export const useTimer = (interval: number) => {
    const time = ref(0)
    setInterval(() => time.value++, interval)
    return time
}