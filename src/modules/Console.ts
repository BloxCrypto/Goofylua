// UI console has been removed. Keep a small no-op wrapper so imports remain safe.
export default {
    log(message: any, type?: "info" | "error" | "warn") {
        if (type === "error") console.error(message)
        else if (type === "warn") console.warn(message)
        else console.log(message)
    }
}