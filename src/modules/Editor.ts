import Client from "./Client"

declare const CodeMirror: any

export default {
    errorHighlightHandles: [] as Array<any>,
    defaultScript: `local numA = 123
local numB = 100
local messageText = "Hello World!"
local flagTrue = true
local flagFalse = false
local getValues = function()
    return { numA, numB, messageText, flagTrue, flagFalse }
end
local numG = 100

function calculateDifference(...)
    local inputArgs = {...}
    for index, value in pairs(getValues()) do
        print(index, value)
    end
    return inputArgs[1] - inputArgs[2]
end

print(calculateDifference(numA, numB))
print(numB - numG)`.trim(),

    Init() {
        const initTime = Date.now()

        const container = document.querySelector(".monaco") as HTMLElement
        Client.editor = CodeMirror(container, {
            value: this.defaultScript,
            mode: "lua",
            theme: "monokai",
            lineNumbers: true,
            lineWrapping: true,
            autofocus: false,
        })

        console.log(`Loaded CodeMirror Editor. (took ${Date.now() - initTime}ms)`);
    },

    GetValue() {
        return Client.editor.getValue()
    },

    SetValue(value: string) {
        return Client.editor.setValue(value)
    },

    CopyValue() {
        this.GetValue() && navigator.clipboard.writeText(this.GetValue())
    },

    Clear() {
        Client.editor.setValue("")
    },

    ToggleReadOnly(state = true) {
        Client.editor.setOption("readOnly", state)
    },

    GetDomElement(): HTMLElement {
        return Client.editor.getWrapperElement()
    },

    ToggleLoading(loadingText: string = "Loading", noDots?: boolean, html?: boolean) {
        const loadingTextElement: HTMLElement = document.querySelector(".loadingtext")

        document.querySelector(".monaco").classList.toggle("blur")
        document.querySelector(".sidebar").classList.toggle("blur")
        !html ? loadingTextElement.innerText = `${loadingText}${!noDots ? "..." : ""}` : loadingTextElement.innerHTML = `${loadingText}${!noDots ? "..." : ""}`
        loadingTextElement.classList.toggle("hide")
    },

    SetLoadingText(loadingText: string = "Loading", noDots?: boolean, html?: boolean) {
        const loadingTextElement: HTMLElement = document.querySelector(".loadingtext")
        !html ? loadingTextElement.innerText = `${loadingText}${!noDots ? "..." : ""}` : loadingTextElement.innerHTML = `${loadingText}${!noDots ? "..." : ""}`
    },

    HighlightRange(range: any, message: string) {
        if (!range) return

        // clear previous highlights
        if (this.errorHighlightHandles && this.errorHighlightHandles.length) {
            this.errorHighlightHandles.forEach(h => {
                try { if (h.mark) h.mark.clear(); } catch (e) { }
                try { if (h.line != null) Client.editor.removeLineClass(h.line, 'background', 'errorCodeHighlightLine') } catch (e) { }
            })
            this.errorHighlightHandles = []
        }

        const doc = Client.editor.getDoc()
        const startLine = (range.startLineNumber || range.startLine || 1) - 1
        const startCh = (range.startColumn || range.startColumn || range.startColumn) ? ((range.startColumn || 1) - 1) : 0
        const endLine = (range.endLineNumber || range.endLine || startLine + 1) - 1
        const endCh = (range.endColumn || range.endColumn || startCh + 1) ? ((range.endColumn || (startCh + 1)) - 1) : startCh + 1

        try {
            const mark = doc.markText({ line: startLine, ch: startCh }, { line: endLine, ch: endCh }, { className: 'errorCodeHighlightPoint', title: message })
            Client.editor.addLineClass(startLine, 'background', 'errorCodeHighlightLine')
            this.errorHighlightHandles.push({ mark, line: startLine })
        } catch (e) {
            console.error('Failed to highlight range', e)
        }
    },

    SyntaxErrorToRange(error: string) {
        const match = error.match(/\[(\d+):(\d+)\]/)
        if (!match) return null

        const line = +match[1]
        let column = +match[2]

        // approximate end column as column+1
        const endCol = column + 1

        return { startLineNumber: line, startColumn: column, endLineNumber: line, endColumn: endCol }
    }
}