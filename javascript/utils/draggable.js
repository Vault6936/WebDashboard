var Draggable = {
    WhiteboardDraggable: class {
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
            this.updateIndex(window.Draggable.draggables.length);
    
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
    
            let drag = () => this.setDraggablePosition(draggableDiv, window.Positioning.mousePosition);
    
            
    
            this.div.onmousedown = function(event) {
                if (elementEditing && event.button === 0) {
                    if (!draggableDiv.draggingDiv) {
                        window.Draggable.dragOffset = new window.Positioning.Vector2d(window.Positioning.mousePosition.x - draggableDiv.getBoundingClientRect().left, window.Positioning.mousePosition.y - draggableDiv.getBoundingClientRect().top); 
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
            window.Draggable.dragOffset = new window.Positioning.Vector2d(0, 0);
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
            const x = window.Positioning.clamp((pose.x - window.Draggable.dragOffset.x), 25, whiteboard.clientWidth - draggableDiv.clientWidth - 25);
            const y = window.Positioning.clamp((pose.y - window.Draggable.dragOffset.y), 65, whiteboard.clientHeight - draggableDiv.clientHeight - 50);
    
            this.position = new window.Positioning.Vector2d(x, y);
    
            draggableDiv.style.left = window.Positioning.toHTMLPositionPX(x);
            draggableDiv.style.top = window.Positioning.toHTMLPositionPX(y);
            const labelOffset = (draggableDiv.clientWidth - (this.label.clientWidth + getBorderWidth(this.label))) / 2;
            this.label.style.left = window.Positioning.toHTMLPositionPX(x + labelOffset);
            this.label.style.top = window.Positioning.toHTMLPositionPX(y + draggableDiv.clientHeight + 10);
        }
        setSize(size) {
            this.size = new window.Positioning.Vector2d(window.Positioning.clamp(size.x, 50, whiteboard.clientWidth * 0.75), window.Positioning.clamp(size.y, 50, whiteboard.clientHeight * 0.75));
            this.div.style.width = window.Positioning.toHTMLPositionPX(this.size.x);
            this.div.style.height = window.Positioning.toHTMLPositionPX(this.size.y);
            this.label.style.width = window.Positioning.toHTMLPositionPX(window.Positioning.clamp(this.size.x * 0.75, 75, Number.POSITIVE_INFINITY));        
            window.Draggable.dragOffset = new window.Positioning.Vector2d(0, 0);
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
            for (let i = 0; i < window.Draggable.draggables.length; i++) {
                if (i != this.arrayIndex) {
                    temp.push(window.Draggable.draggables[i]);
                    window.Draggable.draggables[i].updateIndex(updatedIndex); //resets the index variable of the draggable so the draggable can find itself in the new window.Draggable.draggables array
                    updatedIndex++;
                }
            }
            window.Draggable.draggables = temp;
            this.div.parentElement.remove();
        }
    },

    getDraggableIndex: function (draggable) {
        return parseInt(draggable.getAttribute("index"));
    },

    addDefaultDraggable: function () {
        window.Draggable.draggables.push(new window.Draggable.WhiteboardDraggable("", new window.Positioning.Vector2d(100, 100), new window.Positioning.Vector2d(100, 100), "black", "button", null));
    },

    duplicate: function (draggable) {
        window.Draggable.draggables.push(new window.Draggable.WhiteboardDraggable(getDraggableName(draggable), new window.Positioning.Vector2d(0, 0), draggable.size, draggable.color, draggable.type, draggable.id));
    },

    draggables: [],
    dragOffset: null,
    currentDraggable: null,
};

window.Draggable = Draggable || {};