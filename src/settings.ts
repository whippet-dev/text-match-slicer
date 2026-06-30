"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

class StyleSettingsCard extends formattingSettings.SimpleCard {
    public fontFamily = new formattingSettings.ItemDropdown({
        name: "fontFamily",
        displayName: "Font family",
        description: "Global font family for the visual. This will override any font family set in the report theme.",
        value: { value: "Arial", displayName: "Arial" },
        items: [
            { value: "Arial", displayName: "Arial" },
            { value: "Segoe UI", displayName: "Segoe UI" },
            { value: "Calibri", displayName: "Calibri" },
            { value: "Verdana", displayName: "Verdana" },
            { value: "Tahoma", displayName: "Tahoma" },
            { value: "Trebuchet MS", displayName: "Trebuchet MS" },
            { value: "Georgia", displayName: "Georgia" },
            { value: "Times New Roman", displayName: "Times New Roman" },
            { value: "Courier New", displayName: "Courier New" }
        ]
    });

    public fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        description: "Global font size for the visual. This will override any font size set in the report theme.",
        displayName: "Font size",
        value: 14
    });

    public inputHeight = new formattingSettings.NumUpDown({
        name: "inputHeight",
        displayName: "Search box/Button height",
        description: "Height of the search box and buttons in pixels.",
        value: 38
    });

    public cornerRadius = new formattingSettings.NumUpDown({
        name: "cornerRadius",
        displayName: "Corner radius",
        description: "Corner radius of the search box and buttons in pixels.",
        value: 0
    });

    public buttonGap = new formattingSettings.NumUpDown({
        name: "buttonGap",
        displayName: "Button gap",
        description: "Gap between the buttons in pixels.",
        value: 6
    });

    public enhancedFocus = new formattingSettings.ToggleSwitch({
        name: "enhancedFocus",
        displayName: "Enhanced focus indicators",
        description: "Show a stronger keyboard focus outline for accessibility.",
        value: true
    });

    public name: string = "styleSettings";
    public displayName: string = "Style";
    public slices = [
        this.fontFamily,
        this.fontSize,
        this.inputHeight,
        this.cornerRadius,
        this.buttonGap,
        this.enhancedFocus
    ];
}

class ColourSettingsCard extends formattingSettings.SimpleCard {
    public inputBackgroundColor = new formattingSettings.ColorPicker({
        name: "inputBackgroundColor",
        displayName: "Search box background",
        description: "Background colour of the search box.",
        value: { value: "#ffffff" }
    });

    public inputBorderColor = new formattingSettings.ColorPicker({
        name: "inputBorderColor",
        displayName: "Search box border",
        description: "Border colour of the search box.",
        value: { value: "#c8c6c4" }
    });

    public placeholderColor = new formattingSettings.ColorPicker({
        name: "placeholderColor",
        displayName: "Placeholder colour",
        description: "Colour of the placeholder text in the search box.",
        value: { value: "#605e5c" }
    });

    public searchButtonColor = new formattingSettings.ColorPicker({
        name: "searchButtonColor",
        displayName: "Search button background",
        description: "Background colour of the Search button.",
        value: { value: "#f3f2f1" }
    });

    public searchButtonTextColor = new formattingSettings.ColorPicker({
        name: "searchButtonTextColor",
        displayName: "Search button text",
        description: "Text colour of the Search button.",
        value: { value: "#252423" }
    });

    public clearButtonColor = new formattingSettings.ColorPicker({
        name: "clearButtonColor",
        displayName: "Clear button background",
        description: "Background colour of the Clear button.",
        value: { value: "#f3f2f1" }
    });

    public clearButtonTextColor = new formattingSettings.ColorPicker({
        name: "clearButtonTextColor",
        displayName: "Clear button text",
        description: "Text colour of the Clear button.",
        value: { value: "#252423" }
    });

