var socket;

class Vector2d {
    constructor(x ,y) {
        this.x = x;
        this.y = y;
    }
}
class WhiteboardDraggable {
    constructor(name, position, size, color, type, id) {
        this.name = name;
        this.size = size;
        this.position = position;
        this.color = color;
        this.size = size;
        this.type = type == null ? "button" : type;
        this.div = document.createElement("div");

        this.draggingDiv = false;

        var draggableDiv = this.div; // Evidently, Javascript lambdas do not like references to 'this' when they are declared.  Using an intermediate variable works.

        this.container = document.createElement("span");
        this.label = document.createElement("input");
        this.arrayIndex = 0;

        this.updateIndex(draggables.length);
        this.div.className = "whiteboard-draggable";
        this.div.background = this.color;
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
        this.setId(id);
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
        console.log(size);
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
        this.id = id == null ? this.arrayIndex : id;
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

function initialize() {
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
    draggables.push(new WhiteboardDraggable("", new Vector2d(100, 100), "25x25", "black", "button"));
}
function setSize(element, width, height, inPixels) {
    if ((window.innerHeight < 800 || window.innerWidth < 1300) && (width != 0)) {
        element.style.width = 500 + "px";
        element.style.height = 300 + "px";
    } else if (inPixels) {
        element.style.width = width + "px";
        element.style.height = height + "px";
    } else {
        element.style.width = width + "%";
        element.style.height = height + "%";
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
        setSize(popup, 50, 50, false);
    } else if (popup.id == "color-picker") {
        setSize(popup, 25, 25, false);
        popup.getElementsByClassName("popup-input")[0].value = ""; //taking the input field and setting the value to an empty string
    } else {
        setSize(popup, 25, 25, false);
    }
    setSize(content, 100, 100, false);

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
    setSize(popup, 0, 0, false);
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
    activePopup.getElementsByClassName("close")[0].click();
}
function changeColor() {
    let color = activePopup.getElementsByClassName("popup-input")[0].value;
    currentDraggable.style.background = color;
    draggables[currentDraggable.getAttribute("index")].color = color;
    activePopup.getElementsByClassName("close")[0].click();
}
function setDraggableSize() {
    let size = activePopup.getElementsByClassName("popup-input")[0].value;
    size = size.split(/[Xx]/);
    width = parseInt(size[0]);
    height = parseInt(size[1]);
    draggables[getDraggableIndex(currentDraggable)].setSize(new Vector2d(width, height));
    activePopup.getElementsByClassName("close")[0].click();
}
function saveSettings() {
    websocketURL = document.getElementById("websocketURL").value;
    activePopup.getElementsByClassName("close")[0].click();

}
function removeLayout(key) {
    try {
        localStorage.removeItem("webdashboard:" + key);
    } catch {
        let notice = new Notice("Could not remove layout!  Try reloading the page.", "negative");
    }
}
function saveJSON() {
    for (let i = 0; i < draggables.length; i++) {
        draggables[i].setName(draggables[i].label.value);
    }
    let name = activePopup.getElementsByClassName("popup-input")[0].value;
    let data = JSON.stringify(draggables);
    localStorage.setItem("webdashboard:" + name, data)
    activePopup.getElementsByClassName("close")[0].click();
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
    for (let i = 0; i < localStorage.length; i++) {
        if (/webdashboard:/.test(localStorage.key(i))) { // /webdashboard:/ is shorthand for creating a RegEx object with the /webdashboard:/ pattern
            let a = document.createElement("a");
            a.setAttribute("class", "default-text carousel-item selectable layout-selector-button");
            a.innerHTML = localStorage.key(i).replace(/webdashboard:/, "");
            a.onclick = (event) => openJSON(localStorage.key(i));
            carousel.appendChild(a);
        }
    }
}
function clearLayout() {
    iterations = draggables.length; //must be set here, because calling delete() continually updates draggables.length
    for (let i = 0; i < iterations; i++) {
        draggables[0].delete(); //Every time delete() is called, a new draggable will fall into the 0 slot in the array
    }
}
function openJSON(key) {
    currentLayout = key.replace(/webdashboard:/, "");
    let layoutLabel = document.getElementById("layout-name");
    if (currentLayout === "default") {
        layoutLabel.innerHTML = "default layout";
    } else {
        layoutLabel.innerHTML = `layout: ${currentLayout}`;
    }
    let data = JSON.parse(localStorage.getItem(key));
    activePopup.getElementsByClassName("close")[0].click();
    clearLayout();
    for (let i = 0; i < data.length; i++) {
        let name = data[i].name;
        let position = new Vector2d(data[i].position.x, data[i].position.y);
        let size = data[i].size;
        let color = data[i].color;
        let type = data[i].type;
        draggables.push(new WhiteboardDraggable(name, position, size, color, type, ""))
    }
}
function clearSavedSettings() {
    localStorage.clear();
}
class Notice {
    constructor(message, type) {
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
        this.container.style.opacity = 0;
        document.body.appendChild(this.container);
        this.containerOpacity = 0;
        this.fade = null;
    }
    fadeIn() {
        let func = this.increaseOpacity.bind(this); //binding will bind the function's "this" to the provided value instead of the thing that's executing it
        this.fade = window.setInterval(func, 5);
    }
    increaseOpacity() {
        this.containerOpacity += 0.01;
        if (this.containerOpacity >= 1.0) {
            window.clearInterval(this.fade);
        } else {
            this.container.style.opacity = this.containerOpacity;
        }
    }
    fadeOut() {
        let func = this.decreaseOpacity.bind(this);
        this.fade = window.setInterval(func, 5);
    }
    //TODO: Something is happening where multiple notices are being created and applying everything to the exact same element...or somethine like that
    decreaseOpacity() {
        this.containerOpacity -= 0.01;
        if (this.containerOpacity <= 0) {
            window.clearInterval(this.fade);
        } else {
            this.container.style.opacity = this.containerOpacity;
        }
    }
}
function createNotice(message, type) {
    let notice = new Notice(message, type);
    notice.fadeIn();
    window.setTimeout(notice.fadeOut.bind(notice), 8000);
}
function openSocket(recursion) {
    if (recursion == 0) {
        createNotice("Attempting to connect to the RoboRio...");
    }
    socket = new WebSocket(websocketURL);
    socket.onopen = () => createNotice("Connected to the RoboRio!", "positive");
    if (recursion < 1) {
        socket.onerror = () => {createNotice("Could not connect to the RoboRio!", "negative"); openSocket(recursion + 1)};
    } else {
        socket.onerror = () => {openSocket(recursion + 1)}
    }
}