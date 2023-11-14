var Load = {
    currentLayout: "default",

    listLayoutNames: function () {
        layoutNames = [];
        for (let i = 0; i < localStorage.length; i++) {
            if (/webdashboard-layout:/.test(localStorage.key(i))) {
                layoutNames.push(localStorage.key(i).replace(/webdashboard-layout:/, ""));
            }
        }
        return layoutNames;
    },

    removeLayout: function (key) {
        try {
            if (key !== "webdashboard-layout:default") {
                localStorage.removeItem(key);
            }
        } catch {
            Notify.createNotice("Could not remove layout!  Try reloading the page.", "negative");
        }
    },

    safeDelete: function (event, key) {
        let popup = Popup.getPopupFromChild(event.target);
        Load.removeLayout(key);
        let buttons = Array.from(document.getElementById("open-layout").getElementsByClassName("layout-selectable"));
        buttons.forEach((button) => { if (button.innerHTML === key.replace(/webdashboard-layout:/, "")) { button.remove() } });
        Popup.closePopup(popup);
    },

    removeAllLayouts: function (event) {
        let layoutNames = Load.listLayoutNames();
        for (let i = 0; i < layoutNames.length; i++) {
            Load.removeLayout(`webdashboard-layout:${layoutNames[i]}`);
        }
        Load.openJSONLayout("webdashboard-layout:default");
        Load.clearLayout();
        Whiteboard.States.clearTimeline();
        Load.defaultSave(notify = false);
        Popup.closePopup(Popup.getPopupFromChild(event.target));
    },

    updateCurrentLayout: function (name) {
        Load.currentLayout = name;
        let layoutLabel = document.getElementById("layout-name");
        if (Load.currentLayout === "default") {
            layoutLabel.innerHTML = "default layout";
        } else {
            layoutLabel.innerHTML = `layout: ${Load.currentLayout}`;
        }
    },

    getLayoutJSONString: function () {
        let data = {};
        let draggableData = Whiteboard.draggableRegistry;
        data.draggableData = draggableData;
        let border = document.getElementById("whiteboard-border");
        data.border = { "width": border.style.width, "height": border.style.height };
        data = JSON.stringify(data);
        return data;
    },

    getDraggableName: function (draggable) {
        let name = draggable.label.value;
        draggable.setName(name);
        return name;
    },

    saveJSON: function (event) {
        let popup = Popup.getPopupFromChild(event.target);
        for (let i = 0; i < Whiteboard.draggableRegistry.length; i++) {
            Load.getDraggableName(Whiteboard.draggableRegistry[i]);
        }
        let name = popup.getElementsByClassName("popup-input")[0].value;
        Load.updateCurrentLayout(name);
        localStorage.setItem("webdashboard-layout:" + name, Load.getLayoutJSONString());
        Load.handleNotDefaultBtns(name);
        Popup.closePopup(popup);
    },

    defaultSave: function (notify = true) {
        for (let i = 0; i < Whiteboard.draggableRegistry.length; i++) {
            Load.getDraggableName(Whiteboard.draggableRegistry[i]);
        }
        localStorage.setItem(`webdashboard-layout:${Load.currentLayout}`, Load.getLayoutJSONString());
        if (notify) Notify.createNotice("Layout saved!", "positive", 3000);
    },

    newLayout: function () {
        Load.defaultSave();
        let counter = 0;
        let layoutNames = Load.listLayoutNames();
        for (let i = 0; i < layoutNames.length; i++) {
            let match = layoutNames[i].match(/untitled[0-9]*/);
            if (match == null) match = [];
            if (match.length == 1) {
                layoutNumber = Number(match[0].replace(/untitled/, "")); // See https://stackoverflow.com/questions/32978852/is-javascript-new-keyword-optional-for-javascript-api-feature
                if (layoutNumber > counter) {
                    counter = layoutNumber;
                }
            }
        }
        let name = `webdashboard-layout:untitled${counter + 1}`;
        localStorage.setItem(name, "");
        Load.openJSONLayout(name);
    },

    displayLayouts: function () {
        let popup = document.getElementById("open-layout");
        let listContainer = document.getElementById("select-json-container");
        listContainer.innerHTML = "";
        let layoutNames = Load.listLayoutNames();
        Popup.populatePopupClickableList(document.getElementById("select-json-container"), layoutNames, (name) => name, (name) => {
            return () => {
                Load.openJSONLayout(`webdashboard-layout:${name}`); Popup.closePopup(popup);
            }
        }, "layout-selectable default-selectable " + WhiteboardSettings.Themes.selectedTheme.defaultSelectable);
    },

    getLayoutJSON: function () {
        let data = {};
        let draggableData = [];
        Whiteboard.draggableRegistry.forEach((draggable) => draggableData.push(draggable.getShallowCopy()));
        data.draggableData = draggableData;
        let border = document.getElementById("whiteboard-border");
        data.border = { "width": border.style.width, "height": border.style.height };
        data.name = Load.currentLayout;
        return data;
    },

    getLayoutJSONString: function () {
        return JSON.stringify(Load.getLayoutJSON());
    },

    loadSettings: function () {
        let settings = JSON.parse(localStorage.getItem("webdashboard-settings"));
        Object.assign(WhiteboardSettings, settings);
    },

    handleNotDefaultBtns: function (key) {
        let notDefaultBtns = Array.from(document.getElementsByClassName("not-default"));
        if (key.replace(/webdashboard-layout:/, "") === "default") {
            notDefaultBtns.forEach((button) => button.style.display = "none");
        } else {
            notDefaultBtns.forEach((button) => button.style.display = "block");
        }
    },

    openJSONLayout: function (key) {
        Load.handleNotDefaultBtns(key);
        Load.updateCurrentLayout(key.replace(/webdashboard-layout:/, ""));
        Load.clearLayout(logChange = false);
        try {
            let data = localStorage.getItem(key);
            Load.openJSON(data);
        } catch (err) {
            console.warn(err);
            Notify.createNotice("Could not open layout!", "negative", 5000);
        }
    },


    openJSON: function (json) {
        Load.clearLayout(logChange = false);
        if (json === "") return;
        json = JSON.parse(json);

        let border = document.getElementById("whiteboard-border");

        if (json.border.width != null) border.style.width = json.border.width;
        if (json.border.height != null) border.style.height = json.border.height;

        for (let i = 0; i < json.draggableData.length; i++) {
            let name = json.draggableData[i].name;
            let position = new Positioning.Vector2d(json.draggableData[i].position.x, json.draggableData[i].position.y);
            let size = json.draggableData[i].size;
            let color = json.draggableData[i].color;
            let layer = json.draggableData[i].layer;
            let type = json.draggableData[i].type;
            let id = json.draggableData[i].id;
            let state = json.draggableData[i].state;
            let typeSpecificData = json.draggableData[i].typeSpecificData;
            Whiteboard.draggableRegistry.push(new Whiteboard.WhiteboardDraggable(name, position, size, color, layer, type, id, state, typeSpecificData));
        }
    },

    exportJSON: function (key) {
        let data;
        if (key === "webdashboard-layout:default") {
            data = Load.getLayoutJSONString();
        } else {
            data = localStorage.getItem(key);
        }
        try {
            navigator.clipboard.writeText(data);
            Notify.createNotice("Copied layout JSON to clipboard", "positive", 3000);
        } catch {
            Notify.createNotice("Could not export layout JSON", "negative", 3000);
        }
    },

    importJSON: function (event) {
        Load.defaultSave(false);
        let popup = Popup.getPopupFromChild(event.target);
        let name = document.getElementById("import-layout-name").getElementsByClassName("popup-input")[0].value;
        if (name === "") {
            Notify.createNotice("Illegal layout name", "negative", 3000);
            return;
        }
        let json = document.getElementById("import-layout-json").getElementsByClassName("popup-input")[0].value;
        localStorage.setItem(`webdashboard-layout:${name}`, json);
        try {
            Load.openJSON(json);
            Load.updateCurrentLayout(name);
        } catch {
            Notify.createNotice("Could not open layout - Invalid JSON", "negative", 3000);
        }
        Popup.closePopup(popup);
    },


    setAsDefault: function (key) {
        try {
            let data = localStorage.getItem(key);
            localStorage.setItem("webdashboard-layout:default", data);
            Whiteboard.logChange();
            if (Load.currentLayout == "default") {
                Load.openJSONLayout("webdashboard-layout:default");
            }
            Notify.createNotice("Set the current layout as default", "positive", 3000);
        } catch (err) {
            console.log(err);
            Notify.createNotice("Could not set as default!", "negative", 3000);
        }
    },

    clearLayout: function (logChange = true) {
        if (logChange) Whiteboard.logChange();
        iterations = Whiteboard.draggableRegistry.length; //must be set here, because calling delete() continually updates Draggable.draggableRegistry.length
        for (let i = 0; i < iterations; i++) {
            Whiteboard.draggableRegistry[0].delete(); //Every time delete() is called, a new draggable will fall into the 0 slot in the array
        }
        let border = document.getElementById("whiteboard-border");
        border.style.removeProperty("width");
        border.style.removeProperty("height");
    },

    layoutChanged: function () {
        return Load.getLayoutJSONString() !== localStorage.getItem(`webdashboard-layout:${Load.currentLayout}`);
    },

    targetLayout: "",
};

window.Load = Load || {};