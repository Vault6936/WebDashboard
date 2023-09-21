var socket;


function openSocket(recursion) {
    if (recursion == 0 || recursion == undefined) {
        recursion = 0;
        window.Notify.createNotice("Attempting to connect to the RoboRio...", "neutral", 3000);
    }
    socket = new WebSocket(websocketURL);
    socket.onopen = () => window.Notify.createNotice("Connected to the RoboRio!", "positive", 8000);
    if (recursion < 1) {
        socket.onerror = () => {window.Notify.createNotice("Could not connect to the RoboRio!", "negative", 8000); openSocket(recursion + 1)};
    } else {
        socket.onerror = () => {openSocket(recursion + 1)}
    }
}

class Settings {
    constructor(websocketURL) {
        this.websocketURL = websocketURL;
    }
}

var defaultSettings = new Settings("ws://10.69.36.2:5800");

var currentSettings = defaultSettings;

class DraggableChange {
    constructor(draggable) {
        changes.push(this);
        changes.splice(0, 1);
    }
}

var changes = []

var elementEditing = false;
var websocketURL = "ws://10.69.36.2:5800";
var currentLayout = "default";
var isFullScreen = false;


function inFullScreen() {
    return Math.abs(window.outerWidth-screen.width) < 5 && Math.abs(window.outerHeight - screen.height) < 5;    
}

window.CustomEventChecker.addEventChecker(new window.CustomEventChecker.EventChecker("enterfullscreen", inFullScreen, window));
window.CustomEventChecker.addEventChecker(new window.CustomEventChecker.EventChecker("exitfullscreen", () => {return !inFullScreen()}, window));

window.addEventListener("enterfullscreen", enterFullScreen);
window.addEventListener("exitfullscreen", exitFullScreen);

function initialize() { //This is called when the body portion of the html document loads
    addMasterEventListeners();

    window.Popup.generateSimpleInputPopup("whiteboard-size-setter", window.PopupTasks.setWhiteBoardBorderSize, "750x500", "border size", false);
    window.Popup.generateSimpleInputPopup("size-picker", window.PopupTasks.setDraggableSize, "100x100", "draggable size", false);
    window.Popup.generateSimpleInputPopup("color-picker", window.PopupTasks.changeColor, "#ffffff", "draggable color", false);
    window.Popup.populatePopupList(document.getElementById("type-setter"), ["button", "toggle", "boolean telemetry", "text telemetry"], (iterable) => iterable, (iterable) => {return () => window.PopupTasks.setType(iterable)});

    if (!listLayoutNames().includes("default")) {
        defaultSave();
        console.warn("It looks like this is your first time using the Vault 6936 Web Dashboard in this browser.  Welcome!");
    }

    openSocket();
    window.Popup.initializePopups();
}

function addMasterEventListeners() {
    window.addEventListener("keydown", (event) => {
        if (event.key == "Enter") {
            try {
                window.Popup.activePopup.getElementsByClassName("apply")[0].click();
            } catch {}
        } else if (event.key == "s" && (event.ctrlKey || event.metaKey)) { //meta key is for MacOS
              event.preventDefault();
              defaultSave();
              window.Notify.createNotice("Layout saved!", "positive", 3000);
        }
    });
    window.addEventListener("mousemove", (event) => {window.Positioning.mousePosition = new window.Positioning.Vector2d(event.clientX, event.clientY)});
    window.oncontextmenu = (event) => generateContextMenu(event), false;
    window.onmousedown = (event) => removeMenu(event);

    openJSON("webdashboard:default");
}

function getBorderWidth(element) {
    return element.offsetWidth - element.clientWidth;
}

