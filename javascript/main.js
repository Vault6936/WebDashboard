var socket;


var currentNotice = null;

class Notice {
    constructor(message, type, duration) {
        let color = "gray";
        if (type === "positive") {
            color = "limegreen";
        } else if (type === "negative") {
            color = "red";
        }
        this.message = message;
        this.container = document.createElement("div");
        let textContainer = document.createElement("div");
        textContainer.classList.add("notice-text-container");
        let p = document.createElement("p");
        p.classList.add("default-text");
        p.classList.add("notice");
        p.innerHTML = message;
        this.container.appendChild(textContainer);
        textContainer.appendChild(p);
        this.container.classList.add("notice-container");
        this.container.style.backgroundColor = color;
        document.body.appendChild(this.container);
        this.fade = null;


        this.fadeInAnimation = [{opacity: 0}, {opacity: 1}];

        this.fadeOutAnimation = [{opacity: 1}, {opacity: 0}];

        this.fadeTiming = {duration: 500, iterations: 1};

        this.fadeSequence();

        this.duration = duration;
    }



    fadeSequence() {
        let fadeIn = new Promise((resolve, reject) => {
            try {
                this.container.animate(this.fadeInAnimation, this.fadeTiming); 
                this.container.style.opacity = "1.0"; 
                resolve();
            } catch {
                reject("Failed to properly display notice.  Check your browser version.");
            }

        });
        fadeIn.then(() => {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                this.container.animate(this.fadeOutAnimation, this.fadeTiming).finished.then(() => resolve());
            }, this.duration)
        }
        )}).then(() => this.container.remove());
    }


}
function createNotice(message, type, duration) {
    currentNotice = new Notice(message, type, duration);
}
function openSocket(recursion) {
    if (recursion == 0) {
        createNotice("Attempting to connect to the RoboRio...", "neutral", 3000);
    }
    socket = new WebSocket(websocketURL);
    socket.onopen = () => createNotice("Connected to the RoboRio!", "positive", 8000);
    if (recursion < 1) {
        socket.onerror = () => {createNotice("Could not connect to the RoboRio!", "negative", 8000); openSocket(recursion + 1)};
    } else {
        socket.onerror = () => {openSocket(recursion + 1)}
    }
}

class Vector2d {
    constructor(x ,y) {
        this.x = x;
        this.y = y;
    }
}
// #region [draggable class]
class WhiteboardDraggable {
    constructor(name, position, size, color, type, id) {
        this.div = document.createElement("div");

        this.name = name;
        this.size = size;
        this.position = position;
        this.color = color;
        this.size = size;
        this.type = null;
        this.setType(type);

        this.arrayIndex = 0;
        this.updateIndex(draggables.length);

        this.id = null;
        this.setId(id);


        this.draggingDiv = false;

        var draggableDiv = this.div; // Evidently, Javascript lambdas do not like references to 'this' when they are declared.  Using an intermediate variable works.

        this.container = document.createElement("span");
        this.label = document.createElement("input");
        if (!elementEditing) {
            this.label.readOnly = true;
        }

        this.div.className = "whiteboard-draggable";
        this.div.background = this.color;

        this.setSize(this.size);

        let drag = () => this.setDraggablePosition(draggableDiv, mousePosition);

        

        this.div.onmousedown = function(event) {
            if (elementEditing && event.button === 0) {
                if (!draggableDiv.draggingDiv) {
                    dragOffset = new Vector2d(mousePosition.x - draggableDiv.getBoundingClientRect().left, mousePosition.y - draggableDiv.getBoundingClientRect().top); 
                    window.addEventListener("mousemove", drag);
                    draggableDiv.draggingDiv = true;
                } else {
                    window.removeEventListener("mousemove", drag);
                    draggableDiv.draggingDiv = false;
                }
            }
        };

        [document, window, this.div].forEach((thing) => {thing.onpointerup = () => {window.removeEventListener("mousemove", drag); draggableDiv.draggingDiv = false}});

        draggableDiv.onmouseover = (event) => {
            if (elementEditing) {event.target.style.cursor = "move"} else if (this.type === "button") {event.target.style.cursor = "pointer"; event.target.style.background = "#ebebe0"} else {event.target.style.cursor = "auto"}
        }
        this.div.onmouseleave = (event) => {event.target.classList.remove("whiteboard-button"), event.target.style.background = this.color}
        this.div.dispatchEvent(new Event("mouseleave")); //If this event isn't dispatched, the program will glitch and cause the element to think the mouse is over it
        this.container.appendChild(this.div);
        whiteboard.appendChild(this.container);
        this.label.setAttribute("type", "text");
        this.label.className = "whiteboard-label";
        this.label.placeholder = "Untitled";
        this.label.value = this.name;
        this.container.appendChild(this.label);
        dragOffset = new Vector2d(0, 0);
        this.setDraggablePosition(this.div, this.position);
    }

