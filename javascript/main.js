var socket;
var connecting = false;

var clientID;

class Settings { //TODO: At some point this needs to get moved to its own namespace.  Saving functionality should also be added.
    constructor(websocketURL) {
        this.websocketURL = websocketURL;
    }
}

var defaultSettings = new Settings("ws://10.69.36.2:5800");

var currentSettings = defaultSettings;

var isFullScreen = false;


function inFullScreen() {
        const windowWidth = window.innerWidth * window.devicePixelRatio;
        const windowHeight = window.innerHeight * window.devicePixelRatio;
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;
        return ((windowWidth/screenWidth) >= 0.95) && ((windowHeight/screenHeight) >= 0.95);

}

function consoleOpen() {
    //Yeah, nothing has worked so far.  Not a huge priority at the moment however, so I'm leaving it empty.
}

CustomEventChecker.addEventChecker(new CustomEventChecker.EventChecker("enterfullscreen", inFullScreen, window));
CustomEventChecker.addEventChecker(new CustomEventChecker.EventChecker("exitfullscreen", () => {return !inFullScreen()}, window));
CustomEventChecker.addEventChecker(new CustomEventChecker.EventChecker("devtoolsopen", consoleOpen, window));

addEventListener("enterfullscreen", enterFullScreen);
addEventListener("exitfullscreen", exitFullScreen);
addEventListener("devtoolsopen", () => Notify.createNotice("Dev tools is open!", "neutral", 3000));

function initialize() { //This is called when the body portion of the html document loads

    addEventListener("beforeunload", function (event) {
        if (Load.getLayoutJSONString() !== localStorage.getItem(`webdashboard:${Load.currentLayout}`)) {
            event.preventDefault();
            return "Are you sure you want to leave the page?";
        }
    });

    Socket.initializeSocket();

    let banner = document.getElementById("banner-container");
    setTimeout(() => {banner.style.top = "-100%"; setTimeout(() => banner.style.display = "none", 2000)}, 500);
    addMasterEventListeners();

    Popup.generateSimpleInputPopup("Load-layout-as", Load.saveJSON, new Popup.PopupInput("Enter the new layout name", "Load as"));    
    Popup.generateSimpleInputPopup("layout-renamer", PopupTasks.renameLayout, new Popup.PopupInput("Enter the new layout name", "rename layout"));
    Popup.generateSimpleInputPopup("whiteboard-size-setter", PopupTasks.setWhiteBoardBorderSize, new Popup.PopupInput("750x500", "border size"));
    Popup.generateSimpleInputPopup("size-picker", PopupTasks.setDraggableSize, new Popup.PopupInput( "100x100", "draggable size"));
    Popup.generateSimpleInputPopup("color-picker", PopupTasks.changeColor, new Popup.PopupInput("#ffffff", "draggable color"));
    Popup.generateSimpleInputPopup("id-changer", PopupTasks.changeID, new Popup.PopupInput("Enter draggable id", "draggable id"));
    Popup.populatePopupClickableList(document.getElementById("select-type-container"), ["button", "toggle", "selector", "boolean telemetry", "text telemetry"], (iterable) => iterable, (iterable) => {return (event) => PopupTasks.setType(event, iterable)});
    
    Popup.populateVerticalInputs(document.getElementById("draggable-position-inputs"), new Popup.PopupInput("0", "x position", "x-pose-input"), new Popup.PopupInput("0", "y position", "y-pose-input"));
    Popup.populateVerticalInputs(document.getElementById("import-json-info"), new Popup.PopupInput("import", "layout name", "import-layout-name"), new Popup.PopupInput("", "layout JSON", "import-layout-json"));

    if (!Load.listLayoutNames().includes("default")) {
        Load.defaultSave();
        console.warn("It looks like this is your first time using the Vault 6936 Web Dashboard in this browser.  Welcome!");
        setTimeout(() => Notify.createNotice("Welcome :)", "positive", 5000), 3000);
    }

    Popup.initializePopups();
}

function addMasterEventListeners() {
    addEventListener("keydown", (event) => {
        if (event.key == "s" && (event.ctrlKey || event.metaKey)) { //meta key is for MacOS
              event.preventDefault();
              Load.defaultSave();
              Notify.createNotice("Layout saved!", "positive", 3000);
        }
    });
    addEventListener("mousemove", (event) => {Positioning.mousePosition = new Positioning.Vector2d(event.clientX, event.clientY)});
    oncontextmenu = (event) => generateContextMenu(event), false;
    onmousedown = (event) => removeMenu(event);

    Load.openJSONLayout("webdashboard:default");
}

