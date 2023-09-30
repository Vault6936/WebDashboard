var socket;


function openSocket(recursion) {
    if (recursion == 0 || recursion == undefined) {
        recursion = 0;
        Notify.createNotice("Attempting to connect to the RoboRio...", "neutral", 3000);
    }
    socket = new WebSocket(websocketURL);
    socket.onopen = () => Notify.createNotice("Connected to the RoboRio!", "positive", 8000);
    socket.onmessage = (event) => {Notify.createNotice("Received message from the RoboRio!", "positive", 8000); applyDataToDraggable(event.data)};
    if (recursion < 1) {
        socket.onerror = () => {Notify.createNotice("Could not connect to the RoboRio!", "negative", 8000); openSocket(recursion + 1)};
    } else {
        socket.onerror = () => {openSocket(recursion + 1)}
    }
}

function applyDataToDraggable(data) {
    data = JSON.parse(data);
    try {
        Whiteboard.getDraggableById(data.id).handleDataFromRio(data);
    } catch {
        Notify.createNotice("Could not apply message from Rio", "negative", 3000);
    }
}

class Settings { //TODO: At some point this needs to get moved to its own namespace.  Saving functionality should also be added.
    constructor(websocketURL) {
        this.websocketURL = websocketURL;
    }
}

var defaultSettings = new Settings("ws://10.69.36.2:5800");

var currentSettings = defaultSettings;

var websocketURL = "ws://10.69.36.2:5800";
var currentLayout = "default";
var isFullScreen = false;


function inFullScreen() {
    return Math.abs(outerWidth-screen.width) < 5 && Math.abs(outerHeight - screen.height) < 5;    
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
    addMasterEventListeners();

    Popup.generateSimpleInputPopup("layout-renamer", PopupTasks.renameLayout, "Enter the new layout name", "rename layout", false);
    Popup.generateSimpleInputPopup("whiteboard-size-setter", PopupTasks.setWhiteBoardBorderSize, "750x500", "border size", false);
    Popup.generateSimpleInputPopup("size-picker", PopupTasks.setDraggableSize, "100x100", "draggable size", false);
    Popup.generateSimpleInputPopup("color-picker", PopupTasks.changeColor, "#ffffff", "draggable color", false);
    Popup.populatePopupList(document.getElementById("type-setter"), ["button", "toggle", "boolean telemetry", "text telemetry"], (iterable) => iterable, (iterable) => {return () => PopupTasks.setType(iterable)});

    if (!Save.listLayoutNames().includes("default")) {
        Save.defaultSave();
        console.warn("It looks like this is your first time using the Vault 6936 Web Dashboard in this browser.  Welcome!");
        setTimeout(() => Notify.createNotice("Welcome :)", "positive", 5000), 1000);
    }

    openSocket();
    Popup.initializePopups();
}

function addMasterEventListeners() {
    addEventListener("keydown", (event) => {
        if (event.key == "Enter") {
            try {
                Popup.activePopup.getElementsByClassName("apply")[0].click();
            } catch {}
        } else if (event.key == "s" && (event.ctrlKey || event.metaKey)) { //meta key is for MacOS
              event.preventDefault();
              Save.defaultSave();
              Notify.createNotice("Layout saved!", "positive", 3000);
        }
    });
    addEventListener("mousemove", (event) => {Positioning.mousePosition = new Positioning.Vector2d(event.clientX, event.clientY)});
    oncontextmenu = (event) => generateContextMenu(event), false;
    onmousedown = (event) => removeMenu(event);

    Save.openJSONLayout("webdashboard:default");
}

function getBorderWidth(element) {
    return element.offsetWidth - element.clientWidth;
}

function toggleEditingMode() {
    var editingToggle = document.getElementById("editingToggle");
    var labels = document.getElementsByClassName("whiteboard-label");
    var border = document.getElementById("whiteboard-border");
    if (Whiteboard.elementEditing) {
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
    Whiteboard.elementEditing = !Whiteboard.elementEditing;
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
        Whiteboard.currentDraggableDiv = event.target;
        Whiteboard.currentDraggable = Whiteboard.draggables[Whiteboard.getDraggableIndex(event.target)];
        if (Whiteboard.elementEditing) {
            generateContextMenuButton(container, "remove", () => {if (Whiteboard.elementEditing) {Whiteboard.logChange(); Whiteboard.draggables[event.target.getAttribute("index")].delete()}});
            generateContextMenuButton(container, "set id", () => document.getElementById("open-id-changer").click());
            generateContextMenuButton(container, "set color", () => document.getElementById("open-color-picker").click());
            generateContextMenuButton(container, "set size", () => document.getElementById("open-size-picker").click());
            generateContextMenuButton(container, "set element type", () => document.getElementById("open-type-setter").click());
            generateContextMenuButton(container, "duplicate", () => Whiteboard.duplicate(Whiteboard.draggables[Whiteboard.getDraggableIndex(Whiteboard.currentDraggableDiv)]));
        }    
    } else if (event.target.id == "whiteboard-border") {
        generateContextMenuButton(container, "set whiteboard size", () => {Popup.openPopupByOpenerId("open-whiteboard-size-setter")});
    } else if (event.target.classList.contains("selectable")) {
        Popup.selected = event.target;
        if (event.target.classList.contains("layout-selector-button")) {
            if (event.target.innerHTML !== "default") {
                generateContextMenuButton(container, "delete", () => {Save.removeLayout(Popup.selected.innerHTML); Popup.selected.remove()});
                generateContextMenuButton(container, "rename", () => {Popup.openPopupByOpenerId("open-layout-renamer")});
            }
        }
    }
    document.body.appendChild(container);
}

function saveSettings() {
    websocketURL = document.getElementById("websocketURL").value;
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
    if (Whiteboard.elementEditing) toggleEditingMode();
    isFullScreen = true;
    document.getElementById("menu").style.display = "none";
    Notify.createNotice("Press f11 to exit full screen", "neutral", 4000);
}

function exitFullScreen() {
    isFullScreen = false;
    document.getElementById("menu").style.display = "block";
}