    sendDataToRio() {
        if (!elementEditing) {
            try {
                socket.send(this.id);
            } catch {
                console.warn("Unable to send data to RoboRio");
            }
        };
    }

    setDraggablePosition(draggableDiv, pose){
        const x = clamp((pose.x - dragOffset.x), 25, whiteboard.clientWidth - draggableDiv.clientWidth - 25);
        const y = clamp((pose.y - dragOffset.y), 65, whiteboard.clientHeight - draggableDiv.clientHeight - 50);

        this.position = new Vector2d(x, y);

        draggableDiv.style.left = toHTMLPositionPX(x);
        draggableDiv.style.top = toHTMLPositionPX(y);
        const labelOffset = (draggableDiv.clientWidth - (this.label.clientWidth + getBorderWidth(this.label))) / 2;
        this.label.style.left = toHTMLPositionPX(x + labelOffset);
        this.label.style.top = toHTMLPositionPX(y + draggableDiv.clientHeight + 10);
    }
    setSize(size) {
        this.size = new Vector2d(clamp(size.x, 50, whiteboard.clientWidth * 0.75), clamp(size.y, 50, whiteboard.clientHeight * 0.75));
        this.div.style.width = toHTMLPositionPX(this.size.x);
        this.div.style.height = toHTMLPositionPX(this.size.y);
        this.label.style.width = toHTMLPositionPX(clamp(this.size.x * 0.75, 75, Number.POSITIVE_INFINITY));        
        dragOffset = new Vector2d(0, 0);
        this.setDraggablePosition(this.div, this.position);
    }
    setType(type) {
        if (type == null) {
            type = "button";
        }
        if (type == "button") {
            this.div.addEventListener("click", this.sendDataToRio);
        } else {
            this.div.removeEventListener("click", this.sendDataToRio);
        }
        this.type = type;
        this.setId();
    }
    setName(name) {
        this.name = name;
    }
    setId(id) {
        if (id == null || id == "undefined" || id == "") {
            id = `${this.type}_${this.arrayIndex}`;
        }
        this.div.id = id;
        this.id = id;
        this.div.title = (`ID: ${id}`); //I LOVE string interpolation
    }
    updateIndex(index) {
        this.arrayIndex = index;
        this.div.setAttribute("index", index);
    }
    delete() {
        var temp = [];
        var updatedIndex = 0;
        for (let i = 0; i < draggables.length; i++) {
            if (i != this.arrayIndex) {
                temp.push(draggables[i]);
                draggables[i].updateIndex(updatedIndex); //resets the index variable of the draggable so the draggable can find itself in the new draggables array
                updatedIndex++;
            }
        }
        draggables = temp;
        this.div.parentElement.remove();
    }
}
// #endregion 

class DraggableChange {
    constructor(draggable) {
        changes.push(this);
        changes.splice(0, 1);
    }
}

// #region declare global variables
var changes = []

var mousePosition = new Vector2d(0, 0);
var dragOffset = new Vector2d(0, 0);
var elementEditing = false;
var activePopup; //global variable containing the popup element that is currently open
var currentDraggable; //global variable containing the draggable element from which a popup has been opened
var draggables = []; //global array of all draggables created
var websocketURL = "ws://10.69.36.2:5800";
var currentLayout = "default";
openJSON("webdashboard:default");
var isFullScreen = false;

// #endregion

function inFullScreen() {
    return Math.abs(window.outerWidth-screen.width) < 5 && Math.abs(window.outerHeight - screen.height) < 5;    
}

