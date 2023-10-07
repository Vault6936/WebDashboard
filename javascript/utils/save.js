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
    
    
    removeAllLayouts: function (event) {
        let layoutNames = Save.listLayoutNames();
        for (let i = 0; i < layoutNames.length; i++) {
            Save.removeLayout(layoutNames[i]);
        }
        Save.openJSONLayout("webdashboard:default");
        Save.clearLayout();
        Whiteboard.States.clearTimeline();
        Save.defaultSave(notify=false);
        Popup.closePopup(Popup.getPopupFromChild(event.target));
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
    
    saveJSON: function (event) {
        let popup = Popup.getPopupFromChild(event.target);
        for (let i = 0; i < Whiteboard.draggables.length; i++) {
            Save.getDraggableName(Whiteboard.draggables[i]);
        }
        let name = popup.getElementsByClassName("popup-input")[0].value;
        Save.updateCurrentLayout(name);    
        localStorage.setItem("webdashboard:" + name, Save.getJSON());
        Popup.closePopup(popup);
    },

    defaultSave: function (notify=true) {
        for (let i = 0; i < Whiteboard.draggables.length; i++) {
            Save.getDraggableName(Whiteboard.draggables[i]);
        }
        localStorage.setItem(`webdashboard:${currentLayout}`, Save.getJSON());
        if (notify) Notify.createNotice("Layout saved!", "positive", 3000);
    },

    selectJSON: function (event) {
        let popup = Popup.getPopupByOpener(event.target);
        console.log(popup);
        let listContainer = document.getElementById("select-json-container");
        listContainer.innerHTML = "";
        let layoutNames = Save.listLayoutNames();
        Popup.populatePopupClickableList(document.getElementById("select-json-container"), layoutNames, (name) => name, (name, self) => {return () => {
                Save.openJSONLayout(`webdashboard:${self.innerHTML}`); Popup.closePopup(popup);
            }
        });
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

    clearLayout: function (logChange=true) {
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