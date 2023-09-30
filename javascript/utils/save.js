var Save = {
    listLayoutNames: function () {
        layoutNames = [];
        for (let i = 0; i < localStorage.length; i++) {
            if (/webdashboard:/.test(localStorage.key(i))) {
                layoutNames.push(localStorage.key(i).replace(/webdashboard:/, ""));
            }
        }
        return layoutNames;
    },

    removeLayout: function (key) {
        try {
            if (key !== "default") {
                localStorage.removeItem("webdashboard:" + key);
            }
        } catch {
            Notify.createNotice("Could not remove layout!  Try reloading the page.", "negative");
        }
    },
    
    
    removeAllLayouts: function () {
        let layoutNames = Save.listLayoutNames();
        for (let i = 0; i < layoutNames.length; i++) {
            Save.removeLayout(layoutNames[i]);
        }
        Save.openJSONLayout("webdashboard:default");
        Save.clearLayout();
        Whiteboard.States.clearTimeline();
        Save.defaultSave();
        Popup.clickCloseBtn();
    },

    updateCurrentLayout: function (name) {
        currentLayout = name;
        let layoutLabel = document.getElementById("layout-name");
        if (currentLayout === "default") {
            layoutLabel.innerHTML = "default layout";
        } else {
            layoutLabel.innerHTML = `layout: ${currentLayout}`;
        }
    },

    getJSON: function () {
        let data = {};
        let draggableData = Whiteboard.draggables;
        data.draggableData = draggableData;
        let border = document.getElementById("whiteboard-border");
        data.border = {"width": border.style.width, "height": border.style.height};
        data = JSON.stringify(data);
        return data;
    },
    
    getDraggableName: function (draggable) {
        let name = draggable.label.value;
        draggable.setName(name);
        return name;
    },
    
    saveJSON: function () {
        for (let i = 0; i < Whiteboard.draggables.length; i++) {
            Save.getDraggableName(Whiteboard.draggables[i]);
        }
        let name = Popup.activePopup.getElementsByClassName("popup-input")[0].value;
        Save.updateCurrentLayout(name);    
        localStorage.setItem("webdashboard:" + name, Save.getJSON());
        Popup.clickCloseBtn();
    },

    defaultSave: function () {
        for (let i = 0; i < Whiteboard.draggables.length; i++) {
            Save.getDraggableName(Whiteboard.draggables[i]);
        }
        localStorage.setItem(`webdashboard:${currentLayout}`, Save.getJSON())
    },

    selectJSON: function (event) {
        Popup.activePopup = Popup.getPopupByOpener(event.target);
        let thisPopup = Popup.activePopup;
        let carousel = Popup.activePopup.getElementsByClassName("list-container")[0];
        carousel.innerHTML = "";
        let layoutNames = Save.listLayoutNames();
        for (let i = 0; i < layoutNames.length; i++) {
            let a = document.createElement("a");
            a.setAttribute("class", "default-text carousel-item selectable layout-selector-button");
            a.innerHTML = layoutNames[i];
            a.onclick = () => {Save.openJSONLayout(`webdashboard:${a.innerHTML}`); Popup.closePopupByCloser(thisPopup.getElementsByClassName("close")[0])};
            carousel.appendChild(a);
        }
    },

    getJSON: function () {
        let data = {};
        let draggableData = Whiteboard.draggables;
        data.draggableData = draggableData;
        let border = document.getElementById("whiteboard-border");
        data.border = {"width": border.style.width, "height": border.style.height};
        data = JSON.stringify(data);
        return data;
    },

    openJSONLayout: function (key) {
        Save.updateCurrentLayout(key.replace(/webdashboard:/, ""));
        Popup.clickCloseBtn();
        Save.clearLayout(logChange=false);
        try {
            let data = localStorage.getItem(key);
            Save.openJSON(data);
        } catch (err) {
            console.warn(err);
            Notify.createNotice("Could not open layout!", "negative", 5000);
        }
    },
    
    
    openJSON: function(json) {
        Save.clearLayout(logChange=false);
        json = JSON.parse(json);

        let border = document.getElementById("whiteboard-border");

        if (json.border.width != null) border.style.width = json.border.width;
        if (json.border.height != null) border.style.height = json.border.height;

        for (let i = 0; i < json.draggableData.length; i++) {
            let name = json.draggableData[i].name;
            let position = new Positioning.Vector2d(json.draggableData[i].position.x, json.draggableData[i].position.y);
            let size = json.draggableData[i].size;
            let color = json.draggableData[i].color;
            let type = json.draggableData[i].type;
            let id = json.draggableData[i].id;
            Whiteboard.draggables.push(new Whiteboard.WhiteboardDraggable(name, position, size, color, type, id));
        }
    },

    clearLayout: function (logChange = true) {
        if (logChange) Whiteboard.logChange();
        iterations = Whiteboard.draggables.length; //must be set here, because calling delete() continually updates Draggable.draggables.length
        for (let i = 0; i < iterations; i++) {
            Whiteboard.draggables[0].delete(); //Every time delete() is called, a new draggable will fall into the 0 slot in the array
        }
        let border = document.getElementById("whiteboard-border");
        border.style.removeProperty("width");
        border.style.removeProperty("height");
    }
};

window.Save = Save || {};