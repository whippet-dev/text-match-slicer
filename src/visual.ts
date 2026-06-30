"use strict";

import powerbi from "powerbi-visuals-api";
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import IVisualEventService = powerbi.extensibility.IVisualEventService;
import FilterAction = powerbi.FilterAction;

import { BasicFilter } from "powerbi-models";

import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import { VisualFormattingSettingsModel } from "./settings";

interface SearchTerm {
    text: string;
}

interface VisualSettings {
    fontFamily: string;
    fontSize: number;
    inputHeight: number;
    cornerRadius: number;
    buttonGap: number;
    enhancedFocus: boolean;

    inputBackgroundColor: string;
    inputBorderColor: string;
    placeholderColor: string;
    searchButtonColor: string;
    searchButtonTextColor: string;
    clearButtonColor: string;
    clearButtonTextColor: string;
    modeButtonColor: string;
    modeButtonTextColor: string;
    selectedModeButtonColor: string;
    selectedModeButtonTextColor: string;

    placeholderText: string;
    showSearchMode: boolean;
    defaultMatchAll: boolean;
    iconsOnly: boolean;
    searchIcon: string;
    clearIcon: string;
    searchOnTyping: boolean;
    searchDelay: number;
}

// ==========================================================
// Visual State
// References to host, DOM elements and runtime state
// ==========================================================

export class Visual implements IVisual {
    private host: IVisualHost;
    private events: IVisualEventService;
    private target: HTMLElement;

    private formattingSettingsService: FormattingSettingsService;
    private formattingSettings: VisualFormattingSettingsModel;

    private wrapper: HTMLDivElement;
    private landingPage: HTMLDivElement;
    private input: HTMLInputElement;
    private controlsRow: HTMLDivElement;

    private searchButton: HTMLDivElement;
    private clearButton: HTMLDivElement;
    private anyButton: HTMLDivElement;
    private allButton: HTMLDivElement;

    private useAllWords: boolean = false;
    private userChangedSearchMode: boolean = false;

    private filterTarget: { table: string; column: string } | null = null;
    private values: string[] = [];

    private debounceTimer: number | undefined;

    private lastAppliedFilterKey: string = "";

    private settings: VisualSettings = {
        fontFamily: "Arial",
        fontSize: 14,
        inputHeight: 38,
        cornerRadius: 0,
        buttonGap: 6,
        enhancedFocus: true,

        inputBackgroundColor: "#ffffff",
        inputBorderColor: "#c8c6c4",
        placeholderColor: "#605e5c",
        searchButtonColor: "#f3f2f1",
        searchButtonTextColor: "#252423",
        clearButtonColor: "#f3f2f1",
        clearButtonTextColor: "#252423",
        modeButtonColor: "#f3f2f1",
        modeButtonTextColor: "#252423",
        selectedModeButtonColor: "#d2d0ce",
        selectedModeButtonTextColor: "#252423",

        placeholderText: "Search words or phrases",
        showSearchMode: true,
        defaultMatchAll: false,
        iconsOnly: true,
        searchIcon: "🔎︎",
        clearIcon: "×",
        searchOnTyping: false,
        searchDelay: 600
    };

    // ==========================================================
    // Constructor
    // Creates all visual controls and wires up events
    // ==========================================================

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.events = options.host.eventService;
        this.formattingSettingsService = new FormattingSettingsService();
        this.target = options.element;
        this.target.className = "textMatchSlicer";

        this.target.tabIndex = 0;
        this.target.setAttribute("role", "group");
        this.target.setAttribute("aria-label", "Text Match Slicer");

        this.wrapper = document.createElement("div");
        this.wrapper.className = "slicerWrapper";

        this.landingPage = this.createLandingPage();

        this.input = document.createElement("input");
        this.input.className = "searchBox";
        this.input.type = "text";
        this.input.title =
            `Type in this box to search and filter your data by one or more words.

Search examples:
apple banana = find whole words
"red apple" = find an exact phrase
apple* = find words starting with apple
*apple = find words ending with apple
*apple* = find text containing apple

Search mode:
Any = match at least one word or phrase
All = match every word or phrase`;
        this.input.setAttribute("aria-label", "Search text column");

        this.controlsRow = document.createElement("div");
        this.controlsRow.className = "controlsRow";