function toggleEditingMode() {
    var editingToggle = document.getElementById("editingToggle");
    var labels = document.getElementsByClassName("whiteboard-label");
    var border = document.getElementById("whiteboard-border");
    if (elementEditing) {
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
    elementEditing = !elementEditing;
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
    container.style = "left: " + window.Positioning.mousePosition.x + "px; top: " + window.Positioning.mousePosition.y + "px";
    if (event.target.classList.contains("whiteboard-draggable")) {
        window.Draggable.currentDraggable = event.target;
        if (elementEditing) {
            generateContextMenuButton(container, "remove", () => {if (elementEditing) window.Draggable.draggables[event.target.getAttribute("index")].delete()});
            generateContextMenuButton(container, "set id", () => document.getElementById("open-id-changer").click());
            generateContextMenuButton(container, "set color", () => document.getElementById("open-color-picker").click());
            generateContextMenuButton(container, "set size", () => document.getElementById("open-size-picker").click());
            generateContextMenuButton(container, "set element type", () => document.getElementById("open-type-setter").click());
            generateContextMenuButton(container, "duplicate", () => window.Draggable.duplicate(window.Draggable.draggables[window.Draggable.getDraggableIndex(window.Draggable.currentDraggable)]));
        }    
    } else if (event.target.id == "whiteboard-border") {
        generateContextMenuButton(container, "set whiteboard size", () => document.getElementById("open-whiteboard-size-setter").click());
    } else if (event.target.classList.contains("layout-selector-button")) {
        if (event.target.innerHTML !== "default") {
            generateContextMenuButton(container, "delete", () => {removeLayout(event.target.innerHTML); event.target.remove()});
        }
    }
    document.body.appendChild(container);
}


function saveSettings() {
    websocketURL = document.getElementById("websocketURL").value;
    window.Popup.clickCloseBtn();

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
    if (elementEditing) toggleEditingMode();
    isFullScreen = true;
    document.getElementById("menu").style.display = "none";
    window.Notify.createNotice("Press f11 to exit full screen", "neutral", 4000);
}

function exitFullScreen() {
    isFullScreen = false;
    document.getElementById("menu").style.display = "block";
}

function listLayoutNames() {
    layoutNames = [];
    for (let i = 0; i < localStorage.length; i++) {
        if (/webdashboard:/.test(localStorage.key(i))) {
            layoutNames.push(localStorage.key(i).replace(/webdashboard:/, ""));
        }
    }
    return layoutNames;
}
function removeLayout(key) {
    try {
        if (key !== "default") {
            localStorage.removeItem("webdashboard:" + key);
        }
    } catch {
        let notice = new Notice("Could not remove layout!  Try reloading the page.", "negative");
    }
}
function removeAllLayouts() {
    let layoutNames = listLayoutNames();
    for (let i = 0; i < layoutNames.length; i++) {
        removeLayout(layoutNames[i]);
    }
    openJSON("webdashboard:default");
    clearLayout();
    defaultSave();
    window.Popup.clickCloseBtn();
}
function updateCurrentLayout(name) {
    currentLayout = name;
    let layoutLabel = document.getElementById("layout-name");
    if (currentLayout === "default") {
        layoutLabel.innerHTML = "default layout";
    } else {
        layoutLabel.innerHTML = `layout: ${currentLayout}`;
    }
}

function getJSON() {
    let data = {};
    let draggableData = window.Draggable.draggables;
    data.draggableData = draggableData;
    let border = document.getElementById("whiteboard-border");
    data.border = {"width": border.style.width, "height": border.style.height};
    data = JSON.stringify(data);
    return data;
}

function getDraggableName(draggable) {
    let name = draggable.label.value;
    draggable.setName(name);
    return name;
}

function saveJSON() {
    for (let i = 0; i < window.Draggable.draggables.length; i++) {
        getDraggableName(window.Draggable.draggables[i]);
    }
    let name = window.Popup.activePopup.getElementsByClassName("popup-input")[0].value;
    updateCurrentLayout(name);    
    localStorage.setItem("webdashboard:" + name, getJSON());
    window.Popup.clickCloseBtn();
}
function defaultSave() {
    for (let i = 0; i < window.Draggable.draggables.length; i++) {
        getDraggableName(window.Draggable.draggables[i]);
    }
    localStorage.setItem(`webdashboard:${currentLayout}`, getJSON())
}
function selectJSON(event) {
    window.Popup.activePopup = window.Popup.getPopupByOpener(event.target);
    let carousel = window.Popup.activePopup.getElementsByClassName("list-container")[0];
    carousel.innerHTML = "";
    let layoutNames = listLayoutNames();
    for (let i = 0; i < layoutNames.length; i++) {
        let a = document.createElement("a");
        a.setAttribute("class", "default-text carousel-item selectable layout-selector-button");
        a.innerHTML = layoutNames[i];
        a.onclick = (event) => openJSON(`webdashboard:${layoutNames[i]}`);
        carousel.appendChild(a);
    }
}
function clearLayout() {
    iterations = window.Draggable.draggables.length; //must be set here, because calling delete() continually updates window.Draggable.draggables.length
    for (let i = 0; i < iterations; i++) {
        window.Draggable.draggables[0].delete(); //Every time delete() is called, a new draggable will fall into the 0 slot in the array
    }
    let border = document.getElementById("whiteboard-border");
    border.style.removeProperty("width");
    border.style.removeProperty("height");
}

function openJSON(key) {
    updateCurrentLayout(key.replace(/webdashboard:/, ""));
    window.Popup.clickCloseBtn();
    clearLayout();
    try {
        let data = JSON.parse(localStorage.getItem(key));
        let border = document.getElementById("whiteboard-border");

        if (data.border.width != null) border.style.width = data.border.width;
        if (data.border.height != null) border.style.height = data.border.height;

        for (let i = 0; i < data.draggableData.length; i++) {
            let name = data.draggableData[i].name;
            let position = new window.Positioning.Vector2d(data.draggableData[i].position.x, data.draggableData[i].position.y);
            let size = data.draggableData[i].size;
            let color = data.draggableData[i].color;
            let type = data.draggableData[i].type;
            let id = data.draggableData[i].id;
            window.Draggable.draggables.push(new window.Draggable.WhiteboardDraggable(name, position, size, color, type, id));
        }
    } catch (err) {
        console.warn(err);
        window.Notify.createNotice("Could not open layout!", "negative", 5000);
    }
}

