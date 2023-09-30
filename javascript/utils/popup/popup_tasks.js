var PopupTasks = {
    changeID: function () {
        Whiteboard.logChange();
        let id = Popup.activePopup.getElementsByClassName("popup-input")[0].value;
        Whiteboard.currentDraggable.setId(id);
        Popup.clickCloseBtn();
    },

    changeColor: function () {
        Whiteboard.logChange();
        let color = Popup.activePopup.getElementsByClassName("popup-input")[0].value;
        Whiteboard.currentDraggable.setColor(color);
        Popup.clickCloseBtn();
    },

    setDraggableSize: function () {
        Whiteboard.logChange();
        let size = Popup.activePopup.getElementsByClassName("popup-input")[0].value;
        size = size.split(/[Xx]/);
        width = parseInt(size[0]);
        height = parseInt(size[1]);
        Whiteboard.currentDraggable.setSize(new Positioning.Vector2d(width, height));
        Popup.clickCloseBtn();
    },

    setType: function (type) {
        Whiteboard.logChange();
        Whiteboard.currentDraggable.setType(type);
        Popup.clickCloseBtn();
    },

    setWhiteBoardBorderSize: function () {
        Whiteboard.logChange();
        let size = Popup.activePopup.getElementsByClassName("popup-input")[0].value;
        size = size.split(/[Xx]/);
        let border = document.getElementById("whiteboard-border");
        border.style.width = Positioning.toHTMLPositionPX(size[0]);
        border.style.height = Positioning.toHTMLPositionPX(size[1]);
        Popup.clickCloseBtn();    
    },

    renameLayout: function () {
        let toBeRenamed = Popup.selected.innerHTML;
        let name = Popup.activePopup.getElementsByClassName("popup-input")[0].value;
        try {
            let layoutNames = listLayoutNames();
            let duplicateName = false;
            for (let i = 0; i < layoutNames.length; i++) {
                if (layoutNames[i] === name) {
                    duplicateName = true;
                }
            }
            if (duplicateName) {
                Notify.createNotice("That layout name already exists!", "negative", 2500);
            } else {
                if (currentLayout === toBeRenamed) {
                    updateCurrentLayout(name);
                }
                data = localStorage.getItem("webdashboard:" + toBeRenamed);
                localStorage.removeItem("webdashboard:" + toBeRenamed);
                localStorage.setItem("webdashboard:" + name, data);
                Popup.selected.innerHTML = name;
            }

        } catch(err) {
            console.log(err);
            Notify.createNotice("Could not rename layout!  Try reloading the page.", "negative", 2500);
        }
        Popup.clickCloseBtn(); 
    },
};

window.PopupTasks = PopupTasks || {};