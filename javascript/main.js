class Vector2d {
    constructor(x ,y) {
        this.x = x;
        this.y = y;
    }
}
var mouseVector = new Vector2d(0, 0);
var dragOffset = new Vector2d(0, 0);
function initialize() {
    whiteboard = document.getElementById("whiteboard");
    window.addEventListener("mousemove", (event) => {mouseVector = new Vector2d(event.clientX, event.clientY)});
    window.oncontextmenu = function() {return false};
}
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value))
}
function setPosition(element){
    element.style.left = clamp((mouseVector.x - dragOffset.x), 0, whiteboard.clientWidth - 50) + "px";
    element.style.top = clamp((mouseVector.y - dragOffset.y), 0, whiteboard.clientHeight - 50) + "px";
    console.log(whiteboard.clientHeight);
}
function addDiv() {
    const div = document.createElement("div");
    div.className = "whiteboard-draggable";
    var drag = function() {setPosition(div)};
    div.onmousedown = function() {dragOffset = new Vector2d(mouseVector.x - div.getBoundingClientRect().left, mouseVector.y - div.getBoundingClientRect().top); window.addEventListener("mousemove", drag)};
    div.onmouseup = () => window.removeEventListener("mousemove", drag);
    whiteboard.appendChild(div);
}
