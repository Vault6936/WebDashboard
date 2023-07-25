class Vector2d {
    constructor(x ,y) {
        this.x = x;
        this.y = y;
    }
}
class WhiteboardDraggable {
    constructor(name, position, size, color, type) {
        this.name = name;
        this.size = size;
        this.position = position;
        this.color = color;
        this.size = size;
        this.type = type;
        this.type = type == null ? "button" : type;
        this.div = document.createElement("div");
        this.container = document.createElement("span");
        this.label = document.createElement("input");
        this.arrayIndex = 0;
        this.initialize(this.div);
    }
    initialize(draggableDiv) {
        this.updateIndex(draggables.length);
        draggableDiv.className = "whiteboard-draggable";
        draggableDiv.background = this.color;
        let drag = () => this.setDraggablePosition(draggableDiv, mouseVector);
        draggableDiv.onmousedown = function(event) {dragOffset = new Vector2d(mouseVector.x - draggableDiv.getBoundingClientRect().left, mouseVector.y - draggableDiv.getBoundingClientRect().top); if (elementEditing && event.button === 0) window.addEventListener("mousemove", drag)};
        draggableDiv.onmouseup = () => window.removeEventListener("mousemove", drag);
        draggableDiv.onmouseover = (event) => {
            if (elementEditing) {event.target.style.cursor = "move"} else if (this.type === "button") {event.target.style.cursor = "pointer"; event.target.style.background = "#ebebe0"} else {event.target.style.cursor = "auto"}
        }
        draggableDiv.onmouseleave = (event) => {event.target.classList.remove("whiteboard-button"), event.target.style.background = this.color}
        draggableDiv.dispatchEvent(new Event("mouseleave")); //If this event isn't dispatched, the program will glitch and cause the element to think the mouse is over it
        this.container.appendChild(draggableDiv);
        whiteboard.appendChild(this.container);
        this.label.setAttribute("type", "text");
        this.label.className = "whiteboard-label";
        this.label.placeholder = "Untitled";
        this.label.value = this.name;
        this.container.appendChild(this.label);
        dragOffset = new Vector2d(0, 0);
        this.setDraggablePosition(draggableDiv, this.position);
        if (this.type == "button") {
            this.div.classList.add("whiteboard-button");
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
    setName(name) {
        this.name = name;
    }
    updateIndex(index) {
        this.arrayIndex = index;
        this.div.setAttribute("index", index);
    }
    delete() {
        var temp = [];
        var updatedIndex = 0;
        for (var i = 0; i < draggables.length; i++) {
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
function initialize() {
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
function addDraggable() {
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
    let draggable = event.target;
    currentDraggable = draggable;
    let container = document.createElement("div");
    container.id = "menu-container";
    container.style = "left: " + mouseVector.x + "px; top: " + mouseVector.y + "px";
    if (event.target.classList.contains("whiteboard-draggable") && elementEditing) {
        generateMenuButton(container, "remove", () => {if (elementEditing) draggables[draggable.getAttribute("index")].delete()});
        generateMenuButton(container, "set id", () => document.getElementById("open-id-changer").click());
        generateMenuButton(container, "set color", () => document.getElementById("open-color-picker").click());
        generateMenuButton(container, "set element type", () => document.getElementById("open-type-changer").click());
    }
    document.body.appendChild(container);
}
function changeID(event) {
    let id = activePopup.getElementsByClassName("popup-input")[0].value;
    currentDraggable.id = id;
    currentDraggable.title = "ID: " + id;
    activePopup.getElementsByClassName("close")[0].click();
}
function changeColor(event) {
    let color = activePopup.getElementsByClassName("popup-input")[0].value;
    currentDraggable.style.background = color;
    draggables[currentDraggable.getAttribute("index")].color = color;
    activePopup.getElementsByClassName("close")[0].click();
}
function saveJSON() { //TODO: saveJSON() and defaultSave() do mostly the same thing, so make combine them somehow or at least fix redundant parts
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
    localStorage.setItem("webdashboard:default", data)
}
function selectJSON(event) {
    let activePopup = getPopup(event.target);
    let carousel = activePopup.getElementsByClassName("selectable-carousel-container")[0];
    carousel.innerHTML = "";
    for (let i = 0; i < localStorage.length; i++) {
        if (/webdashboard:/.test(localStorage.key(i))) { // /webdashboard:/ is shorthand for creating a RegEx object with the /webdashboard:/ pattern
            let a = document.createElement("a");
            a.setAttribute("class", "default-text carousel-item selectable");
            a.innerHTML = localStorage.key(i).replace(/webdashboard:/, "");
            a.onclick = (event) => openJSON(localStorage.key(i));
            carousel.appendChild(a);
        }
    }
}
function openJSON(key) {
    let data = JSON.parse(localStorage.getItem(key));
    activePopup.getElementsByClassName("close")[0].click();
    for (let i = 0; i < draggables.length; i++) {
        draggables[i].delete();
    }
    for (let i = 0; i < data.length; i++) {
        let name = data[i].name;
        let position = new Vector2d(data[i].position.x, data[i].position.y);
        let size = data[i].size;
        let color = data[i].color;
        let type = data[i].type;
        draggables.push(new WhiteboardDraggable(name, position, size, color, type))
    }
}
function clearSavedSettings() {
    localStorage.clear();
}