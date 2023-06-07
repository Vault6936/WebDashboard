class Vector2d {
    constructor(x ,y) {
        this.x = x;
        this.y = y;
    }
}
class whiteboardDraggable {
    constructor(name, size, position, color, type) {
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
        this.initialize(this.div);
    }
    initialize(draggableDiv) {
        console.log(draggableDiv);
        draggableDiv.className = "whiteboard-draggable";
        var drag = function() {setDraggablePosition(draggableDiv, mouseVector)};
        draggableDiv.onmousedown = function(event) {dragOffset = new Vector2d(mouseVector.x - draggableDiv.getBoundingClientRect().left, mouseVector.y - draggableDiv.getBoundingClientRect().top); if (elementEditing && event.button === 0) window.addEventListener("mousemove", drag)};
        draggableDiv.onmouseup = () => window.removeEventListener("mousemove", drag);
        draggableDiv.onmouseover = (event) => {
            if (elementEditing) {event.target.style.cursor = "move"} else if (this.type == "button") {event.target.style.cursor = "pointer"; event.target.classList.add("whiteboard-button")} else {event.target.style.cursor = "auto"}
        }
        draggableDiv.onmouseleave = (event) => {event.target.classList.remove("whiteboard-button")}
        this.container.appendChild(draggableDiv);
        whiteboard.appendChild(this.container);
        this.label.setAttribute("type", "text");
        this.label.className = "whiteboard-label";
        this.label.placeholder = "Untitled";
        this.container.appendChild(this.label);
        dragOffset = new Vector2d(0, 0);
        setDraggablePosition(draggableDiv, new Vector2d(100, 100));
        if (this.type == "button") {
            this.div.classList.add("whiteboard-button");
        }
    }
}
var mouseVector = new Vector2d(0, 0);
var dragOffset = new Vector2d(0, 0);
var elementEditing = false;
var openPopup; //global variable containing the popup element that is currently open
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
    draggables.push(new whiteboardDraggable());
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
function openPopup(target) {
    popup = document.getElementById(target.getAttribute("popup"));
    animated = popup.getElementsByClassName("popup-animated");
    for (i = 0; i < animated.length; i++) {
        animated.style.opacity = "100%";
    }
    activePopup = popup;
    closeBtn = popup.getElementsByClassName("close")[0];
    content = popup.getElementsByClassName("popup-content")[0];

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
    /*try {
        popup.getElementsByClassName("popup-content")[0].style.display = "block";
    } catch {
        console.warn("no popup content to show");
    }*/
}
function closePopup(target) {
    popup = target.parentElement;
    content = popup.getElementsByClassName("popup-content")[0];
    animated = popup.getElementsByClassName("popup-animated");
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
    currentDraggable = draggable;
    var container = document.createElement("div");
    container.id = "menu-container";
    container.style = "left: " + mouseVector.x + "px; top: " + mouseVector.y + "px";
    if (event.target.classList.contains("whiteboard-draggable") && elementEditing) {
        generateMenuButton(container, "remove", () => {if (elementEditing) draggable.parentElement.remove()});
        generateMenuButton(container, "set id", () => document.getElementById("open-id-changer").click());
        generateMenuButton(container, "set color", () => document.getElementById("open-color-picker").click());
        generateMenuButton(container, "set element type", () => document.getElementById("open-type-changer").click());
    }
    document.body.appendChild(container);
}
function changeID(event) {
    id = popup.getElementsByClassName("popup-input")[0].value;
    currentDraggable.id = id;
    popup.getElementsByClassName("close")[0].click();
}
function changeColor(event) {
    color = popup.getElementsByClassName("popup-input")[0].value;
    currentDraggable.style.background = color;
    popup.getElementsByClassName("close")[0].click();
}