    public modeButtonColor = new formattingSettings.ColorPicker({
        name: "modeButtonColor",
        displayName: "Mode button background",
        description: "Background colour of the Any and All buttons when not selected.",
        value: { value: "#f3f2f1" }
    });

    public modeButtonTextColor = new formattingSettings.ColorPicker({
        name: "modeButtonTextColor",
        displayName: "Mode button text",
        description: "Text colour of the Any and All buttons when not selected.",
        value: { value: "#252423" }
    });

    public selectedModeButtonColor = new formattingSettings.ColorPicker({
        name: "selectedModeButtonColor",
        displayName: "Selected mode background",
        description: "Background colour of the selected Any or All button.",
        value: { value: "#d2d0ce" }
    });

    public selectedModeButtonTextColor = new formattingSettings.ColorPicker({
        name: "selectedModeButtonTextColor",
        displayName: "Selected mode text",
        description: "Text colour of the selected Any or All button.",
        value: { value: "#252423" }
    });

    public name: string = "colourSettings";
    public displayName: string = "Colours";
    public slices = [
        this.inputBackgroundColor,
        this.inputBorderColor,
        this.placeholderColor,
        this.searchButtonColor,
        this.searchButtonTextColor,
        this.clearButtonColor,
        this.clearButtonTextColor,
        this.modeButtonColor,
        this.modeButtonTextColor,
        this.selectedModeButtonColor,
        this.selectedModeButtonTextColor
    ];
}

class BehaviourSettingsCard extends formattingSettings.SimpleCard {
    public placeholderText = new formattingSettings.TextInput({
        name: "placeholderText",
        displayName: "Placeholder text",
        description: "Text displayed in the search box when it is empty.",
        value: "Search words or phrases",
        placeholder: "Search words or phrases"
    });

    public showSearchMode = new formattingSettings.ToggleSwitch({
        name: "showSearchMode",
        displayName: "Show Any/All buttons",
        description: "Show buttons to switch between searching for any or all words.",
        value: true
    });

    public defaultMatchAll = new formattingSettings.ToggleSwitch({
        name: "defaultMatchAll",
        displayName: "Default to All words",
        description: "When the visual is first loaded, should it default to searching for all words (All) or any word (Any)?",
        value: false
    });

    public iconsOnly = new formattingSettings.ToggleSwitch({
        name: "iconsOnly",
        displayName: "Icon buttons only",
        description: "Show only icons on the buttons instead of text.",
        value: true
    });

    public searchIcon = new formattingSettings.TextInput({
        name: "searchIcon",
        displayName: "Search icon/text",
        description: "Icon or text displayed on the search button. You can use an emoji or a character.",
        value: "🔎︎",
        placeholder: "🔎︎"
    });

    public clearIcon = new formattingSettings.TextInput({
        name: "clearIcon",
        displayName: "Clear icon/text",
        value: "×",
        placeholder: "×"
    });

    public searchOnTyping = new formattingSettings.ToggleSwitch({
        name: "searchOnTyping",
        displayName: "Search while typing",
        description: "Automatically perform the search as you type instead of requiring the search button to be clicked or enter to be pressed.",
        value: false
    });

    public searchDelay = new formattingSettings.NumUpDown({
        name: "searchDelay",
        displayName: "Typing delay ms",
        description: "Delay in milliseconds before performing the search while typing.",
        value: 600
    });

    public name: string = "behaviourSettings";
    public displayName: string = "Behaviour";
    public slices = [
        this.placeholderText,
        this.showSearchMode,
        this.defaultMatchAll,
        this.iconsOnly,
        this.searchIcon,
        this.clearIcon,
        this.searchOnTyping,
        this.searchDelay
    ];
}

export class VisualFormattingSettingsModel extends formattingSettings.Model {
    public styleSettings = new StyleSettingsCard();
    public colourSettings = new ColourSettingsCard();
    public behaviourSettings = new BehaviourSettingsCard();

    public cards = [
        this.styleSettings,
        this.colourSettings,
        this.behaviourSettings
    ];
}