class EventChecker {
    constructor(event, checker, target) {
        this.event = event;
        this.checker = checker;
        this.target = target;
        this.check = this.check.bind(this);
        this.fire = this.fireEvent.bind(this);
        this.lastState = false;
    }
    check() {
        try {
            const state = this.checker();
            if (state && state != this.lastState) {
                this.fireEvent();
            };
            this.lastState = state;
        } catch {
            console.warn("Event checker object is not a function!");
        }
    }
    fireEvent() {
        this.target.dispatchEvent(this.event);
    }
}

var eventCheckers = []

var fullScreenEvent = new EventChecker(new CustomEvent("fullscreen"), inFullScreen, window);
var exitFullScreenEvent = new EventChecker(new CustomEvent("exitfullscreen"), () => {return !inFullScreen()}, window);

eventCheckers.push(fullScreenEvent);
eventCheckers.push(exitFullScreenEvent);

window.addEventListener("fullscreen", enterFullScreen);
window.addEventListener("exitfullscreen", exitFullScreen);

setInterval(() => {
    for (let i = 0; i < eventCheckers.length; i++) {
        eventCheckers[i].check();
    }
}, 20);


function initialize() {

    window.addEventListener("keydown", (event) => {
        if (event.key == "Enter") {
            try {
                activePopup.getElementsByClassName("apply")[0].click();
            } catch {}
        } else if (event.key == "s" && (event.ctrlKey || event.metaKey)) { //meta key is for MacOS
              event.preventDefault();
              defaultSave();
              createNotice("Layout saved!", "positive", 3000);
        }
    });

    generateSimpleInputPopup("whiteboard-size-setter", setWhiteBoardSize, "750x500", "border size");
    generateSimpleInputPopup("size-picker", setDraggableSize, "100x100", "draggable size");
    generateSimpleInputPopup("color-picker", changeColor, "#ffffff", "draggable color");

    populatePopupList(document.getElementById("type-setter"), ["button", "toggle", "boolean telemetry", "text telemetry"], (iterable) => iterable, (iterable) => {return () => setType(iterable)});

    if (!listLayoutNames().includes("default")) {
        defaultSave();
        console.warn("It looks like this is your first time using the Vault 6936 Web Dashboard in this browser.  Welcome!");
    }

    openSocket(0);
    whiteboard = document.getElementById("whiteboard");
    settings = document.getElementById("settings");

    popups = document.getElementsByClassName("popup");
    for (let i = 0; i < popups.length; i++) {
        if (popups[i].hasAttribute("code-opened")) {
            let opener = document.createElement("a");
            opener.setAttribute("class", "invisible-popup-opener");
            opener.setAttribute("popup", popups[i].id);
            opener.id = `open-${popups[i].id}`;
            document.body.appendChild(opener);
        }
    }

    popupBackground = document.getElementById("popup-background");
    popupOpeners = document.querySelectorAll("[popup]"); //grabs all elements with a popup attribute
    for (let i = 0; i < popupOpeners.length; i++) {
        popupOpeners[i].addEventListener("click", (event) => {openPopup(event.target)})
    }
    closeBtns = document.getElementsByClassName("close");
    for (i = 0; i < closeBtns.length; i++) {
        closeBtns[i].addEventListener("click", (event) => {closePopup(event.target)});
    }
    window.addEventListener("mousemove", (event) => {mousePosition = new Vector2d(event.clientX, event.clientY)});
    window.oncontextmenu = (event) => generateContextMenu(event), false;
    window.onmousedown = (event) => removeMenu(event);
}
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value))
}
function toHTMLPositionPX(value) {
    return value + "px";
}
function getBorderWidth(element) {
    return element.offsetWidth - element.clientWidth;
}
function getDraggableIndex(draggable) {
    return parseInt(draggable.getAttribute("index"));
}
function addDefaultDraggable() {
    draggables.push(new WhiteboardDraggable("", new Vector2d(100, 100), new Vector2d(100, 100), "black", "button", null));
}
function setPopupSize(element, width, height) {
    width = parseFloat(width);
    height = parseFloat(height);
    element.style.width = width + "px";
    element.style.height = height + "px";

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
function getPopup(target) {
    return document.getElementById(target.getAttribute("popup"));
}
function openPopup(target) {
    let popup = document.getElementById(target.getAttribute("popup"));
    let animated = popup.getElementsByClassName("popup-animated");
    for (i = 0; i < animated.length; i++) {
        animated.style.opacity = "100%";
    }
    activePopup = popup;
    closeBtn = popup.getElementsByClassName("close")[0];
    let contentArray = popup.getElementsByClassName("popup-content");
    let content = null;
    if (contentArray.length == 1) {
        content = popup.getElementsByClassName("popup-content")[0];
    } else {
        throw new Error("Popup wrapper div did not contain div assigned to class 'popup-content'!");
    }

    let size = null;
    if (popup.hasAttribute("size")) size = popup.getAttribute("size").split(/[xX]/);

    if (size == null) {
        setPopupSize(popup, 375, 200);
    } else {
        setPopupSize(popup, parseInt(size[0]), parseInt(size[1]), 0, 0, true)
    }

    window.setTimeout(() => content.style.display = "block", 500);
    
    popup.setAttribute("z-index", "1");
    closeBtn.style.display = "block";
    popupBackground.style.display = "block";
    popupBackground.setAttribute("z-index", "0");
}
function closePopup(target) {
    let popup = target.parentElement;
    let content = popup.getElementsByClassName("popup-content")[0];
    content.style.display = "none";
    activePopup = null;
    setPopupSize(popup, 0, 0, false);
    popupBackground.style.display = "none";
    target.style.display = "none";
}
function removeMenu(event) {
    try {
        if (event == null || event.target.className != "menu-button") { 
            document.getElementById("menu-container").remove();
        }
    } catch {

    }
}

function generateSimpleInputPopup(popupName, onApply, inputPlaceholder, labelName) {
    let div = document.createElement("div");
    div.id = popupName;
    div.setAttribute("class", "popup");
    div.setAttribute("size", "300x200");
    let cls = document.createElement("img");
    cls.setAttribute("class", "close");
    cls.setAttribute("src", "./images/close.svg")
    div.appendChild(cls);
    let content = document.createElement("div");
    content.setAttribute("class", "popup-content");
    div.appendChild(content);
    let inputWrapper = document.createElement("div");
    inputWrapper.setAttribute("class", "simple-input-wrapper");
    content.append(inputWrapper)
    let label = document.createElement("p");
    label.setAttribute("class", "input-label");
    label.innerHTML = labelName ?? "set property";
    inputWrapper.appendChild(label);
    let input = document.createElement("input");
    input.setAttribute("type", "text");
    input.setAttribute("placeholder", inputPlaceholder);
    input.setAttribute("class", "popup-input");
    inputWrapper.appendChild(input);
    let applyContainer = document.createElement("div");
    applyContainer.setAttribute("class", "apply-container");
    content.appendChild(applyContainer);
    let apply = document.createElement("button");
    apply.setAttribute("class", "apply");
    apply.onclick = onApply;
    apply.innerHTML = "apply";
    applyContainer.appendChild(apply);
    document.body.appendChild(div);

    let opener = document.createElement("a");
    opener.setAttribute("popup", popupName);
    opener.id = `open-${popupName}`;
    opener.style.display = "none";
    document.body.appendChild(opener);

    return div;    
}

function populatePopupList(popup, iterables, getName, getOnclick) {
    let listContainer = popup.getElementsByClassName("list-container")[0];
    for (let i = 0; i < iterables.length; i++) {
        let a = document.createElement("a");
        a.setAttribute("class", "default-text carousel-item selectable layout-selector-button");
        a.innerHTML = getName(iterables[i]);
        a.onclick = getOnclick(iterables[i]);
        listContainer.appendChild(a);
    }
}


function generateMenuButton(parent, name, onclick) {
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
    container.style = "left: " + mousePosition.x + "px; top: " + mousePosition.y + "px";
    if (event.target.classList.contains("whiteboard-draggable")) {
        currentDraggable = event.target;
        if (elementEditing) {
            generateMenuButton(container, "remove", () => {if (elementEditing) draggables[event.target.getAttribute("index")].delete()});
            generateMenuButton(container, "set id", () => document.getElementById("open-id-changer").click());
            generateMenuButton(container, "set color", () => document.getElementById("open-color-picker").click());
            generateMenuButton(container, "set size", () => document.getElementById("open-size-picker").click());
            generateMenuButton(container, "set element type", () => document.getElementById("open-type-setter").click());
            generateMenuButton(container, "duplicate", () => duplicate(draggables[getDraggableIndex(currentDraggable)]));
        }    
    } else if (event.target.id == "whiteboard-border") {
        generateMenuButton(container, "set whiteboard size", () => document.getElementById("open-whiteboard-size-setter").click());
    } else if (event.target.classList.contains("layout-selector-button")) {
        if (event.target.innerHTML !== "default") {
            generateMenuButton(container, "delete", () => {removeLayout(event.target.innerHTML); event.target.remove()});
        }
    }
    document.body.appendChild(container);
}
function clickCloseBtn() {
    try {
        activePopup.getElementsByClassName("close")[0].click();
    } catch {
        console.warn("Could not close popup.");
    }
}
function duplicate(draggable) {
    draggables.push(new WhiteboardDraggable(getDraggableName(draggable), new Vector2d(0, 0), draggable.size, draggable.color, draggable.type, draggable.id));
}
function changeID() {
    let id = activePopup.getElementsByClassName("popup-input")[0].value;
    draggables[getDraggableIndex(currentDraggable)].setId(id);
    clickCloseBtn();
}
function changeColor() {
    let color = activePopup.getElementsByClassName("popup-input")[0].value;
    currentDraggable.style.background = color;
    draggables[currentDraggable.getAttribute("index")].color = color;
    clickCloseBtn();
}
function setDraggableSize() {
    let size = activePopup.getElementsByClassName("popup-input")[0].value;
    size = size.split(/[Xx]/);
    width = parseInt(size[0]);
    height = parseInt(size[1]);
    draggables[getDraggableIndex(currentDraggable)].setSize(new Vector2d(width, height));
    clickCloseBtn();
}
function setType(type) {
    draggables[getDraggableIndex(currentDraggable)].setType(type);
    clickCloseBtn();
}
function setWhiteBoardSize() {
    let size = activePopup.getElementsByClassName("popup-input")[0].value;
    size = size.split(/[Xx]/);
    let border = document.getElementById("whiteboard-border");
    border.style.width = toHTMLPositionPX(size[0]);
    border.style.height = toHTMLPositionPX(size[1]);
    clickCloseBtn();    
}
function saveSettings() {
    websocketURL = document.getElementById("websocketURL").value;
    clickCloseBtn();

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
    createNotice("Press f11 to exit full screen", "neutral", 4000);
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
    clickCloseBtn();
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
    let draggableData = draggables;
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
    for (let i = 0; i < draggables.length; i++) {
        getDraggableName(draggables[i]);
    }
    let name = activePopup.getElementsByClassName("popup-input")[0].value;
    updateCurrentLayout(name);    
    localStorage.setItem("webdashboard:" + name, getJSON());
    clickCloseBtn();
}
function defaultSave() {
    for (let i = 0; i < draggables.length; i++) {
        getDraggableName(draggables[i]);
    }
    localStorage.setItem(`webdashboard:${currentLayout}`, getJSON())
}
function selectJSON(event) {
    let activePopup = getPopup(event.target);
    let carousel = activePopup.getElementsByClassName("list-container")[0];
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
    iterations = draggables.length; //must be set here, because calling delete() continually updates draggables.length
    for (let i = 0; i < iterations; i++) {
        draggables[0].delete(); //Every time delete() is called, a new draggable will fall into the 0 slot in the array
    }
    let border = document.getElementById("whiteboard-border");
    border.style.removeProperty("width");
    border.style.removeProperty("height");
}

function openJSON(key) {
    updateCurrentLayout(key.replace(/webdashboard:/, ""));
    clickCloseBtn();
    clearLayout();
    try {
        let data = JSON.parse(localStorage.getItem(key));
        let border = document.getElementById("whiteboard-border");

        if (data.border.width != null) border.style.width = data.border.width;
        if (data.border.height != null) border.style.height = data.border.height;

        for (let i = 0; i < data.draggableData.length; i++) {
            let name = data.draggableData[i].name;
            let position = new Vector2d(data.draggableData[i].position.x, data.draggableData[i].position.y);
            let size = data.draggableData[i].size;
            let color = data.draggableData[i].color;
            let type = data.draggableData[i].type;
            let id = data.draggableData[i].id;
            draggables.push(new WhiteboardDraggable(name, position, size, color, type, id));
        }
    } catch (err) {
        console.warn(err);
        createNotice("Could not open layout!", "negative", 5000);
    }
    toggleEditingMode();
    toggleEditingMode();
}