        this.searchButton = this.createActionControl("🔍", "Search", "Apply search filter", "iconButton");
        this.clearButton = this.createActionControl("×", "Clear", "Clear search filter", "iconButton");
        this.anyButton = this.createActionControl("Any", "Match any word", "Search mode: match any word", "modeButton selected");
        this.allButton = this.createActionControl("All", "Match all words", "Search mode: match all words", "modeButton");

        this.anyButton.setAttribute("aria-pressed", "true");
        this.allButton.setAttribute("aria-pressed", "false");

        this.controlsRow.appendChild(this.searchButton);
        this.controlsRow.appendChild(this.clearButton);
        this.controlsRow.appendChild(this.anyButton);
        this.controlsRow.appendChild(this.allButton);

        this.wrapper.appendChild(this.landingPage);
        this.wrapper.appendChild(this.input);
        this.wrapper.appendChild(this.controlsRow);
        this.target.appendChild(this.wrapper);
        this.target.addEventListener("focus", () => {
            if (!this.input.disabled) {
                this.input.focus();
            }
        });

        this.addControlHandler(this.searchButton, () => this.applySearchFilter());

        this.addControlHandler(this.clearButton, () => {
            this.input.value = "";
            this.clearFilter();
            this.input.focus();
        });

        this.addControlHandler(this.anyButton, () => {
            this.userChangedSearchMode = true;
            this.useAllWords = false;
            this.updateModeButtons();

            if (this.settings.searchOnTyping && this.input.value.trim()) {
                this.scheduleSearch();
            }
        });

        this.addControlHandler(this.allButton, () => {
            this.userChangedSearchMode = true;
            this.useAllWords = true;
            this.updateModeButtons();

            if (this.settings.searchOnTyping && this.input.value.trim()) {
                this.scheduleSearch();
            }
        });

        this.input.addEventListener("keydown", event => {
            event.stopPropagation();

            if (event.key === "Enter") {
                this.applySearchFilter();
            }
        });

        this.input.addEventListener("keyup", event => {
            event.stopPropagation();
        });

        this.input.addEventListener("keypress", event => {
            event.stopPropagation();
        });

