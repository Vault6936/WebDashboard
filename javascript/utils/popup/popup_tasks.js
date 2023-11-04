var PopupTasks = {
    changeID: function (event) {
        Whiteboard.logChange();
        let popup = Popup.getPopupFromChild(event.target);
        let id = popup.getElementsByClassName("popup-input")[0].value;
        Whiteboard.currentDraggable.setId(id);
        Popup.closePopup(popup);
    },

    changeColor: function (event) {
        Whiteboard.logChange();
        let popup = Popup.getPopupFromChild(event.target);
        let color = popup.getElementsByClassName("popup-input")[0].value;
        Whiteboard.currentDraggable.setColor(color);
        Popup.closePopup(popup);
    },

    setDraggableSize: function (event) {
        Whiteboard.logChange();
        let popup = Popup.getPopupFromChild(event.target);
        let size = popup.getElementsByClassName("popup-input")[0].value;
        size = size.split(/[Xx]/);
        width = parseInt(size[0]);
        height = parseInt(size[1]);
        Whiteboard.currentDraggable.setSize(new Positioning.Vector2d(width, height));
        Popup.closePopup(popup);
    },

    setPosition: function(event) {
        Whiteboard.logChange();
        let popup = Popup.getPopupFromChild(event.target);
        const x = parseInt(document.getElementById("x-pose-input").getElementsByClassName("popup-input")[0].value);
        const y = parseInt(document.getElementById("y-pose-input").getElementsByClassName("popup-input")[0].value);
        Whiteboard.currentDraggable.setPosition(new Positioning.Vector2d(x, y));
        Popup.closePopup(popup);
    },

    setType: function (type) {
        Whiteboard.logChange();
        Whiteboard.currentDraggable.setType(type);
        Popup.closePopup(document.getElementById("type-setter"));
    },

    defineSelectables: function (event) {
        let popup = Popup.getPopupFromChild(event.target);
        let input = document.getElementById("draggable-selectable-field").value;
        try {
            let names = input.split(",");
            for (let i = 0; i < names.length; i++) {
                names[i] = names[i].trim();
                names[i] = names[i].replace(/[\n\r\t]/, "");
            }
            Whiteboard.currentDraggable.generateSelectorHTML(names);
            Popup.closePopup(popup);
        } catch {
            Notify.createNotice("Illegal input!", "negative", 3000);
        }
    },

    setStreamURL: function (event) {
        let popup = Popup.getPopupFromChild(event.target);
        let url = popup.getElementsByClassName("popup-input")[0];
        Whiteboard.currentDraggable.setStreamURL(url);
        Popup.closePopup(popup);
    },

    setWhiteBoardBorderSize: function (event) {
        Whiteboard.logChange();
        let popup = Popup.getPopupFromChild(event.target);
        let size = popup.getElementsByClassName("popup-input")[0].value;
        size = size.split(/[Xx]/);
        let border = document.getElementById("whiteboard-border");
        border.style.width = Positioning.toHTMLPositionPX(size[0]);
        border.style.height = Positioning.toHTMLPositionPX(size[1]);
        Popup.closePopup(popup);    
    },

    renameLayout: function (event) {
        let toBeRenamed = Popup.selected.innerHTML;
        let popup = Popup.getPopupFromChild(event.target);
        let name = popup.getElementsByClassName("popup-input")[0].value;
        try {
            let layoutNames = Load.listLayoutNames();
            let duplicateName = false;
            for (let i = 0; i < layoutNames.length; i++) {
                if (layoutNames[i] === name) {
                    duplicateName = true;
                }
            }
            if (duplicateName) {
                Notify.createNotice("That layout name already exists!", "negative", 2500);
                return;
            } else {
                if (Load.currentLayout === toBeRenamed) {
                    Load.updateCurrentLayout(name);
                }
                data = localStorage.getItem("webdashboard-layout:" + toBeRenamed);
                localStorage.removeItem("webdashboard-layout:" + toBeRenamed);
                localStorage.setItem("webdashboard-layout:" + name, data);
                Load.displayLayouts();
            }

        } catch(err) {
            console.log(err);
            Notify.createNotice("Could not rename layout!  Try reloading the page.", "negative", 2500);
        }
        Popup.closePopup(popup);
    },

}

window.PopupTasks = PopupTasks || {};