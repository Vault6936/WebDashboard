var socket;
var connecting = false;

var clientID;

//var currentSettings = defaultSettings;

var isFullScreen = false;

window.onresize = function () {
    if (document.mozFullscreenElement) {
        console.log("hi");
    }
}

function inFullScreen() {
    const wiewport = window.visualViewport;
    const windowWidth = window.innerWidth * window.devicePixelRatio;
    const windowHeight = window.innerHeight * window.devicePixelRatio;
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    return ((windowWidth / screenWidth) >= 0.95) && ((windowHeight / screenHeight) >= 0.95);
}

function consoleOpen() {
    //Yeah, nothing has worked so far.  Not a huge priority at the moment however, so I'm leaving it empty.
}

function initialize() { //This is called when the body portion of the html document loads
    Load.loadSettings();

    if (!Load.listLayoutNames().includes("default")) {
        Load.defaultSave();
        console.warn("It looks like this is your first time using the Vault 6936 Web Dashboard in this browser.  Welcome!");
        setTimeout(() => Notify.createNotice("Welcome :)", "positive", 5000), 3000);
    }

    Socket.initializeSocket();

    let banner = document.getElementById("banner-container");
    setTimeout(() => { banner.style.top = "-200%"; setTimeout(() => banner.style.display = "none", 2000) }, 500);
    addEventListeners();

    Popup.generateSimpleInputPopup("Load-layout-as", Load.saveJSON, new Popup.PopupInput("Enter the new layout name", "Load as"));
    Popup.generateSimpleInputPopup("layout-renamer", PopupTasks.renameLayout, new Popup.PopupInput("Enter the new layout name", "rename layout"));
    Popup.generateSimpleInputPopup("whiteboard-size-setter", PopupTasks.setWhiteBoardBorderSize, new Popup.PopupInput("750x500", "border size"));
    Popup.generateSimpleInputPopup("size-picker", PopupTasks.setDraggableSize, new Popup.PopupInput("100x100", "draggable size"));
    Popup.generateSimpleInputPopup("color-picker", PopupTasks.changeColor, new Popup.PopupInput("#ffffff", "draggable color"));
    Popup.generateSimpleInputPopup("id-changer", PopupTasks.changeID, new Popup.PopupInput("Enter draggable id", "draggable id"));
    Popup.generateSimpleInputPopup("stream-url-setter", PopupTasks.setStreamURL, new Popup.PopupInput("http://roborio-TEAM-frc.local:1181/?action=stream", "set stream url", "stream-url-input"));
    Popup.generateSimpleInputPopup("stream-size-setter", PopupTasks.setStreamSize, new Popup.PopupInput("width x height", "stream size"));

    Popup.setOnOpen("stream-url-setter", () => Popup.getInput("stream-url-input").value = Whiteboard.currentDraggable.typeSpecificData.streamURL);

    let draggableTypes = [];
    Object.keys(Whiteboard.WhiteboardDraggable.Types).forEach((key) => draggableTypes.push(Whiteboard.WhiteboardDraggable.Types[key]));

    Popup.populatePopupClickableList(document.getElementById("select-type-container"), draggableTypes, (iterable) => iterable, (iterable) => { return () => PopupTasks.setType(iterable) });

    Popup.populateVerticalInputs(document.getElementById("websocket-info-wrapper"), new Popup.PopupInput("6936", "team number", "team-number"), new Popup.PopupInput("ws://10.xx.yy.2:5800", "websocket url", "websocket-url"));
    let themeWrapper = document.getElementById("theme-wrapper");
    let themes = [new Popup.Selectable("Mr. Blue", () => WhiteboardSettings.Themes.selectedTheme = WhiteboardSettings.Themes.MR_BLUE, null, null, true), new Popup.Selectable("Charcoal", () => WhiteboardSettings.Themes.selectedTheme = WhiteboardSettings.Themes.CHARCOAL, null, null, true), new Popup.Selectable("Snow", () => WhiteboardSettings.Themes.selectedTheme = WhiteboardSettings.Themes.LIGHT, null, null, true)];
    let group = new Popup.SelectableGroup();
    themes.forEach((theme) => group.add(theme));
    group.generateHTML(themeWrapper);

    Popup.populateVerticalInputs(document.getElementById("draggable-position-inputs"), new Popup.PopupInput("0", "x position", "x-pose-input"), new Popup.PopupInput("0", "y position", "y-pose-input"));
    Popup.populateVerticalInputs(document.getElementById("import-json-info"), new Popup.PopupInput("import", "layout name", "import-layout-name"), new Popup.PopupInput("", "layout JSON", "import-layout-json"));

    Popup.initializePopups();

    Load.openJSONLayout("webdashboard-layout:default");
    WhiteboardSettings.setTheme();
}