        this.input.addEventListener("input", () => {
            if (this.settings.searchOnTyping) {
                this.scheduleSearch();
            }
        });
    }
    // ==========================================================
    // Landing Page
    // Creates the no-field help screen
    // ==========================================================

    private createLandingPage(): HTMLDivElement {
        const page = document.createElement("div");
        page.className = "landingPage";

        const title = document.createElement("div");
        title.className = "landingTitle";
        title.textContent = "Text Match Slicer";

        const subtitle = document.createElement("div");
        subtitle.className = "landingSubtitle";
        subtitle.textContent = "Add a text column to start searching and filtering your report.";

        const examplesSection = document.createElement("div");
        examplesSection.className = "landingSection";

        const examplesTitle = document.createElement("div");
        examplesTitle.className = "landingSectionTitle";
        examplesTitle.textContent = "Search examples";

        const examplesList = document.createElement("div");
        examplesList.className = "landingExamples";

        const examples = [
            { code: "apple banana", text: "search multiple whole words" },
            { code: "\"red apple\"", text: "search for an exact phrase" },
            { code: "apple*", text: "words starting with apple" },
            { code: "*apple", text: "words ending with apple" },
            { code: "*apple*", text: "text containing apple" }
        ];

        examples.forEach(example => {
            const row = document.createElement("div");
            row.className = "landingExample";

            const code = document.createElement("code");
            code.className = "landingCode";
            code.textContent = example.code;

            const description = document.createElement("span");
            description.className = "landingExampleText";
            description.textContent = example.text;

            row.appendChild(code);
            row.appendChild(description);
            examplesList.appendChild(row);
        });

        examplesSection.appendChild(examplesTitle);
        examplesSection.appendChild(examplesList);

        const modeSection = document.createElement("div");
        modeSection.className = "landingHint";

        const modeTitle = document.createElement("div");
        modeTitle.className = "landingHintTitle";
        modeTitle.textContent = "Search mode";

        const anyText = document.createElement("div");
        anyText.textContent = "Any matches at least one word or phrase.";

        const allText = document.createElement("div");
        allText.textContent = "All matches every word or phrase.";

        modeSection.appendChild(modeTitle);
        modeSection.appendChild(anyText);
        modeSection.appendChild(allText);

        page.appendChild(title);
        page.appendChild(subtitle);
        page.appendChild(examplesSection);
        page.appendChild(modeSection);

        this.applyLandingPageStyles(
            page,
            title,
            subtitle,
            examplesTitle,
            examplesList,
            modeSection,
            modeTitle
        );

        return page;
    }

    private applyLandingPageStyles(
        page: HTMLDivElement,
        title: HTMLDivElement,
        subtitle: HTMLDivElement,
        examplesTitle: HTMLDivElement,
        examplesList: HTMLDivElement,
        modeSection: HTMLDivElement,
        modeTitle: HTMLDivElement
    ): void {
        const highContrast = this.getHighContrastColors();

        page.style.width = "100%";
        page.style.height = "100%";
        page.style.boxSizing = "border-box";
        page.style.padding = "12px";
        page.style.overflow = "auto";
        page.style.border = highContrast.isHighContrast
            ? `1px solid ${highContrast.border}`
            : "1px solid #c8c6c4";
        page.style.borderRadius = "4px";
        page.style.backgroundColor = highContrast.isHighContrast
            ? highContrast.background
            : "#ffffff";
        page.style.color = highContrast.isHighContrast
            ? highContrast.foreground
            : "#252423";
        page.style.fontFamily = "Arial, sans-serif";

        title.style.fontSize = "16px";
        title.style.fontWeight = "700";
        title.style.lineHeight = "1.2";
        title.style.marginBottom = "4px";

        subtitle.style.fontSize = "12px";
        subtitle.style.lineHeight = "1.35";
        subtitle.style.color = highContrast.isHighContrast
            ? highContrast.foreground
            : "#605e5c";
        subtitle.style.marginBottom = "12px";

        examplesTitle.style.fontSize = "12px";
        examplesTitle.style.fontWeight = "700";
        examplesTitle.style.marginBottom = "6px";

        examplesList.style.display = "block";

        const exampleRows = examplesList.querySelectorAll(".landingExample");
        exampleRows.forEach(row => {
            const element = row as HTMLDivElement;
            element.style.display = "flex";
            element.style.alignItems = "flex-start";
            element.style.fontSize = "11px";
            element.style.lineHeight = "1.25";
            element.style.marginBottom = "5px";
        });

        const codeBlocks = examplesList.querySelectorAll(".landingCode");
        codeBlocks.forEach(code => {
            const element = code as HTMLElement;
            element.style.display = "inline-block";
            element.style.minWidth = "78px";
            element.style.boxSizing = "border-box";
            element.style.marginRight = "6px";
            element.style.padding = "2px 4px";
            element.style.borderRadius = "3px";
            element.style.backgroundColor = highContrast.isHighContrast
                ? highContrast.background
                : "#f3f2f1";
            element.style.color = highContrast.isHighContrast
                ? highContrast.foreground
                : "#252423";
            element.style.border = highContrast.isHighContrast
                ? `1px solid ${highContrast.border}`
                : "none";
            element.style.fontFamily = 'Consolas, "Courier New", monospace';
            element.style.fontSize = "11px";
            element.style.whiteSpace = "nowrap";
        });

        const exampleText = examplesList.querySelectorAll(".landingExampleText");
        exampleText.forEach(text => {
            const element = text as HTMLElement;
            element.style.color = highContrast.isHighContrast
                ? highContrast.foreground
                : "#323130";
        });

        modeSection.style.marginTop = "12px";
        modeSection.style.padding = "8px";
        modeSection.style.borderLeft = highContrast.isHighContrast
            ? `3px solid ${highContrast.border}`
            : "3px solid #0078d4";
        modeSection.style.borderRadius = "3px";
        modeSection.style.backgroundColor = highContrast.isHighContrast
            ? highContrast.background
            : "#f8f8f8";
        modeSection.style.fontSize = "11px";
        modeSection.style.lineHeight = "1.35";
        modeSection.style.color = highContrast.isHighContrast
            ? highContrast.foreground
            : "#323130";

        modeTitle.style.fontWeight = "700";
        modeTitle.style.marginBottom = "4px";
    }

    private getHighContrastColors(): {
        isHighContrast: boolean;
        background: string;
        foreground: string;
        selectedBackground: string;
        selectedForeground: string;
        border: string;
    } {
        const palette = this.host.colorPalette;
        const isHighContrast = Boolean(palette?.isHighContrast);
        const background = palette?.background?.value || "Canvas";
        const foreground = palette?.foreground?.value || "CanvasText";

        return {
            isHighContrast,
            background,
            foreground,
            selectedBackground: foreground,
            selectedForeground: background,
            border: foreground
        };
    }
    // ==========================================================
    // Control Creation Helpers
    // Creates accessible button-like controls
    // ==========================================================
    private createActionControl(
        text: string,
        title: string,
        ariaLabel: string,
        className: string
    ): HTMLDivElement {
        const element = document.createElement("div");

        element.className = className;
        element.innerText = text;
        element.title = title;
        element.setAttribute("role", "button");
        element.setAttribute("tabindex", "0");
        element.setAttribute("aria-label", ariaLabel);

        return element;
    }
    // ==========================================================
    // Event Helpers
    // Adds mouse and keyboard support to controls
    // ==========================================================
    private flashControl(element: HTMLDivElement): void {
        // Brief visual feedback when a control is clicked or activated by keyboard.
        // This avoids needing native button styling or pixel movement.
        element.style.opacity = "0.65";

        window.setTimeout(() => {
            element.style.opacity = "";
        }, 120);
    }

    private addControlHandler(element: HTMLDivElement, action: () => void): void {
        element.addEventListener("click", () => {
            if (element.getAttribute("aria-disabled") === "true") {
                return;
            }

            this.flashControl(element);
            action();
        });

        element.addEventListener("keydown", event => {
            event.stopPropagation();
            if (element.getAttribute("aria-disabled") === "true") {
                return;
            }

            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                this.flashControl(element);
                action();
            }
        });
    }
    // ==========================================================
    // Visual Update
    // Called whenever Power BI refreshes the visual
    // Reads data and formatting settings
    // ==========================================================
    public update(options: VisualUpdateOptions): void {
        this.events.renderingStarted(options);

        try {
            this.renderVisual(options);
            this.events.renderingFinished(options);
        } catch (error) {
            this.events.renderingFailed(options, String(error));
            throw error;
        }
    }

    private renderVisual(options: VisualUpdateOptions): void {
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(
            VisualFormattingSettingsModel,
            options.dataViews?.[0]
        );

        this.settings = this.getSettings();
        this.applySettings();

        if (!this.userChangedSearchMode) {
            this.useAllWords = this.settings.defaultMatchAll;
            this.updateModeButtons();
        }

        const category = options.dataViews?.[0]?.categorical?.categories?.[0];

        if (!category || !category.source?.queryName) {
            this.filterTarget = null;
            this.values = [];

            this.landingPage.style.display = "block";
            this.input.style.display = "none";
            this.controlsRow.style.display = "none";

            this.input.disabled = true;
            this.setControlsDisabled(true);
            this.input.placeholder = "Add a text column";

            return;
        }

        const queryNameParts = category.source.queryName.split(".");

        this.filterTarget = {
            table: queryNameParts[0],
            column: queryNameParts.slice(1).join(".")
        };

        this.values = category.values
            .filter(value => value !== null && value !== undefined)
            .map(value => String(value));

        this.landingPage.style.display = "none";
        this.input.style.display = "block";
        this.controlsRow.style.display = "flex";

        this.input.disabled = false;
        this.setControlsDisabled(false);
        this.input.placeholder = this.settings.placeholderText;

        if (this.input.value.trim()) {
            this.scheduleSearch();
        }
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }

    // ==========================================================
    // Settings Loading
    // Reads formatting pane values from the report
    // ==========================================================
    private getSettings(): VisualSettings {
        return {
            fontFamily: String(this.formattingSettings.styleSettings.fontFamily.value.value),
            fontSize: this.formattingSettings.styleSettings.fontSize.value,
            inputHeight: this.formattingSettings.styleSettings.inputHeight.value,
            cornerRadius: this.formattingSettings.styleSettings.cornerRadius.value,
            buttonGap: this.formattingSettings.styleSettings.buttonGap.value,
            enhancedFocus: this.formattingSettings.styleSettings.enhancedFocus.value,

            inputBackgroundColor: this.formattingSettings.colourSettings.inputBackgroundColor.value.value,
            inputBorderColor: this.formattingSettings.colourSettings.inputBorderColor.value.value,
            placeholderColor: this.formattingSettings.colourSettings.placeholderColor.value.value,
            searchButtonColor: this.formattingSettings.colourSettings.searchButtonColor.value.value,
            searchButtonTextColor: this.formattingSettings.colourSettings.searchButtonTextColor.value.value,
            clearButtonColor: this.formattingSettings.colourSettings.clearButtonColor.value.value,
            clearButtonTextColor: this.formattingSettings.colourSettings.clearButtonTextColor.value.value,
            modeButtonColor: this.formattingSettings.colourSettings.modeButtonColor.value.value,
            modeButtonTextColor: this.formattingSettings.colourSettings.modeButtonTextColor.value.value,
            selectedModeButtonColor: this.formattingSettings.colourSettings.selectedModeButtonColor.value.value,
            selectedModeButtonTextColor: this.formattingSettings.colourSettings.selectedModeButtonTextColor.value.value,

            placeholderText: this.formattingSettings.behaviourSettings.placeholderText.value,
            showSearchMode: this.formattingSettings.behaviourSettings.showSearchMode.value,
            defaultMatchAll: this.formattingSettings.behaviourSettings.defaultMatchAll.value,
            iconsOnly: this.formattingSettings.behaviourSettings.iconsOnly.value,
            searchIcon: this.formattingSettings.behaviourSettings.searchIcon.value,
            clearIcon: this.formattingSettings.behaviourSettings.clearIcon.value,
            searchOnTyping: this.formattingSettings.behaviourSettings.searchOnTyping.value,
            searchDelay: this.formattingSettings.behaviourSettings.searchDelay.value
        };
    }

    // ==========================================================
    // UI Rendering
    // Applies formatting pane settings to visual controls
    // ==========================================================
    private applySettings(): void {
        const inputFontSize = Math.max(this.settings.fontSize, Math.round(this.settings.inputHeight * 0.42));
        const buttonHeight = `${this.settings.inputHeight}px`;
        const radius = `${this.settings.cornerRadius}px`;
        const highContrast = this.getHighContrastColors();

        const fontFamily = `"${this.settings.fontFamily}", sans-serif`;
        this.target.style.fontFamily = fontFamily;
        this.wrapper.style.fontFamily = fontFamily;
        this.input.style.fontFamily = fontFamily;
        this.target.style.fontSize = `${this.settings.fontSize}px`;

        this.wrapper.style.width = "100%";

        this.input.placeholder = this.settings.placeholderText;
        this.input.style.width = "100%";
        this.input.style.boxSizing = "border-box";
        this.input.style.display = "block";
        this.input.style.height = `${this.settings.inputHeight}px`;
        this.input.style.fontSize = `${inputFontSize}px`;
        this.input.style.backgroundColor = highContrast.isHighContrast
            ? highContrast.background
            : this.settings.inputBackgroundColor;
        this.input.style.color = highContrast.isHighContrast
            ? highContrast.foreground
            : "#252423";
        this.input.style.borderColor = highContrast.isHighContrast
            ? highContrast.border
            : this.settings.inputBorderColor;
        this.input.style.borderRadius = radius;

        this.target.style.setProperty(
            "--placeholder-color",
            highContrast.isHighContrast ? highContrast.foreground : this.settings.placeholderColor
        );
        this.target.style.setProperty(
            "--focus-outline",
            this.settings.enhancedFocus
                ? highContrast.isHighContrast
                    ? highContrast.border
                    : "#605e5c"
                : "transparent"
        );

        this.controlsRow.style.display = "flex";
        this.controlsRow.style.flexDirection = "row";
        this.controlsRow.style.width = "100%";
        this.controlsRow.style.columnGap = `${this.settings.buttonGap}px`;
        this.controlsRow.style.marginTop = "8px";

        this.searchButton.innerText = this.settings.iconsOnly
            ? this.settings.searchIcon
            : `${this.settings.searchIcon} Search`;

        this.clearButton.innerText = this.settings.iconsOnly
            ? this.settings.clearIcon
            : `${this.settings.clearIcon} Clear`;

        [this.searchButton, this.clearButton, this.anyButton, this.allButton].forEach(control => {
            control.style.fontFamily = fontFamily;
            control.style.height = buttonHeight;
            control.style.flex = "1 1 0";
            control.style.minWidth = "0";
            control.style.display = "flex";
            control.style.alignItems = "center";
            control.style.justifyContent = "center";
            control.style.textAlign = "center";
            control.style.border = highContrast.isHighContrast
                ? `1px solid ${highContrast.border}`
                : "none";
            control.style.borderRadius = radius;
            control.style.boxShadow = "none";
            control.style.padding = "0 8px";
        });

        this.searchButton.style.backgroundColor = highContrast.isHighContrast
            ? highContrast.background
            : this.settings.searchButtonColor;
        this.searchButton.style.color = highContrast.isHighContrast
            ? highContrast.foreground
            : this.settings.searchButtonTextColor;

        this.clearButton.style.backgroundColor = highContrast.isHighContrast
            ? highContrast.background
            : this.settings.clearButtonColor;
        this.clearButton.style.color = highContrast.isHighContrast
            ? highContrast.foreground
            : this.settings.clearButtonTextColor;

        this.anyButton.style.backgroundColor = highContrast.isHighContrast
            ? highContrast.background
            : this.settings.modeButtonColor;
        this.anyButton.style.color = highContrast.isHighContrast
            ? highContrast.foreground
            : this.settings.modeButtonTextColor;

        this.allButton.style.backgroundColor = highContrast.isHighContrast
            ? highContrast.background
            : this.settings.modeButtonColor;
        this.allButton.style.color = highContrast.isHighContrast
            ? highContrast.foreground
            : this.settings.modeButtonTextColor;

        this.searchButton.style.fontSize = `${Math.max(this.settings.fontSize + 4, Math.round(this.settings.inputHeight * 0.55))}px`;
        this.clearButton.style.fontSize = `${Math.max(this.settings.fontSize + 4, Math.round(this.settings.inputHeight * 0.55))}px`;
        this.anyButton.style.fontSize = `${this.settings.fontSize}px`;
        this.allButton.style.fontSize = `${this.settings.fontSize}px`;

        this.anyButton.style.display = this.settings.showSearchMode ? "flex" : "none";
        this.allButton.style.display = this.settings.showSearchMode ? "flex" : "none";

        this.updateModeButtons();
    }
    // ==========================================================
    // Search Mode
    // Updates Any / All button appearance and state
    // ==========================================================
    private updateModeButtons(): void {
        const highContrast = this.getHighContrastColors();

        this.anyButton.classList.toggle("selected", !this.useAllWords);
        this.allButton.classList.toggle("selected", this.useAllWords);

        this.anyButton.setAttribute("aria-pressed", String(!this.useAllWords));
        this.allButton.setAttribute("aria-pressed", String(this.useAllWords));

        this.anyButton.style.backgroundColor = !this.useAllWords
            ? highContrast.isHighContrast
                ? highContrast.selectedBackground
                : this.settings.selectedModeButtonColor
            : highContrast.isHighContrast
                ? highContrast.background
                : this.settings.modeButtonColor;

        this.anyButton.style.color = !this.useAllWords
            ? highContrast.isHighContrast
                ? highContrast.selectedForeground
                : this.settings.selectedModeButtonTextColor
            : highContrast.isHighContrast
                ? highContrast.foreground
                : this.settings.modeButtonTextColor;

        this.allButton.style.backgroundColor = this.useAllWords
            ? highContrast.isHighContrast
                ? highContrast.selectedBackground
                : this.settings.selectedModeButtonColor
            : highContrast.isHighContrast
                ? highContrast.background
                : this.settings.modeButtonColor;

        this.allButton.style.color = this.useAllWords
            ? highContrast.isHighContrast
                ? highContrast.selectedForeground
                : this.settings.selectedModeButtonTextColor
            : highContrast.isHighContrast
                ? highContrast.foreground
                : this.settings.modeButtonTextColor;
        if (highContrast.isHighContrast) {
            this.anyButton.style.border = !this.useAllWords
                ? "2px solid Highlight"
                : `1px solid ${highContrast.border}`;

            this.allButton.style.border = this.useAllWords
                ? "2px solid Highlight"
                : `1px solid ${highContrast.border}`;

            this.anyButton.style.fontWeight = !this.useAllWords ? "700" : "400";
            this.allButton.style.fontWeight = this.useAllWords ? "700" : "400";
        } else {
            this.anyButton.style.border = "none";
            this.allButton.style.border = "none";

            this.anyButton.style.fontWeight = "400";
            this.allButton.style.fontWeight = "400";
    }
    }
    // ==========================================================
    // Control State
    // Enables or disables controls based on field binding
    // ==========================================================
    private setControlsDisabled(disabled: boolean): void {
        [this.searchButton, this.clearButton, this.anyButton, this.allButton].forEach(control => {
            control.classList.toggle("disabled", disabled);
            control.setAttribute("aria-disabled", String(disabled));
            control.setAttribute("tabindex", disabled ? "-1" : "0");
        });
    }
    // ==========================================================
    // Search Scheduling
    // Debounced searching for "Search While Typing"
    // ==========================================================
    private scheduleSearch(): void {
        if (this.debounceTimer !== undefined) {
            window.clearTimeout(this.debounceTimer);
        }

        const delay = Math.max(150, this.settings.searchDelay);

        this.debounceTimer = window.setTimeout(() => {
            this.applySearchFilter();
        }, delay);
    }
    // ==========================================================
    // Search Execution
    // Evaluates search terms and applies Power BI filters
    // ==========================================================
    private applySearchFilter(): void {
        if (!this.filterTarget) {
            return;
        }

        const searchText = this.input.value.trim().toLowerCase();

        if (!searchText) {
            this.clearFilter();
            return;
        }

        const terms = this.parseSearchTerms(searchText);

        if (terms.length === 0) {
            this.clearFilter();
            return;
        }

        const matchedValues = this.values.filter(value => {
            const lowerValue = value.toLowerCase();

            const results = terms.map(term =>
                this.valueMatchesTerm(lowerValue, term.text)
            );

            return this.useAllWords ? results.every(Boolean) : results.some(Boolean);
        });

        const valuesToApply = matchedValues.length === 0
            ? ["__NO_MATCHES__"]
            : matchedValues;

        const filterKey = JSON.stringify({
            target: this.filterTarget,
            values: valuesToApply,
            mode: this.useAllWords,
            search: searchText
        });

        if (filterKey === this.lastAppliedFilterKey) {
            return;
        }

        this.lastAppliedFilterKey = filterKey;

        const filter = new BasicFilter(this.filterTarget, "In", valuesToApply);
        this.host.applyJsonFilter(filter, "general", "filter", FilterAction.merge);
    }
    // ==========================================================
    // Filter Removal
    // Clears any filter applied by this visual
    // ==========================================================
    private clearFilter(): void {
        if (this.debounceTimer !== undefined) {
            window.clearTimeout(this.debounceTimer);
        }
        this.lastAppliedFilterKey = "";
        this.host.applyJsonFilter(null, "general", "filter", FilterAction.remove);
    }
    // ==========================================================
    // Search Parsing
    // Converts user input into words and quoted phrases
    // ==========================================================
    private parseSearchTerms(searchText: string): SearchTerm[] {
        const terms: SearchTerm[] = [];
        const regex = /"([^"]+)"|(\S+)/g;

        let match: RegExpExecArray | null;

        while ((match = regex.exec(searchText)) !== null) {
            const text = match[1] || match[2];

            if (text && text.trim()) {
                terms.push({ text: text.trim().toLowerCase() });
            }
        }

        return terms;
    }
    // ==========================================================
    // Search Matching
    // Handles wildcard and whole-word matching
    // ==========================================================
    private valueMatchesTerm(value: string, term: string): boolean {
        const startsWithWildcard = term.startsWith("*");
        const endsWithWildcard = term.endsWith("*");
        const cleanSearch = term.replace(/^\*/, "").replace(/\*$/, "");

        if (!cleanSearch) {
            return false;
        }

        const escapedSearch = cleanSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        if (startsWithWildcard && endsWithWildcard) {
            return value.includes(cleanSearch);
        }

        if (startsWithWildcard) {
            const regex = new RegExp(`[a-zA-Z0-9]*${escapedSearch}\\b`, "i");
            return regex.test(value);
        }

        if (endsWithWildcard) {
            const regex = new RegExp(`\\b${escapedSearch}[a-zA-Z0-9]*`, "i");
            return regex.test(value);
        }

        return this.containsWholeWord(value, cleanSearch);
    }
    // ==========================================================
    // Whole Word Matching
    // Ensures terms match complete words only
    // ==========================================================
    private containsWholeWord(value: string, term: string): boolean {
        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`(^|[^a-zA-Z0-9])${escapedTerm}([^a-zA-Z0-9]|$)`, "i");

        return regex.test(value);
    }
}