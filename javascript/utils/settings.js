var WhiteboardSettings = {
    dashboardID: "dashboard_0",
    teamNumber: 21865,
    websocketURL: "ws://192.168.43.1:5837",
    defaultDraggable: null,

    Themes: {
        MR_BLUE: {
            defaultText: "default-text-blue",
            menu: "menu-blue",
            menuTransition: "transition-blue",
            whiteboard: "whiteboard-blue",
            menuBtn: "menu-button-blue",
            layoutName: "layout-name-container-blue",
            layoutNameTxt: "layout-name-blue",
            popup: "popup-blue",
            inputLabel: "input-label-blue",
            popupInput: "popup-input-blue",
            applyBtn: "apply-blue",
            prompt: "prompt-blue",
            draggableField: "draggable-selectable-field-blue",
            defaultSelectable: "default-selectable-blue",
            defaultSelectableSelected: "default-selectable-selected-blue",
            draggableUnselect: "draggable-unselect-blue",
            draggableSelect: "draggable-select-blue",
            attributes: {
                closeSrc: "./images/close-blue.svg",
                nodeHover: "black",
                draggableLabelColor: "white",
            }
        },
        CHARCOAL: {
            defaultText: "default-text-dark",
            menu: "menu-dark",
            menuTransition: "transition-dark",
            whiteboard: "whiteboard-dark",
            menuBtn: "menu-button-dark",
            layoutName: "layout-name-container-dark",
            layoutNameTxt: "layout-name-dark",
            popup: "popup-dark",
            inputLabel: "input-label-dark",
            popupInput: "popup-input-dark",
            applyBtn: "apply-dark",
            prompt: "prompt-dark",
            draggableField: "draggable-selectable-field-dark",
            defaultSelectable: "default-selectable-dark",
            defaultSelectableSelected: "default-selectable-selected-dark",
            draggableUnselect: "draggable-unselect-dark",
            draggableSelect: "draggable-select-dark",
            attributes: {
                closeSrc: "./images/close-dark.svg",
                nodeHover: "black",
                draggableLabelColor: "#e1e8e3",
            }
        },
        LIGHT: {
            defaultText: "default-text-light",
            menu: "menu-light",
            menuTransition: "transition-light",
            whiteboard: "whiteboard-light",
            menuBtn: "menu-button-light",
            layoutName: "layout-name-container-light",
            layoutNameTxt: "layout-name-light",
            popup: "popup-light",
            inputLabel: "input-label-light",
            popupInput: "popup-input-light",
            applyBtn: "apply-light",
            prompt: "prompt-light",
            draggableField: "draggable-selectable-field-light",
            defaultSelectable: "default-selectable-light",
            defaultSelectableSelected: "default-selectable-selected-light",
            draggableUnselect: "draggable-unselect-light",
            draggableSelect: "draggable-select-light",
            attributes: {
                closeSrc: "./images/close-light.svg",
                nodeHover: "black",
                draggableLabelColor: "white",
            }
        },

        selectedTheme: null,
    },

    saveSettings: function (event) {
        let popup = Popup.getPopupFromChild(event.target);
        WhiteboardSettings.dashboardID = Popup.getInputValue("dashboard-id");
        WhiteboardSettings.teamNumber = Popup.getInputValue("team-number");
        WhiteboardSettings.websocketURL = Popup.getInputValue("websocket-url");
        localStorage.setItem("webdashboard-settings", JSON.stringify(WhiteboardSettings));
        Popup.closePopup(popup);
    },

    populateSettingsInfo: function () {
        Popup.setInputValue("dashboard-id", WhiteboardSettings.dashboardID);
        Popup.setInputValue("team-number", WhiteboardSettings.teamNumber);
        Popup.setInputValue("websocket-url", WhiteboardSettings.websocketURL);
    },

    addClass(currentClass, toAdd) {
        try {
            Array.from(document.getElementsByClassName(currentClass)).forEach((element) => {
                element.classList.add(toAdd);
            });
        } catch (err) {
            console.warn(err);
        }
    },

    setTheme: function () {
        let theme = WhiteboardSettings.Themes.selectedTheme;
        WhiteboardSettings.addClass("default-text", theme.defaultText);
        document.getElementById("menu").classList.add(theme.menu);
        document.getElementById("transition").classList.add(theme.menuTransition);
        document.getElementById("whiteboard").classList.add(theme.whiteboard);
        WhiteboardSettings.addClass("menu-button", theme.menuBtn);
        WhiteboardSettings.addClass("dropdown-button", theme.menuBtn);
        WhiteboardSettings.addClass("dropdown", theme.menuBtn);
        WhiteboardSettings.addClass("dropdown-option", theme.menuBtn);
        document.getElementById("layout-name-container").classList.add(theme.layoutName);
        document.getElementById("layout-name").classList.add(theme.layoutNameTxt);
        WhiteboardSettings.addClass("popup", theme.popup);
        WhiteboardSettings.addClass("input-label", theme.inputLabel);
        WhiteboardSettings.addClass("popup-input", theme.popupInput);
        WhiteboardSettings.addClass("apply", theme.applyBtn);
        Array.from(document.getElementsByClassName("close")).forEach((img) => { img.setAttribute("src", theme.attributes.closeSrc) });
        WhiteboardSettings.addClass("prompt", theme.prompt);
        document.getElementById("draggable-selectable-field").classList.add(theme.draggableField);
    },

};

window.WhiteboardSettings = WhiteboardSettings || {};

WhiteboardSettings.Themes.selectedTheme = WhiteboardSettings.Themes.CHARCOAL;