var Whiteboard = {
    WhiteboardDraggable: class {
        constructor(name, position, size, color, type, id) {
            let whiteboard = document.getElementById("whiteboard");

            this.bindMethods();

            this.div = document.createElement("div");
    
            this.name = name;
            this.size = size;
            this.position = position;
            this.color = color;
            this.size = size;
            this.type = null;
            this.setType(type);
    
            this.arrayIndex = 0;
            this.updateIndex(Whiteboard.draggables.length);
    
            this.id = null;
            this.setId(id);

            this.status = false;    
    
            this.draggingDiv = false;
    
            var draggableDiv = this.div; // Evidently, Javascript lambdas do not like references to 'this' when they are declared.  Using an intermediate variable works.
    
            this.container = document.createElement("span");
            this.label = document.createElement("input");
            if (!Whiteboard.elementEditing) this.label.readOnly = true;            
            this.div.className = "whiteboard-draggable";
            this.div.background = this.color;
    
            this.setSize(this.size);       
    
            this.div.onmousedown = function(event) {
                if (Whiteboard.elementEditing && event.button === 0) {
                    if (this.draggingDiv) {
                        this.stopDragging();
                    } else {
                        Whiteboard.dragOffset = new Positioning.Vector2d(Positioning.mousePosition.x - draggableDiv.getBoundingClientRect().left, Positioning.mousePosition.y - draggableDiv.getBoundingClientRect().top); 
                        addEventListener("mousemove", this.drag);
                        Whiteboard.logChange();
                        this.draggingDiv = true;
                    }
                }
            }.bind(this);
    
            [document, window, this.div].forEach(((thing) => {thing.onpointerup = this.stopDragging}).bind(this));
    
            draggableDiv.onmouseover = (event) => {
                if (Whiteboard.elementEditing) {event.target.style.cursor = "move"} else if (this.type === "button") {event.target.style.cursor = "pointer"; event.target.style.background = "#ebebe0"} else {event.target.style.cursor = "auto"}
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
            Whiteboard.dragOffset = new Positioning.Vector2d(0, 0);
            this.setPosition(this.div, this.position);
        }

        bindMethods() {
            this.sendDataToRio = this.sendDataToRio.bind(this);
            this.drag = this.drag.bind(this);
            this.stopDragging = this.stopDragging.bind(this);
            this.setName = this.setName.bind(this);
            this.setPosition = this.setPosition.bind(this);
            this.setSize = this.setSize.bind(this);
            this.setColor = this.setColor.bind(this);
            this.setType = this.setType.bind(this);
            this.setId = this.setId.bind(this);
            this.equals = this.equals.bind(this);
        }
    
        sendDataToRio() {
            if (!Whiteboard.elementEditing) {
                try {
                    let data = {};
                    data["id"] = this.id;
                    data["type"] = this.type;
                    if (this.type === "button") {
                        data["status"] = "click";
                    } else if (this.type === "toggle") {
                        data["status"] = this.status.toString();
                    };
                    socket.send(data);
                } catch {
                    console.warn("Unable to send data to RoboRio");
                }
            };
        }

        handleDataFromRio(dataObject) {
            this.status = dataObject.status;
            this.value = dataObject.value;
        }

        updateValue(value) {
            this.div.innerHTML = value;
        }

        drag() { 
            this.setPosition(this.div, Positioning.mousePosition);
        };   

        stopDragging() {
            removeEventListener("mousemove", this.drag); 
            Whiteboard.dragOffset = new Positioning.Vector2d(0, 0);
            this.draggingDiv = false;
        }
    
        setPosition(draggableDiv, pose){
            const x = Positioning.clamp((pose.x - Whiteboard.dragOffset.x), 25, whiteboard.clientWidth - draggableDiv.clientWidth - 25);
            const y = Positioning.clamp((pose.y - Whiteboard.dragOffset.y), 65, whiteboard.clientHeight - draggableDiv.clientHeight - 50);
    
            this.position = new Positioning.Vector2d(x, y);
    
            draggableDiv.style.left = Positioning.toHTMLPositionPX(x);
            draggableDiv.style.top = Positioning.toHTMLPositionPX(y);
            const labelOffset = (draggableDiv.clientWidth - (this.label.clientWidth + getBorderWidth(this.label))) / 2;
            this.label.style.left = Positioning.toHTMLPositionPX(x + labelOffset);
            this.label.style.top = Positioning.toHTMLPositionPX(y + draggableDiv.clientHeight + 10);
        }
        setSize(size) {
            this.size = new Positioning.Vector2d(Positioning.clamp(size.x, 50, whiteboard.clientWidth * 0.75), Positioning.clamp(size.y, 50, whiteboard.clientHeight * 0.75));
            this.div.style.width = Positioning.toHTMLPositionPX(this.size.x);
            this.div.style.height = Positioning.toHTMLPositionPX(this.size.y);
            this.label.style.width = Positioning.toHTMLPositionPX(Positioning.clamp(this.size.x * 0.75, 75, Number.POSITIVE_INFINITY));        
            Whiteboard.dragOffset = new Positioning.Vector2d(0, 0);
            this.setPosition(this.div, this.position);
        }
        setType(type) {
            if (type == undefined || type == null) {
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
        setColor(color) {
            this.color = color;
            this.div.style.background = color;
        }
        updateIndex(index) {
            this.arrayIndex = index;
            this.div.setAttribute("index", index);
        }
        delete() {
            var temp = [];
            var updatedIndex = 0;
            for (let i = 0; i < Whiteboard.draggables.length; i++) {
                if (i != this.arrayIndex) {
                    temp.push(Whiteboard.draggables[i]);
                    Whiteboard.draggables[i].updateIndex(updatedIndex); // Resets the index variable of the draggable so the draggable can find itself in the new Draggable.draggables array
                    updatedIndex++;
                }
            }
            Whiteboard.draggables = temp;
            this.div.parentElement.remove();
        }
        resetProperties(draggable) {
            this.setName(draggable.name);
            this.setPosition(this.div, draggable.position);
            this.setSize(draggable.size);
            this.setColor(draggable.color);
            this.setType(draggable.type);
            this.setId(draggable.id);
        }
        equals(draggable) {
            return draggable.name === this.name && this.position.equals(draggable.position) 
            && this.size.equals(draggable.size) && draggable.color == this.color && draggable.type == this.type && draggable.id == this.id;
        }
    },

    getDraggableIndex: function (draggable) {
        return parseInt(draggable.getAttribute("index"));
    },

    addDefaultDraggable: function () {
        Whiteboard.logChange();
        if (Whiteboard.elementEditing) Whiteboard.draggables.push(new Whiteboard.WhiteboardDraggable("", new Positioning.Vector2d(100, 100), new Positioning.Vector2d(100, 100), "black", "button", null));
    },

    duplicate: function (draggable, keepPosition=false) {
        let position = new Positioning.Vector2d(0, 0);
        if (keepPosition) {
            position = draggable.position;
        }
        let name;
        try {
            name = this.getDraggableName(draggable);
        } catch {
            name = draggable.name;
        }
        Whiteboard.draggables.push(new Whiteboard.WhiteboardDraggable(name, position, draggable.size, draggable.color, draggable.type, draggable.id));
    },


    logChange: function () {
        if (Whiteboard.States.stateIndex != Whiteboard.States.timeline.length) {
            Whiteboard.States.timeline = Whiteboard.States.timeline.slice(0, Whiteboard.States.stateIndex); // If the state index is not at the very end of the timeline, the user must have undone some tasks.  It doesn't make sense to keep those tasks as part of the timeline (they technically don't exist, because they have been undone), so they are deleted.
            Whiteboard.States.endState = null;
        }
        Whiteboard.States.timeline.push((new Whiteboard.WhiteboardState()));
        Whiteboard.States.stateIndex += 1;
    },

    States:  {
        timeline: [],
        stateIndex: 0,
        endState: null,
        clearTimeline: function() {
            Whiteboard.States.timeline = [];
            Whiteboard.States.stateIndex = 0;
            Whiteboard.States.endState = null;
        }
    },

    WhiteboardState: class { //for the undo/redo functionality

        constructor() {
            this.state = Save.getJSON();
        }

        restore() {
            Save.openJSON(this.state);
        }
    },

    getDraggableById: function (id) {
        for (let i = 0; i < Whiteboard.draggables.length; i++) {
            if (Whiteboard.draggables[i].id === id) {
                return Whiteboard.draggables[i];
            }
        }
        return null;
    },

    undoChange: function () {
        if (Whiteboard.States.stateIndex == Whiteboard.States.timeline.length) {
            Whiteboard.States.endState = new Whiteboard.WhiteboardState();
        }
        if (Whiteboard.States.stateIndex > 0) {
            Whiteboard.States.stateIndex -= 1;
        }
        Whiteboard.States.timeline[Whiteboard.States.stateIndex].restore();
    },

    redoChange: function () {
        if (Whiteboard.States.timeline.length > Whiteboard.States.stateIndex) {
            Whiteboard.States.stateIndex += 1;
        }
        if (Whiteboard.States.stateIndex == Whiteboard.States.timeline.length) {
            if (Whiteboard.States.endState != null) Whiteboard.States.endState.restore();
        } else {
            Whiteboard.States.timeline[Whiteboard.States.stateIndex].restore();
        }
    },


    draggables: [],
    dragOffset: null,
    currentDraggable: null,
    currentDraggableDiv: null,
    elementEditing: false,

    redoableStates: [],
    undoableStates: [],

};

window.Whiteboard = Whiteboard || {};