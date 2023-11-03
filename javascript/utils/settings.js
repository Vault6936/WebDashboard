var WhiteboardSettings = {
    teamNumber: 6936,
    websocketURL: "ws://10.69.36.2:5800",
    defaultDraggable: null,

    Themes: {
        MRBLUE: 1,
        DARK: 2,
        LIGHT: 3,
    },

    saveSettings: function (event) {
        let popup = Popup.getPopupFromChild(event.target);
        WhiteboardSettings.teamNumber = Popup.getInputValue("team-number");
        console.log(WhiteboardSettings.teamNumber);
        localStorage.setItem("webdashboard-settings", JSON.stringify(WhiteboardSettings));
        Popup.closePopup(popup);
    },

    populateSettingsInfo: function () {
        Popup.setInputValue("team-number", WhiteboardSettings.teamNumber);
        Popup.setInputValue("websocket-url", WhiteboardSettings.websocketURL);
        Popup.setInputValue("default-size", "100x100");
        Popup.setInputValue("default-color", "#0098cb");
    }
};

window.WhiteboardSettings = WhiteboardSettings || {};