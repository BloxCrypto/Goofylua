import $ from "jquery";
import "./style.css";
import Editor from "./modules/Editor";
import Settings from "./modules/Settings";
import Functions from "./modules/Functions";
import Client from "./modules/Client";

$(async () => {
    self.MonacoEnvironment = {
        getWorker(_, label) {
            console.log(`   > creating web worker '${label}'`)
            return label === "editorWorkerService"
                ? new Worker('https://unpkg.com/monaco-editor@0.50.0/esm/vs/editor/editor.worker.js', { type: 'module' })
                : null
        }
    }

    const settings = new Settings().Init()
    Client.settings = settings

    Functions.Init()
    Editor.Init()
    M.AutoInit()

    Client.Init()

    // Handle modal overlay for all modals
    const modalOverlay = document.querySelector('.modal-overlay')
    if (modalOverlay) {
        document.querySelectorAll('.modal').forEach(modalEl => {
            const modal = M.Modal.getInstance(modalEl)
            if (modal) {
                const originalOpen = modal.open
                const originalClose = modal.close

                modal.open = function() {
                    modalOverlay.classList.add('open')
                    originalOpen.call(this)
                }

                modal.close = function() {
                    modalOverlay.classList.remove('open')
                    originalClose.call(this)
                }
            }
        })
    }

    // Open the update claimer modal
    const updateClaimerModal = document.querySelector('.updateclaimer')
    if (updateClaimerModal) {
        const modal = M.Modal.getInstance(updateClaimerModal)
        if (modal) {
            modal.open()
        }
    }
})

$.readyException = (err => {
    console.error(err)
    Editor.ToggleLoading(`<div class="pageinit_error"><h5>Application error: a client-side exception has occurred!</h5><br><br><span>${err.name}: ${err.message}<br>Stack:<br>${err.stack.replace(/\s/gm, "<br>")}</span></div>`, true, true)
    Editor.ToggleReadOnly(true)
    Functions.blockFunctionTrigger = true
})

export interface OAuthGetResponse {
    code?: number,
    oauth: "discord" | "roblox",
    user: {
        id: string,
        username: string,
        avatar: string
    }
}
