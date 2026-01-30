import $ from "jquery";
import { OAuthGetResponse } from "../index"
import Utils from "./Utils"
import Settings from "./Settings";

const updateItemTemplate = $(".glu-update-item-template"),
    updateList = $("#updates-list")

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

        // Fetch sidenav data
        this.FetchSidenavData()

        // Setup account buttons
        $(".account-login").on("click", async () => {
            $(".account-login").attr("disabled", "disabled")
            location.replace(`${this.endpoints.mopsflApi()}oauth/login/discord?r=${location.href}`)
        })

        $(".account-logout").on("click", () => {
            $(".account-logout").attr("disabled", "disabled")
            fetch(`${this.endpoints.mopsflApi()}oauth/account/logout`, { credentials: "include" }).then(res => {
                this.ToggleLoginState(false)
                $(".account-logout").removeAttr("disabled")
            }).catch(err => {
                console.error(err)
                this.ToggleLoginState(false)
                $(".account-logout").removeAttr("disabled")
            })
        })

        console.log(`Welcome to GoofyLuaUglifier${this.account ? `, ${this.account.user.username}!` : "!"}`)
        console.log(`Loaded Client (took ${Date.now() - initTime}ms).`)
        $(".content-loading").remove()
    },

    async FetchSidenavData() {
        try {
            const res = await fetch(`${this.endpoints.uglifierApi()}ide/sidenav`, {
                credentials: "include",
                headers: { "uglifier-token": this.apiToken }
            })
            if (!res.ok) throw new Error(`API responded with status ${res.status}`)
            const data = await res.json()

            $("#total_requests").text(data.stats?.[0] || 0)
            $("#total_functions_called").text(data.stats?.[1] || 0)

            if (data.updatelog) {
                updateList.find(".loading").remove()
                Object.keys(data.updatelog).forEach(date => {
                    const updateData: Array<string> = data.updatelog[date]
                    const item = updateItemTemplate.contents().clone()

                    item.find(".update-date").text(date)
                    updateData.forEach(updateContent => {
                        const span = $(document.createElement("span"))
                        span.addClass("update-content").text(updateContent)
                        item.find(".update-content-list").append(span)
                    })

                    item.appendTo(updateList)
                })
            }
        } catch (error) {
            console.error("Failed to fetch sidenav data:", error)
            updateList.find(".loading").text("Failed to load updates")
        }
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
            $(".account-logout").show()
            $("#account_username_detail").text(this.account.user.username)
            $("#account_username").text(this.account.user.username)
            $("#account_id").text(this.account.user.id)
            $("#discord-avatar").attr("src", this.account.user.avatar).show()
            $("#account-information-perms").text("Logged In")
                .css("background", this.AccountPermissions.basic.color)
        } else {
            $(".account-logout").hide()
            $(".account-login").show()
            $("#account_username_detail").text("Not logged in")
            $("#account_username").text("Guest")
            $("#account_id").text("Guest")
            $("#discord-avatar").hide()
            $("#account-information-perms").text("Basic")
                .css("background", this.AccountPermissions.basic.color)
        }
    }
} as {
    account: any
    apiToken: string
    session: string
    editor: any
    settings: Settings
    endpoints: {
        uglifierApi: () => string
        mopsflApi: () => string
    }

    Init: () => Promise<void>
    FetchAccount: () => Promise<void>
    FetchSidenavData: () => Promise<void>
    UpdateCsfrToken: () => Promise<void>
    ToggleLoginState: (state: boolean) => void
}