function addEventListeners() {
    addEventListener("keydown", (event) => {
        if ((event.ctrlKey || event.metaKey)) { //meta key is for MacOS
            if (event.key == "s") {
                event.preventDefault();
                Load.defaultSave();
                Notify.createNotice("Layout saved!", "positive", 3000);
            } else if (event.key == "z") {
                Whiteboard.undoChange();
            } else if (event.key == "y") {
                Whiteboard.redoChange();
            }
        }
    });
    addEventListener("mousemove", (event) => { Positioning.mousePosition = new Positioning.Vector2d(event.clientX, event.clientY) });
    oncontextmenu = (event) => generateContextMenu(event), false;
    onmousedown = (event) => removeMenu(event);
    onbeforeunload = () => { if (Load.layoutChanged()) return "Are you sure you want to leave the page?" };

    CustomEventChecker.addEventChecker(new CustomEventChecker.EventChecker("enterfullscreen", inFullScreen, window));
    CustomEventChecker.addEventChecker(new CustomEventChecker.EventChecker("exitfullscreen", () => { return !inFullScreen() }, window));
    CustomEventChecker.addEventChecker(new CustomEventChecker.EventChecker("devtoolsopen", consoleOpen, window));

    addEventListener("enterfullscreen", enterFullScreen);
    addEventListener("exitfullscreen", exitFullScreen);
    addEventListener("devtoolsopen", () => Notify.createNotice("Dev tools is open!", "neutral", 3000));
}

function getBorderWidth(element) {
    return element.offsetWidth - element.clientWidth;
}

function removeMenu(event) {
    try {
        if (event == null || !event.target.classList.contains("menu-button")) {
            document.getElementById("menu-container").remove();
        }
    } catch {

    }
}

function generateContextMenuButton(parent, name, onclick) {
    let anchor = document.createElement("a");
    anchor.innerHTML = name;
    anchor.onclick = function () {
        try {
            onclick();
        } finally {
            removeMenu();
        }
    };
    anchor.classList.add("menu-button", WhiteboardSettings.Themes.selectedTheme.menuBtn);
    parent.appendChild(anchor);
}

function generateContextMenu(event) {
    removeMenu();
    event.preventDefault();
    let whiteboard = document.getElementById("whiteboard");
    let container = document.createElement("div");
    container.id = "menu-container";
    let draggableElement = Whiteboard.getDraggableAncestor(event.target);
    if (draggableElement) {
        let draggable = Whiteboard.draggableRegistry[Whiteboard.getDraggableIndex(draggableElement)]
        Whiteboard.currentDraggable = draggable;
        if (Whiteboard.editingMode) {
            generateContextMenuButton(container, "remove", () => { if (Whiteboard.editingMode) { Whiteboard.logChange(); draggable.delete() } });
            generateContextMenuButton(container, "send to front", () => { Whiteboard.logChange(); draggable.setLayer(Whiteboard.draggableRegistry.length - 1) });
            generateContextMenuButton(container, "send to back", () => { Whiteboard.logChange(); draggable.setLayer(0) });
            generateContextMenuButton(container, "set id", () => Popup.openPopup("id-changer"));
            if (draggable.type !== Whiteboard.WhiteboardDraggable.Types.TOGGLE) generateContextMenuButton(container, "set color", () => Popup.openPopup("color-picker"));
            generateContextMenuButton(container, "set size", () => Popup.openPopup("size-picker"));
            generateContextMenuButton(container, "set position", () => Popup.openPopup("position-setter"));
            if (draggable.type == Whiteboard.WhiteboardDraggable.Types.SELECTOR) generateContextMenuButton(container, "define selectables", () => Popup.openPopup("draggable-selector-creator"));
            if (draggable.type == Whiteboard.WhiteboardDraggable.Types.CAMERA_STREAM) {
                generateContextMenuButton(container, "set stream url", () => Popup.openPopup("stream-url-setter"));
                generateContextMenuButton(container, "set stream size", () => Popup.openPopup("stream-size-setter"));
            }
            generateContextMenuButton(container, "set element type", () => Popup.openPopup("type-setter"));
            generateContextMenuButton(container, "duplicate", () => Whiteboard.duplicate(Whiteboard.draggableRegistry[Whiteboard.getDraggableIndex(Whiteboard.currentDraggable.div)]));
        }
    } else if (event.target.id == "whiteboard-border") {
        generateContextMenuButton(container, "set whiteboard size", () => { Popup.openPopup("whiteboard-size-setter") });
    } else if (event.target.classList.contains("selectable")) {
        if (event.target.classList.contains("layout-selectable")) {
            Popup.selected = event.target;
            if (event.target.innerHTML !== "default") {
                generateContextMenuButton(container, "delete", () => { Load.targetLayout = event.target.innerHTML; Popup.openPopup("remove-layout") });
                generateContextMenuButton(container, "rename", () => { Popup.openPopup("layout-renamer") });
                generateContextMenuButton(container, "set as default", () => { Load.setAsDefault(`webdashboard:${event.target.innerHTML}`) });
            }
            generateContextMenuButton(container, "export json", () => { Load.exportJSON(`webdashboard:${event.target.innerHTML}`) });
        }
    }
    document.body.appendChild(container);
    let x = Positioning.toHTMLPositionPX(Positioning.clamp(Positioning.mousePosition.x, 25, whiteboard.clientWidth - container.clientWidth - 25));
    let y = Positioning.toHTMLPositionPX(Positioning.clamp(Positioning.mousePosition.y, 65, whiteboard.clientHeight - container.clientHeight - 25));
    container.style = `left: ${x}; top: ${y}`;
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
    if (Whiteboard.editingMode) Whiteboard.toggleEditingMode();
    isFullScreen = true;
    document.getElementById("menu").style.display = "none";
    Notify.createNotice("Press f11 to exit full screen", "neutral", 4000);
}

function exitFullScreen() {
    isFullScreen = false;
    document.getElementById("menu").style.display = "block";
}