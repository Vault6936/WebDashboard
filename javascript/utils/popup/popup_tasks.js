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

    setPosition: function (event) {
        Whiteboard.logChange();
        let popup = Popup.getPopupFromChild(event.target);
        const x = parseInt(document.getElementById("x-pose-input").getElementsByClassName("popup-input")[0].value);
        const y = parseInt(document.getElementById("y-pose-input").getElementsByClassName("popup-input")[0].value);
        Whiteboard.currentDraggable.setPosition(new Positioning.Vector2d(x, y));
        Popup.closePopup(popup);
    },

    setType: function (type) {
        Whiteboard.logChange();
        Whiteboard.currentDraggable.configureType(type);
        Popup.closePopup(document.getElementById("type-setter"));
    },

    defineSelectables: function (event) {
        Whiteboard.logChange();
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
        Whiteboard.logChange();
        let popup = Popup.getPopupFromChild(event.target);
        let url = popup.getElementsByClassName("popup-input")[0].value;
        Whiteboard.currentDraggable.setStreamURL(url);
        Popup.closePopup(popup);
    },

    setStreamSize: function (event) {
        Whiteboard.logChange();
        let popup = Popup.getPopupFromChild(event.target);
        let size = popup.getElementsByClassName("popup-input")[0].value;
        size = size.split(/[Xx]/);
        width = parseInt(size[0]);
        height = parseInt(size[1]);
        Whiteboard.currentDraggable.setStreamSize(new Positioning.Vector2d(width, height));
        Popup.closePopup(popup);
    },

    setFontSize: function(event) {
        Whiteboard.logChange();
        let popup = Popup.getPopupFromChild(event.target);
        let size = popup.getElementsByClassName("popup-input")[0].value;
        Whiteboard.currentDraggable.setFontSize(size);
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
        let toBeRenamed;
        if (Popup.selected == null) {
            toBeRenamed = Load.currentLayout;
        } else {
            toBeRenamed = Popup.selected.innerHTML;
        }
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

        } catch (err) {
            console.log(err);
            Notify.createNotice("Could not rename layout!  Try reloading the page.", "negative", 2500);
        }
        Popup.closePopup(popup);
    },

    populatePositionInfo: function() {
        Popup.getInput("x-pose-input").value = Whiteboard.currentDraggable.configuration.position.x;
        Popup.getInput("y-pose-input").value = Whiteboard.currentDraggable.configuration.position.y;
    },

    populatePathPointInfo: function() {
        let pathPoint = Whiteboard.currentPathPoint;
        Popup.getInput("path-point-x").value = pathPoint.fieldVector.x;
        Popup.getInput("path-point-y").value = pathPoint.fieldVector.y;
        Popup.getInput("path-point-radius").value = pathPoint.followRadius;
        if (pathPoint.targetFollowRotation == null) {
            Popup.getInput("target-follow-rotation").value = "NaN";
        } else { 
            Popup.getInput("target-follow-rotation").value = pathPoint.targetFollowRotation * 180 / 3.14159
        };
        if (pathPoint.targetEndRotation == null) {
            Popup.getInput("target-end-rotation").value = "NaN";
        } else { 
            Popup.getInput("target-end-rotation").value = pathPoint.targetEndRotation * 180 / 3.14159
        };
        Popup.getInput("max-velocity").value = pathPoint.maxVelocity;
    },

    populatePathTimeout() {
        if (Whiteboard.currentDraggable.configuration.followTimeout != undefined)  {
            document.getElementById("path-timeout-setter").getElementsByClassName("popup-input")[0].value = Whiteboard.currentDraggable.configuration.followTimeout;
        }
    },

    setPathTimeout() {
        let popup = Popup.getPopupFromChild(event.target);
        let timeout = popup.getElementsByClassName("popup-input")[0].value;
        Whiteboard.currentDraggable.configuration.followTimeout = timeout;
        Popup.closePopup(popup);
    },

    configurePathPoint: function(event) {
        Whiteboard.logChange();
        let popup = Popup.getPopupFromChild(event.target);
        let pathPoint = Whiteboard.currentPathPoint;
        let x = parseFloat(Popup.getInput("path-point-x").value);
        let y = parseFloat(Popup.getInput("path-point-y").value);
        let radius = parseFloat(Popup.getInput("path-point-radius").value);
        let targetFollowRotation = parseFloat(Popup.getInput("target-follow-rotation").value);
        if (targetFollowRotation == undefined) {
            targetFollowRotation = null;
        }
        let targetEndRotation = parseFloat(Popup.getInput("target-end-rotation").value);
        if (targetEndRotation == undefined) {
            targetEndRotation = null;
        }
        let maxVelocity = parseFloat(Popup.getInput("max-velocity").value);
        pathPoint.followRadius = radius;
        pathPoint.targetFollowRotation = targetFollowRotation / 180 * 3.14159;
        pathPoint.targetEndRotation = targetEndRotation / 180 * 3.14159;
        pathPoint.maxVelocity = maxVelocity;
        pathPoint.setFieldPosition(new Positioning.Vector2d(x, y));
        Popup.closePopup(popup);
    }

}

window.PopupTasks = PopupTasks || {};