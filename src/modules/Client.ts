import $ from "jquery";
import { OAuthGetResponse } from "../index"
import Utils from "./Utils"
import Console from "./Console";
import Settings from "./Settings";
import * as monaco from "monaco-editor"

const updateItemTemplate = $(".glu-update-item-template"),
    updateList = $(".glu-updates")

export default {
    account: null,
    apiToken: null,
    session: null,
    editor: null,
    settings: null,

    endpoints: {
        uglifierApi: () => (location.hostname == "localhost") ? "http://localhost:6968/api/" : "https://goofyluauglifier.mopsfl.de/api/",
        mopsflApi: () => (location.hostname == "localhost") ? "http://localhost:6969/v1/" : "https://api.mopsfl.de/v1/"
    },

    AccountPermissions: {
        basic: { name: "Basic", color: "#698daf" },
        tester: { name: "Tester", color: "#ac4a4a" },
        developer: { name: "Developer", color: "#5fac4a" },
    },

    async Init() {
        const initTime = Date.now()

        await this.UpdateCsfrToken()
        await this.FetchAccount()

        M.Sidenav.getInstance(document.querySelector(".leftmenu-sidebar")).options.onOpenStart = async (e) => {
            fetch(`${this.endpoints.uglifierApi()}ide/sidenav`, { credentials: "include", headers: { "uglifier-token": this.apiToken } }).then(res => res.json()).then(res => {
                $("#total_requests").text(res.stats[0] || 0)
                $("#total_functions_called").text(res.stats[1] || 0)

                Object.keys(res.updatelog).forEach(date => {
                    const updateData: Array<string> = res.updatelog[date],
                        item = updateItemTemplate.contents().clone()

                    item.find(".glu-update-date").text(date)
                    updateData.forEach(updateContent => {
                        const span = $(document.createElement("span")),
                            tooltipContent = $(document.createElement("div"))

                        tooltipContent.attr("id", "tooltip-content").html(updateContent).hide()
                        span.addClass("glu-update-content").addClass("tooltipped")
                        span.attr("data-tooltip-id", "tooltip-content").attr("data-position", "right")

                        span.html(updateContent).attr("title", updateContent.replace(/\<\/?\w+>/gm, ""))
                        item.find(".glu-update-content-list").append(span).append(tooltipContent)
                    })

                    item.appendTo(updateList)
                })

                updateList.find(".loading").remove()
            })
        }

        $(".account-login").on("click", async () => {
            $(".account-login").attr("disabled", "disabled")
            location.replace(`${this.endpoints.mopsflApi()}oauth/login/discord?r=${location.href}`)
        })

        $(".account-logout").on("click", () => {
            $(".account-logout").attr("disabled", "disabled")
            fetch(`${this.endpoints.mopsflApi()}oauth/account/logout`, { credentials: "include" }).then(res => {
                this.ToggleLoginState(false)
                $(".account-logout").removeAttr("disabled")
            })
        })

        const consoleDiv = <HTMLDivElement>document.querySelector(".console")
        document.querySelector(".resize-handle").addEventListener('mousedown', function (e: MouseEvent) {
            e.preventDefault()
            consoleDiv.classList.add("border2")

            const startY = e.clientY
            const startHeight = consoleDiv.offsetHeight

            function onMouseMove(e: MouseEvent) {
                const dy = e.clientY - startY
                consoleDiv.style.height = startHeight - dy + 'px'
            }

            function onMouseUp() {
                document.removeEventListener('mousemove', onMouseMove)
                document.removeEventListener('mouseup', onMouseUp)
                consoleDiv.classList.remove("border2")
            }

            document.addEventListener('mousemove', onMouseMove)
            document.addEventListener('mouseup', onMouseUp)
        })

        Console.log(`Welcome to GoofyLuaUglifier${this.account ? `, ${this.account.user.username}!` : "!"}`, "info")
        console.log(`Loaded Client (took ${Date.now() - initTime}ms).`)
        $(".content-loading").remove()
    },

    async FetchAccount() {
        if (this.account) return
        try {
            if (Utils.GetCookie("_ASID")) {
                const res = await fetch(`${this.endpoints.mopsflApi()}oauth/account/get`, { credentials: 'include' })
                if (!res.ok) throw new Error(`API responded with status ${res.status}`)
                const data: OAuthGetResponse = await res.json()
                if (data.code === 403) {
                    this.ToggleLoginState(false)
                } else if (data.oauth === "discord") {
                    this.account = data
                    this.account.user.avatar = `https://cdn.discordapp.com/avatars/${data.user.id}/${data.user.avatar}`
                    this.ToggleLoginState(true)
                }
            } else {
                this.ToggleLoginState(false)
            }
        } catch (error) {
            console.error("Failed to fetch account:", error)
            this.ToggleLoginState(false)
        } finally {
            $(".sidenav-loading").hide()
        }
    },

    async UpdateCsfrToken() {
        try {
            const res = await fetch(`${this.endpoints.uglifierApi()}ide`, { credentials: "include" })
            if (!res.ok) throw new Error(`API responded with status ${res.status}`)
            const data = await res.json()
            this.apiToken = data.token || "guest-token"
        } catch (error) {
            console.error("Failed to fetch CSRF token:", error)
            // Set a fallback token so the app can continue working in offline/dev mode
            this.apiToken = "guest-token"
        }
    },

    ToggleLoginState(state: boolean) {
        if (state === true) {
            $(".account-login").hide()
            $("#account-information-perms").show()
            $("#discord-avatar").show()
            $(".account-logout").show()
            $("#account_username").text(this.account.user.username)
            $("#account_id").text(this.account.user.id)
            $("#discord-avatar").attr("src", this.account.user.avatar)
            $(".account-information-user").css("display", "grid")
        } else {
            $(".account-logout").hide()
            $(".account-login").show()
            $("#account_username").text("Guest")
            $("#account_id").text("You are not logged in.")
            $("#discord-avatar").hide()
            $(".account-information-user").css("display", "flex")
            $("#account-information-perms").text("Basic")
                .css("background", this.AccountPermissions.basic.color)
        }
    }
} as {
    account: any
    apiToken: string
    session: string
    editor: monaco.editor.IStandaloneCodeEditor
    settings: Settings
    endpoints: {
        uglifierApi: () => string
        mopsflApi: () => string
    }

    Init: () => Promise<void>
    FetchAccount: () => Promise<void>
    UpdateCsfrToken: () => Promise<void>
    ToggleLoginState: (state: boolean) => void
}
