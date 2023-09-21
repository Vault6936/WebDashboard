var PopupTasks = {
    changeID: function () {
        let id = window.Popup.activePopup.getElementsByClassName("popup-input")[0].value;
        draggables[window.Draggable.getDraggableIndex(window.Draggable.currentDraggable)].setId(id);
        window.Popup.clickCloseBtn();
    },

    changeColor: function () {
        let color = window.Popup.activePopup.getElementsByClassName("popup-input")[0].value;
        window.Draggable.currentDraggable.style.background = color;
        draggables[window.Draggable.currentDraggable.getAttribute("index")].color = color;
        window.Popup.clickCloseBtn();
    },

    setDraggableSize: function () {
        let size = window.Popup.activePopup.getElementsByClassName("popup-input")[0].value;
        size = size.split(/[Xx]/);
        width = parseInt(size[0]);
        height = parseInt(size[1]);
        draggables[window.Draggable.getDraggableIndex(window.Draggable.currentDraggable)].setSize(new window.Positioning.Vector2d(width, height));
        window.Popup.clickCloseBtn();
    },

    setType: function (type) {
        draggables[window.Draggable.getDraggableIndex(window.Draggable.currentDraggable)].setType(type);
        window.Popup.clickCloseBtn();
    },

    setWhiteBoardBorderSize: function () {
        let size = window.Popup.activePopup.getElementsByClassName("popup-input")[0].value;
        size = size.split(/[Xx]/);
        let border = document.getElementById("whiteboard-border");
        border.style.width = window.Positioning.toHTMLPositionPX(size[0]);
        border.style.height = window.Positioning.toHTMLPositionPX(size[1]);
        window.Popup.clickCloseBtn();    
    },
};

window.PopupTasks = PopupTasks || {};