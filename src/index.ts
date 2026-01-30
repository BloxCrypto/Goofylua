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

    // UI Event Handlers
    setupUIHandlers()

    // Show update modal
    setTimeout(() => {
        showModal('update-modal')
    }, 300)
})

function setupUIHandlers() {
    // Sidebar toggle
    const sidebarLeft = document.getElementById('sidebar-left')
    const menuToggle = document.getElementById('menu-toggle')
    const closeSidebar = document.getElementById('close-sidebar')

    menuToggle?.addEventListener('click', () => {
        sidebarLeft?.classList.toggle('open')
    })

    closeSidebar?.addEventListener('click', () => {
        sidebarLeft?.classList.remove('open')
    })

    // Settings button
    const settingsBtn = document.getElementById('settings-toggle')
    settingsBtn?.addEventListener('click', () => {
        showModal('settings-modal')
    })

    // Modal close buttons
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modalId = (btn as HTMLElement).getAttribute('data-modal')
            if (modalId) {
                closeModal(modalId)
            }
        })
    })

    // Modal overlay click to close
    const overlay = document.getElementById('modal-overlay')
    overlay?.addEventListener('click', (e) => {
        if (e.target === overlay) {
            const openModal = document.querySelector('.modal.open')
            const modalId = openModal?.getAttribute('id')
            if (modalId) {
                closeModal(modalId)
            }
        }
    })

    // Console removed from UI; no resize or toggle handlers needed
}

function showModal(modalId: string) {
    const modal = document.getElementById(modalId)
    const overlay = document.getElementById('modal-overlay')
    
    if (modal && overlay) {
        modal.classList.add('open')
        overlay.classList.add('open')
    }
}

function closeModal(modalId: string) {
    const modal = document.getElementById(modalId)
    const overlay = document.getElementById('modal-overlay')
    
    if (modal) {
        modal.classList.remove('open')
    }
    
    // Check if any other modals are open
    const anyOpen = document.querySelector('.modal.open')
    if (!anyOpen && overlay) {
        overlay.classList.remove('open')
    }
}

$.readyException = (err => {
    console.error(err)
    Editor.ToggleLoading(`<div style="padding: 20px; color: #f44336;"><h3>Application Error</h3><p>${err.name}: ${err.message}</p><pre style="background: #1a1a1a; padding: 10px; border-radius: 6px; overflow-x: auto;">${err.stack}</pre></div>`, true, true)
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
