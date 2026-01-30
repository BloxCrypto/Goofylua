import { CustomEvents } from "./CustomEvents"
import LocalStorage from "./LocalStorage"
import $ from "jquery"

export default class Settings {
    _data: UglifierSettings = null
    _lastdata: UglifierSettings = null
    _inputs = new Map<string, JQuery<HTMLInputElement>>()
    _events = new Map<string, CustomEvent>()

    settingsModal = $("#settings-modal")
    settingsContent = $("#settings-modal .settings-grid")
    settingTemplateElement = $(".template-setting")

    constructor(
        public storageKey = "_GLUStorage"
    ) {
        if (!LocalStorage.Exists(this.storageKey)) {
            LocalStorage.Create(this.storageKey, { settings: this.defaultSettings })
        } else if (!LocalStorage.Get(this.storageKey, "settings")) {
            LocalStorage.Set(this.storageKey, "settings", this.defaultSettings)
        }
    }

    Init() {
        const initTime = Date.now()
        this._data = LocalStorage.Get<UglifierSettings>(this.storageKey, "settings", this.defaultSettings)
        this._lastdata = this._data

        this.settingsList.forEach(setting => {
            const element = this.settingTemplateElement.contents().clone()
            element.children(`:not(#${setting.type === "number" ? "text" : setting.type}, .setting-name)`).remove()

            const input = element.find<HTMLInputElement>(".settinginput")
            if (input.length === 0) {
                element.remove()
                console.warn(`unable to add setting '${setting.id}'. (missing input element)`)

                return
            }

            element.find(".setting-name").attr("data-tooltip", setting.description).text(setting.name)
            input.attr("id", setting.id)
            input.on(setting.type === "dropdown" ? "change" : "input", () => this.UpdateSetting(setting, input))
            this._data[setting.id] ??= this.defaultSettings[setting.id]

            switch (setting.type) {
                case "checkbox":
                    input.prop("checked", this._data[setting.id])
                    break;
                case "text":
                    input.val(this._data[setting.id])
                    break;
                case "number":
                    input.val(parseInt(this._data[setting.id]))
                    break;
                case "dropdown":
                    setting.values?.forEach((value, index) => {
                        input.append($(document.createElement("option")).attr("value", index).text(value))
                    })

                    const options: HTMLOptionsCollection = input.prop("options")

                    if (!options.item(this._data[setting.id])) {
                        this._data[setting.id] = setting.values[this.defaultSettings[setting.id]]
                        this.UpdateSetting(setting, input)
                    }

                    input.val(this._data[setting.id])
                    break;
                default:
                    console.warn(`unable to set setting value for '${setting.id}'. (unknown input type)`)
                    break;
            }

            element.appendTo(this.settingsContent)

            this._inputs.set(setting.id, input)
            this._events.set(setting.id, CustomEvents.CreateEvent(setting.id))
        })


        // Settings button is now handled in index.ts
        // No need to create modal here

        $("#resetdefault").on("click", () => {
            Object.keys(this.defaultSettings).forEach(key => {
                const setting = this.settingsList.find(setting => setting.id === key)
                if (!setting) return

                this.UpdateSetting(setting, this._inputs.get(setting.id), true)
            })
        })

        console.log(`Loaded Settings. (took ${Date.now() - initTime}ms)`);
        return this
    }

    UpdateSetting(setting: Setting, input: JQuery<HTMLInputElement>, reset?: boolean) {
        let value = null
        switch (setting.type) {
            case "checkbox":
                value = reset ? this.defaultSettings[setting.id] : input.prop("checked")
                input.prop("checked", value)
                break;
            case "text":
                value = reset ? this.defaultSettings[setting.id] : input.prop("value")
                input.val(value)
                break;
            case "number":
                let raw = input.val().toString().trim();

                if (raw === "") {
                    value = 0
                } else {
                    value = reset ? this.defaultSettings[setting.id] : parseFloat(raw)

                    if (Number.isNaN(value)) {
                        value = this._lastdata[setting.id];
                    }
                }

                input.val(value);
                break;
            case "dropdown":
                value = reset ? this.defaultSettings[setting.id] : parseInt(input.prop("value"))
                input.val(value)
                break;
        }

        if (value === null) return console.warn(`unable to update setting value for '${setting.id}'. (unknown input type)`)

        this._lastdata = this._data
        this._data[setting.id] = value
        LocalStorage.Edit(this.storageKey, "settings", setting.id, value)

        if (this._events.get(setting.id)) CustomEvents.DispatchEvent(window, this._events.get(setting.id))
    }

