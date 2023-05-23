class Vector2d {
    constructor(x ,y) {
        this.x = x;
        this.y = y;
    }
}
var mouseVector = new Vector2d(0, 0);
var dragOffset = new Vector2d(0, 0);
var elementEditing = false;
var openPopup; //global variable containing the popup element that is currently open
function initialize() {
    whiteboard = document.getElementById("whiteboard");
    settings = document.getElementById("settings");
    popupBackground = document.getElementById("popup-background");
    popupOpeners = document.querySelectorAll("[popup]");
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
function setDraggablePosition(draggable, pose){
    container = draggable.parentElement;
    label = container.getElementsByClassName("whiteboard-label")[0];
    const x = clamp((pose.x - dragOffset.x), 25, whiteboard.clientWidth - draggable.clientWidth - 25);
    const y = clamp((pose.y - dragOffset.y), 65, whiteboard.clientHeight - draggable.clientHeight - 50);
    draggable.style.left = toHTMLPositionPX(x);
    draggable.style.top = toHTMLPositionPX(y);
    const labelOffset = (draggable.clientWidth - (label.clientWidth + getBorderWidth(label))) / 2;
    label.style.left = toHTMLPositionPX(x + labelOffset);
    label.style.top = toHTMLPositionPX(y + draggable.clientHeight + 10);
}
function addDraggable() {
    const container = document.createElement("span");
    const div = document.createElement("div");
    div.className = "whiteboard-draggable";
    var drag = function() {setDraggablePosition(div, mouseVector)};
    div.onmousedown = function(event) {dragOffset = new Vector2d(mouseVector.x - div.getBoundingClientRect().left, mouseVector.y - div.getBoundingClientRect().top); if (elementEditing && event.button === 0) window.addEventListener("mousemove", drag)};
    div.onmouseup = () => window.removeEventListener("mousemove", drag);
    div.onmouseover = (event) => {
        if (elementEditing) {event.target.style.cursor = "move"} else {event.target.style.cursor = "auto"}
    }
    container.appendChild(div);
    whiteboard.appendChild(container);
    const label = document.createElement("input");
    label.setAttribute("type", "text");
    label.className = "whiteboard-label";
    label.placeholder = "Untitled";
    container.appendChild(label);
    dragOffset = new Vector2d(0, 0);
    setDraggablePosition(div, new Vector2d(100, 100));
}
function setSize(element, width, height, inPixels) {
    if (inPixels) {
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
function openPopup(target) {
    popup = document.getElementById(target.getAttribute("popup"));
    openPopup = popup;
    closeBtn = popup.getElementsByClassName("close")[0];
    if (popup.id == "settings") {
        setSize(popup, 75, 75, false);
    } else {
        setSize(popup, 50, 50, false);
    }

    popup.classList.add("popup-displayed");
    
    popup.setAttribute("z-index", "1");
    closeBtn.style.display = "block";
    popupBackground.style.display = "block";
    popupBackground.setAttribute("z-index", "0");
    try {
        popup.getElementsByClassName("popup-content")[0].style.display = "block";
    } catch {
        console.warn("no popup content to show");
    }
}
function closePopup(target) {
    popup = target.parentElement;
    openPopup = null;
    setSize(popup, 0, 0, false);
    popup.classList.remove("popup-displayed");
    popupBackground.style.display = "none";
    target.style.display = "none";
    popup.getElementsByClassName("popup-content")[0].style.display = "none";
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
    button = document.createElement("a");
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
    var draggable = event.target;
    var container = document.createElement("div");
    container.id = "menu-container";
    container.style = "left: " + mouseVector.x + "px; top: " + mouseVector.y + "px";
    if (event.target.className == "whiteboard-draggable") {
        generateMenuButton(container, "remove", () => {if (elementEditing) draggable.parentElement.remove()});
        generateMenuButton(container, "set id");
        generateMenuButton(container, "set color", () => document.getElementById("open-color-picker").click());
        generateMenuButton(container, "set element type");
    }
    document.body.appendChild(container);
}
function changeColor(event) {
    color = popup.getElementsByClassName("popup-input")[0].value;
    event.target.style.background = color;
    popup.getElementsByClassName("close")[0].click();
}