function getBorderWidth(element) {
    return element.offsetWidth - element.clientWidth;
}

function toggleEditingMode() {
    var editingToggle = document.getElementById("editingToggle");
    var labels = document.getElementsByClassName("whiteboard-label");
    var border = document.getElementById("whiteboard-border");
    if (Whiteboard.editingMode) {
        border.style.display = "none";
        editingToggle.innerHTML = "turn on editing mode";
        for (var i = 0; i < labels.length; i++) {
            labels[i].readOnly = true;
        }
    } else {
        border.style.display = "block";
        editingToggle.innerHTML = "turn off editing mode";
        for (var i = 0; i < labels.length; i++) {
            labels[i].readOnly = false;
        }
    }
    Whiteboard.editingMode = !Whiteboard.editingMode;
}

function removeMenu(event) {
    try {
        if (event == null || event.target.className != "menu-button") { 
            document.getElementById("menu-container").remove();
        }
    } catch {

    }
}

function generateContextMenuButton(parent, name, onclick) {
    let button = document.createElement("a");
    button.innerHTML = name;
    button.onclick = function() {
        try {
            onclick(); 
        } finally {
            removeMenu();
        }
    };
    button.className = "menu-button";
    parent.appendChild(button);
}
function generateContextMenu(event) {
    removeMenu();
    event.preventDefault();
    let container = document.createElement("div");
    container.id = "menu-container";
    container.style = "left: " + Positioning.mousePosition.x + "px; top: " + Positioning.mousePosition.y + "px";
    if (event.target.classList.contains("whiteboard-draggable")) {
        let draggable = Whiteboard.draggables[Whiteboard.getDraggableIndex(event.target)]
        Whiteboard.currentDraggable = draggable;
        if (Whiteboard.editingMode) {
            generateContextMenuButton(container, "remove", () => {if (Whiteboard.editingMode) {Whiteboard.logChange(); Whiteboard.draggables[event.target.getAttribute("index")].delete()}});
            generateContextMenuButton(container, "set id", () => Popup.openPopup("id-changer"));
            if (draggable.type !== "toggle") generateContextMenuButton(container, "set color", () => Popup.openPopup("color-picker"));
            generateContextMenuButton(container, "set size", () => Popup.openPopup("size-picker"));
            generateContextMenuButton(container, "set position", () => Popup.openPopup("position-setter"));
            generateContextMenuButton(container, "set element type", () => Popup.openPopup("type-setter"));
            generateContextMenuButton(container, "duplicate", () => Whiteboard.duplicate(Whiteboard.draggables[Whiteboard.getDraggableIndex(Whiteboard.currentDraggable.div)]));
        }    
    } else if (event.target.id == "whiteboard-border") {
        generateContextMenuButton(container, "set whiteboard size", () => {Popup.openPopup("whiteboard-size-setter")});
    } else if (event.target.classList.contains("selectable")) {
        if (event.target.classList.contains("layout-selector-button")) {
            if (event.target.innerHTML !== "default") {
                generateContextMenuButton(container, "delete", () => {Load.removeLayout(event.target.innerHTML); event.target.remove()});
                generateContextMenuButton(container, "rename", () => {Popup.openPopup("layout-renamer")});
                generateContextMenuButton(container, "set as default", () => {Load.setAsDefault(event.target.innerHTML)});
            }
            generateContextMenuButton(container, "export json", () => {Load.exportJSON(`webdashboard:${event.target.innerHTML}`)});
        }
    }
    document.body.appendChild(container);
}

function saveSettings() {
    Socket.websocketURL = document.getElementById("Socket.websocketURL").value;
    Popup.clickCloseBtn();

}

function toggleFullScreen() {
    if (isFullScreen) {
        document.exitFullscreen();
        exitFullScreen();
    } else {
        document.documentElement.requestFullscreen();
        enterFullScreen();
    }
}

function enterFullScreen() {
    if (Whiteboard.editingMode) toggleEditingMode();
    isFullScreen = true;
    document.getElementById("menu").style.display = "none";
    Notify.createNotice("Press f11 to exit full screen", "neutral", 4000);
}

function exitFullScreen() {
    isFullScreen = false;
    document.getElementById("menu").style.display = "block";
}