    GetSettings(id?: string) {
        const parsedSettings = {}

        Object.keys(this._data).forEach(key => {
            const setting = this.settingsList.find(setting => setting.id === key)
            if (!setting) return

            if (setting.type === "dropdown") {
                parsedSettings[setting.id] = setting.values[this._data[setting.id]]
            } else parsedSettings[setting.id] = this._data[setting.id]
        })

        return id ? parsedSettings[id] : parsedSettings
    }

    defaultSettings: UglifierSettings = {
        beautify_output: false,
        minify_output: false,
        ignore_bytecode: false,
        ignore_bytestring: false,
        chinese_nonsense_characters: false,
        byte_string_type: 0,
        byte_encrypt_all_constants: false,
        rename_global_functions: false,
        table_length_number_memestrings: "default",
        table_length_number_rate: 0.5,
        protect_watermark: false,
        target_lua_version: 0,
        test_slider: 0,
        number_transform_offset_length: 999999,
        use_all_mathoperators_number_transform: false,
        watermark: "GLU",
        tester_access_key: "",
        bytecode_watermark: "GLU",
        memoize_function_calls: false,
    }

    settingsList: Setting[] = [
        { name: "Beautify Output", id: "beautify_output", type: "checkbox", description: "Formats your code with proper indentation and spacing." },
        { name: "Minify Output", id: "minify_output", type: "checkbox", description: "Automatically minifies your code to make it as compact as possible." },
        { name: "Ignore Bytecode", id: "ignore_bytecode", type: "checkbox", description: "Ignores bytecode during obfuscation." },
        { name: "Ignore Bytestring", id: "ignore_bytestring", type: "checkbox", description: "Ignores bytestrings during obfuscation." },
        { name: "Chinese Nonsense Characters", id: "chinese_nonsense_characters", type: "checkbox", description: "Adds Chinese characters to confuse decompilers." },
        { name: "Byte String Type", id: "byte_string_type", type: "dropdown", description: "Choose the byte string representation format.", values: ["Hexadecimal", "Decimal"] },
        { name: "Byte Encrypt All Constants", id: "byte_encrypt_all_constants", type: "checkbox", description: "Encrypts all string constants using byte encoding." },
        { name: "Rename Global Functions", id: "rename_global_functions", type: "checkbox", description: "Renames global functions to obfuscate them." },
        { name: "Table Length Number Memestrings", id: "table_length_number_memestrings", type: "text", description: "Sets the memestring pool for table length numbers." },
        { name: "Table Length Number Rate", id: "table_length_number_rate", type: "number", description: "Rate at which table length numbers are transformed." },
        { name: "Protect Watermark", id: "protect_watermark", type: "checkbox", description: "Protects the watermark from being removed." },
        { name: "Target Lua Version", id: "target_lua_version", type: "dropdown", description: "Select the target Lua version for obfuscation.", values: ["5.1", "5.2", "5.3", "LuaJIT"] },
        { name: "Test Slider", id: "test_slider", type: "number", description: "Testing parameter." },
        { name: "Number Transform Offset Length", id: "number_transform_offset_length", type: "number", description: "Offset length for number transformation." },
        { name: "Use All Math Operators Number Transform", id: "use_all_mathoperators_number_transform", type: "checkbox", description: "Uses all math operators for number transformation." },
        { name: "Watermark", id: "watermark", type: "text", description: "The watermark to embed in the obfuscated code." },
        { name: "Tester Access Key", id: "tester_access_key", type: "text", description: "Access key for testing the obfuscated code." },
        { name: "Bytecode Watermark", id: "bytecode_watermark", type: "text", description: "The watermark to embed in bytecode." },
        { name: "Memoize Function Calls", id: "memoize_function_calls", type: "checkbox", description: "Caches function call results to optimize performance." },
    ]
}

export type Setting = {
    name: string
    id: string
    description?: string
    type: "text" | "number" | "checkbox" | "dropdown",
    values?: string[],
}

export type UglifierSettings = {
    beautify_output: boolean,
    minify_output: boolean,
    ignore_bytecode: boolean,
    ignore_bytestring: boolean,
    chinese_nonsense_characters: boolean,
    byte_string_type: number,
    byte_encrypt_all_constants: boolean,
    rename_global_functions: boolean,
    table_length_number_memestrings: string,
    table_length_number_rate: number,
    protect_watermark: boolean,
    target_lua_version: number,
    test_slider: number,
    number_transform_offset_length: number,
    use_all_mathoperators_number_transform: boolean,
    watermark: string,
    tester_access_key: string,
    bytecode_watermark: string,
    memoize_function_calls: boolean,
}
