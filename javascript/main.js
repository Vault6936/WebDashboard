var socket;

class Vector2d {
    constructor(x ,y) {
        this.x = x;
        this.y = y;
    }
}
class WhiteboardDraggable {
    constructor(name, position, size, color, type, id) {
        this.div = document.createElement("div");

        this.name = name;
        this.size = size;
        this.position = position;
        this.color = color;
        this.size = size;
        this.type = type == null ? "button" : type;

        this.arrayIndex = 0;
        this.updateIndex(draggables.length);

        this.setId(id);


        this.draggingDiv = false;

        var draggableDiv = this.div; // Evidently, Javascript lambdas do not like references to 'this' when they are declared.  Using an intermediate variable works.

        this.container = document.createElement("span");
        this.label = document.createElement("input");

        this.div.className = "whiteboard-draggable";
        this.div.background = this.color;

        this.setSize(this.size);

        let drag = () => this.setDraggablePosition(draggableDiv, mouseVector);

        

        this.div.onmousedown = function(event) {
            if (elementEditing && event.button === 0) {
                if (!draggableDiv.draggingDiv) {
                    dragOffset = new Vector2d(mouseVector.x - draggableDiv.getBoundingClientRect().left, mouseVector.y - draggableDiv.getBoundingClientRect().top); 
                    window.addEventListener("mousemove", drag);
                    draggableDiv.draggingDiv = true;
                } else {
                    window.removeEventListener("mousemove", drag);
                    draggableDiv.draggingDiv = false;
                }
            }
        };
        document.onmouseup = () => {window.removeEventListener("mousemove", drag); draggableDiv.draggingDiv = false};
        this.div.onmouseup = () => {window.removeEventListener("mousemove", drag); draggableDiv.draggingDiv = false}; //TODO: May not need both listeners?  Must test
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
        if (this.type == "button") {
            this.div.classList.add("whiteboard-button");
            this.div.onclick = function() {
                    if (!elementEditing) {
                    try {
                        socket.send(draggableDiv.id);
                    } catch {
                    console.warn("Unable to send data to RoboRio");
                    }
                };
            }
        }

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
    setName(name) {
        this.name = name;
    }
    setId(id) {
        if (id == null || id == "undefined" || id == "") {
            id = `${this.type}${this.arrayIndex}`;
        }
        this.div.id = id;
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
var mouseVector = new Vector2d(0, 0);
var dragOffset = new Vector2d(0, 0);
var elementEditing = false;
var activePopup; //global variable containing the popup element that is currently open
var currentDraggable; //global variable containing the draggable element from which a popup has been opened
var draggables = []; //global array of all draggables created
var websocketURL = "ws://10.69.36.2:5800";
var currentLayout = "default";
openJSON("webdashboard:default");
var isFullScreen = false;

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

fullScreenEvent = new EventChecker(new CustomEvent("fullscreen"), inFullScreen, window);
exitFullScreenEvent = new EventChecker(new CustomEvent("exitfullscreen"), () => !inFullScreen(), window);

eventCheckers.push(fullScreenEvent);
eventCheckers.push(exitFullScreenEvent);

window.addEventListener("fullscreen", () => {if (!isFullScreen) toggleFullScreen()});
window.addEventListener("exitfullscreen", () => {if (isFullScreen) toggleFullScreen()})


setInterval(() => {
    for (let i = 0; i < eventCheckers.length; i++) {
        eventCheckers[i].check();
    }
}, 20);


function initialize() {

    window.addEventListener("keydown", (event) => {
        if (event.isComposing) {
          return;
        };
        if (event.key == "f") {
            toggleFullScreen();
        }
      });
      

    if (!listLayoutNames().includes("default")) {
        defaultSave();
        console.warn("It looks like this is your first time using the Vault 6936 Web Dashboard in this browser.  Welcome!");
    }

    openSocket(0);
    whiteboard = document.getElementById("whiteboard");
    settings = document.getElementById("settings");
    popupBackground = document.getElementById("popup-background");
    popupOpeners = document.querySelectorAll("[popup]"); //grabs all elements with a popup attribute
    for (var i = 0; i < popupOpeners.length; i++) {
        popupOpeners[i].addEventListener("click", (event) => {openPopup(event.target)})
    }
    closeBtns = document.getElementsByClassName("close");
    for (i = 0; i < closeBtns.length; i++) {
        closeBtns[i].addEventListener("click", (event) => {closePopup(event.target)});
    }
    window.addEventListener("mousemove", (event) => {mouseVector = new Vector2d(event.clientX, event.clientY)});
    window.oncontextmenu = (event) => generateRightClickMenu(event), false;
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
    draggables.push(new WhiteboardDraggable("", new Vector2d(100, 100), "25x25", "black", "button", null));
}
function setPopupSize(element, width, height, minWidth, minHeight, inPixels) {
    element.style.height = 0;
    element.style.width = 0;
    width = parseFloat(width);
    height = parseFloat(height);
    if (inPixels) {
        element.style.width = width + "px";
        element.style.height = height + "px";
    } else {
        aspectRatio = width / height;
        height = clamp(height, 0, 90);
        element.style.height = height.toString() + "vh";
        element.style.width = clamp(height * aspectRatio, 0, 90).toString() + "vh";
        element.style.minHeight = toHTMLPositionPX(minHeight);
        element.style.minWidth = toHTMLPositionPX(minWidth);
    }
}
function toggleEditingMode() {
    var editingToggle = document.getElementById("editingToggle");
    var labels = document.getElementsByClassName("whiteboard-label");
    if (elementEditing) {
        editingToggle.innerHTML = "turn on editing mode";
        for (var i = 0; i < labels.length; i++) {
            labels[i].readOnly = true;
        }
    } else {
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

    if (popup.id == "settings") {
        setPopupSize(popup, 75, 50, 0, 0, false);
    } else if (popup.id == "color-picker") {
        setPopupSize(popup, 75, 50, 0, 0, false);
        popup.getElementsByClassName("popup-input")[0].value = ""; //taking the input field and setting the value to an empty string
    } else if (popup.id == "clear-storage") {
        setPopupSize(popup, 75, 20, 0, 0, false)
    } else {
        setPopupSize(popup, 50, 25, 0, 0, false);
    }

    window.setTimeout(() => content.style.display = "block", 500);

    popup.classList.add("popup-displayed");
    
    popup.setAttribute("z-index", "1");
    closeBtn.style.display = "block";
    popupBackground.style.display = "block";
    popupBackground.setAttribute("z-index", "0");
}
function closePopup(target) {
    let popup = target.parentElement;
    let content = popup.getElementsByClassName("popup-content")[0];
    let animated = popup.getElementsByClassName("popup-animated");
    for (i = 0; i < animated.length; i++) {
        animated.style.opacity = "0%";
    }
    content.style.display = "none";
    activePopup = null;
    setPopupSize(popup, 0, 0, false);
    popup.classList.remove("popup-displayed");
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
function generateMenuButton(parent, name, onclick) {
    let button = document.createElement("a");
    button.innerHTML = name;
    button.onclick = function() {
        try {
            onclick(); 
        } finally {
            removeMenu()
        }
    };
    button.className = "menu-button";
    parent.appendChild(button);
}
function generateRightClickMenu(event) {
    removeMenu();
    event.preventDefault();
    let container = document.createElement("div");
    container.id = "menu-container";
    container.style = "left: " + mouseVector.x + "px; top: " + mouseVector.y + "px";
    if (event.target.classList.contains("whiteboard-draggable")) {
        currentDraggable = event.target;
        if (elementEditing) {
            generateMenuButton(container, "remove", () => {if (elementEditing) draggables[event.target.getAttribute("index")].delete()});
            generateMenuButton(container, "set id", () => document.getElementById("open-id-changer").click());
            generateMenuButton(container, "set color", () => document.getElementById("open-color-picker").click());
            generateMenuButton(container, "set size", () => document.getElementById("open-size-picker").click());
            generateMenuButton(container, "set element type", () => document.getElementById("open-type-changer").click());
            generateMenuButton(container, "duplicate", () => duplicate(draggables[getDraggableIndex(currentDraggable)]));
        }
    } else if (event.target.classList.contains("layout-selector-button")) {
        if (event.target.innerHTML !== "default") {
            generateMenuButton(container, "delete", () => {removeLayout(event.target.innerHTML); event.target.remove()});
        }
    }
    document.body.appendChild(container);
}
function duplicate(draggable) {
    draggables.push(new WhiteboardDraggable(draggable.name, new Vector2d(0, 0), draggable.size, draggable.color, draggable.type, draggable.id));
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
function saveSettings() {
    websocketURL = document.getElementById("websocketURL").value;
    clickCloseBtn();

}
function toggleFullScreen() {
    isFullScreen = !isFullScreen;
        if (isFullScreen) {
            document.getElementById("menu").style.display = "none";
            try {
                document.documentElement.requestFullscreen();
                createNotice("Press f to exit full screen", "neutral", 4000);
            } catch {}
        } else {
            document.getElementById("menu").style.display = "block";
            try {
                document.exitFullscreen();
            } catch {}
        }
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
function saveJSON() {
    for (let i = 0; i < draggables.length; i++) {
        draggables[i].setName(draggables[i].label.value);
    }
    let name = activePopup.getElementsByClassName("popup-input")[0].value;
    updateCurrentLayout(name);    
    let data = JSON.stringify(draggables);
    localStorage.setItem("webdashboard:" + name, data)
    clickCloseBtn();
}
function defaultSave() {
    for (let i = 0; i < draggables.length; i++) {
        draggables[i].setName(draggables[i].label.value);
    }
    let data = JSON.stringify(draggables);
    localStorage.setItem(`webdashboard:${currentLayout}`, data)
}
function selectJSON(event) {
    let activePopup = getPopup(event.target);
    let carousel = activePopup.getElementsByClassName("selectable-carousel-container")[0];
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
}
function clickCloseBtn() {
    try {
        clickCloseBtn();
    } catch {}
}
function openJSON(key) {
    updateCurrentLayout(key.replace(/webdashboard:/, ""));
    let data = JSON.parse(localStorage.getItem(key));
    clickCloseBtn();
    clearLayout();
    for (let i = 0; i < data.length; i++) {
        let name = data[i].name;
        let position = new Vector2d(data[i].position.x, data[i].position.y);
        let size = data[i].size;
        let color = data[i].color;
        let type = data[i].type;
        draggables.push(new WhiteboardDraggable(name, position, size, color, type, ""))
    }
    toggleEditingMode();
    toggleEditingMode();
}
function clearSavedSettings() {
    localStorage.clear();
}

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
        let promise = new Promise((resolve, reject) => {
            try {
                this.container.animate(this.fadeInAnimation, this.fadeTiming); 
                this.container.style.opacity = "1.0"; 
                resolve();
            } catch {
                reject("Failed to properly display notice.  Check your browser version.");
            }

        });
        promise.then(() => {
            setTimeout(() => {
                this.container.animate(this.fadeOutAnimation, this.fadeTiming);
                this.container.style.opacity = "0.0"; 
            }, this.duration)
        }, (result) => console.warn(result));

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