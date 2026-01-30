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
    const modalOverlay = document.querySelector('.modal-overlay') as HTMLElement

    // Wrap modal open/close methods
    if (modalOverlay) {
        document.querySelectorAll('.modal').forEach((modalEl: HTMLElement) => {
            const modal = M.Modal.getInstance(modalEl)
            if (modal) {
                const originalOpen = modal.open.bind(modal)
                const originalClose = modal.close.bind(modal)

                modal.open = function() {
                    // Close all other modals first
                    document.querySelectorAll('.modal').forEach((otherModal: HTMLElement) => {
                        const otherInstance = M.Modal.getInstance(otherModal)
                        if (otherInstance && otherInstance !== modal) {
                            otherInstance.close()
                        }
                    })
                    modalOverlay.classList.add('open')
                    return originalOpen()
                }

                modal.close = function() {
                    modalOverlay.classList.remove('open')
                    return originalClose()
                }
            }
        })
    }

    // Open the update claimer modal
    setTimeout(() => {
        const updateClaimerModal = document.querySelector('.updateclaimer') as HTMLElement
        if (updateClaimerModal) {
            const modal = M.Modal.getInstance(updateClaimerModal)
            if (modal) {
                modal.open()
            }
        }
    }, 100)
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
