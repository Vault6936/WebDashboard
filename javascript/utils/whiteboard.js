var Whiteboard = {

    WhiteboardDraggable: class {

        static Types =  {
            BUTTON: "button",
            TOGGLE: "toggle",
            SELECTOR: "selector",
            BOOLEAN_TELEMETRY: "boolean telemetry",
            TEXT_TELEMETRY: "text telemetry",
            CAMERA_STREAM: "camera steam",
        };

        constructor(name, position, size, color, type, id, state, typeSpecificData) {
            this.bindMethods();
            this.whiteboard = document.getElementById("whiteboard");

            // #region draggable div
            this.div = document.createElement("div");
            this.selectorContainer = document.createElement("div");
            this.selectorContainer.classList.add("draggable-selectable-container");
            this.div.appendChild(this.selectorContainer);
            this.textContainer = document.createElement("div");
            this.div.appendChild(this.textContainer);
            this.stream = document.createElement("img");
            this.div.appendChild(this.stream);
            this.container = document.createElement("span");
            this.label = document.createElement("input");
            if (!Whiteboard.editingMode) this.label.readOnly = true;   
            this.div.className = "whiteboard-draggable";
            this.div.background = this.color;
            // #endregion 
    
            // #region declare class fields
            this.name = name;
            this.position = position;
            this.size = size;
            this.color = color;
            this.type = null;
            if (typeSpecificData != undefined) this.typeSpecificData = typeSpecificData; else this.typeSpecificData = {};
            try {
                this.typeSpecificData.selectableNames = typeSpecificData.selectableNames;
            } catch {
                this.typeSpecificData.selectableNames = [];
            };
            this.selectableGroup = null;
            this.setType(type);
            this.state = state == undefined ? false : state;    
            this.setState(this.state);
            this.arrayIndex = 0;
            this.updateIndex(Whiteboard.draggables.length);    
            this.id = null;
            this.setId(id);
            // #endregion
    
            // #region dragging functionality
            this.draggingDiv = false;
            this.setSize(this.size);    
            this.div.onmousedown = function(event) {
                if (Whiteboard.editingMode && event.button === 0) {
                    if (this.draggingDiv) {
                        this.stopDragging();
                    } else {
                        Whiteboard.dragOffset = new Positioning.Vector2d(Positioning.mousePosition.x - this.div.getBoundingClientRect().left, Positioning.mousePosition.y - this.div.getBoundingClientRect().top); 
                        addEventListener("mousemove", this.mouseDrag);
                        Whiteboard.logChange();
                        this.draggingDiv = true;
                    }
                }
            }.bind(this);    
            [document, window, this.div].forEach(((thing) => {thing.onpointerup = this.stopDragging; thing.onmouseup = this.stopDragging}).bind(this));    
            this.div.onmouseover = (event) => {
                if (Whiteboard.editingMode) {event.target.style.cursor = "move"} else if (this.type === "button") {event.target.style.cursor = "pointer"; event.target.style.background = "#0098cb"} else {event.target.style.cursor = "auto"}
            }
            this.div.onmouseleave = (event) => {event.target.style.background = this.color}
            this.div.dispatchEvent(new Event("mouseleave")); //If this event isn't dispatched, the program might glitch and cause the element to think the mouse is over it
            // #endregion

            // #region set initial position
            this.container.appendChild(this.div);
            this.whiteboard.appendChild(this.container);
            this.label.setAttribute("type", "text");
            this.label.className = "whiteboard-label";
            this.label.placeholder = "Untitled";
            this.label.value = this.name;
            this.container.appendChild(this.label);
            Whiteboard.dragOffset = new Positioning.Vector2d(0, 0);
            this.setPosition(this.position);
            this.div.onclick = this.handleClick;
            // #endregion
        }

        bindMethods() {
            this.setToggleStatus = this.setState.bind(this);
            this.sendDataToRio = this.handleClick.bind(this);
            this.mouseDrag = this.mouseDrag.bind(this);
            this.stopDragging = this.stopDragging.bind(this);
            this.setName = this.setName.bind(this);
            this.setPosition = this.setPosition.bind(this);
            this.setSize = this.setSize.bind(this);
            this.setColor = this.setColor.bind(this);
            this.setType = this.setType.bind(this);
            this.setId = this.setId.bind(this);
            this.setStreamURL = this.setStreamURL.bind(this);
            this.handleClick = this.handleClick.bind(this);
            this.generateSelectorHTML = this.generateSelectorHTML.bind(this);
            this.getShallowCopy = this.getShallowCopy.bind(this);
        }

        generateSelectorHTML(selectableNames) {
            if (selectableNames == undefined) return;
            this.typeSpecificData.selectableNames = selectableNames;
            this.selectorContainer.innerHTML = "";
            this.selectableGroup = new Popup.SelectableGroup();
            for (let i = 0; i < selectableNames.length; i++) {
                this.selectableGroup.add(new Popup.Selectable(selectableNames[i], (() => {this.state = selectableNames[i]}).bind(this), "draggable-unselect", "draggable-select", true));
            }
            this.selectableGroup.generateHTML(this.selectorContainer);
        }

        setState(state) {
            try {
                this.state = state;
                if (this.type === Whiteboard.WhiteboardDraggable.Types.TOGGLE || this.type === Whiteboard.WhiteboardDraggable.Types.BOOLEAN_TELEMETRY) {
                    if (state) {
                        this.setColor("limegreen");
                    } else {
                        this.setColor("red");
                    }      
                } else if (this.type === Whiteboard.WhiteboardDraggable.Types.TEXT_TELEMETRY) {
                    this.textContainer.innerHTML = state;
                } else if (this.type === Whiteboard.WhiteboardDraggable.Types.SELECTOR) {
                    let toSelect = null;
                    for (let i = 0; i < this.selectableGroup.selectables.length; i++) {
                        if (this.selectableGroup.selectables[i].name == state) {
                            toSelect = this.selectableGroup.selectables[i];
                        }
                    }
                    if (toSelect == null) {
                        return;
                    }
                    this.selectableGroup.select(toSelect);
                    this.state = toSelect.name;
                }
            } catch {
                Notify.createNotice("Could not apply draggable state", "negative", 2000);
            }
        }
    
        handleClick() {
            if (!Whiteboard.editingMode) {
                if (this.type == Whiteboard.WhiteboardDraggable.Types.TOGGLE) {
                    this.setState(!this.state);
                }
                if (this.type === Whiteboard.WhiteboardDraggable.Types.BUTTON || this.type === Whiteboard.WhiteboardDraggable.Types.TOGGLE) {
                    try {
                        let data = {};
                        data["id"] = this.id;
                        data["type"] = this.type;
                        if (this.type === Whiteboard.WhiteboardDraggable.Types.BUTTON) {
                            data["state"] = "click";
                        } else if (this.type === Whiteboard.WhiteboardDraggable.Types.TOGGLE) {
                            data["state"] = this.state.toString();
                        };
                        Socket.websocket.send(data);
                    } catch {
                        console.warn("Unable to send data to RoboRio");
                    }
                }
            }
        }

        handleDataFromRio(dataObject) {
            this.setState(dataObject.state);
        }

        updateValue(value) {
            this.div.innerHTML = value;
        }

        mouseDrag() { 
            this.setPosition(Positioning.mousePosition);
        };   

        stopDragging() {
            removeEventListener("mousemove", this.mouseDrag); 
            Whiteboard.dragOffset = new Positioning.Vector2d(0, 0);
            this.draggingDiv = false;
        }
    
        setPosition(pose){
            const x = Positioning.clamp((pose.x - Whiteboard.dragOffset.x), 25, this.whiteboard.clientWidth - this.div.clientWidth - 25);
            const y = Positioning.clamp((pose.y - Whiteboard.dragOffset.y), 65, this.whiteboard.clientHeight - this.div.clientHeight - 50);
    
            this.position = new Positioning.Vector2d(x, y);
    
            this.div.style.left = Positioning.toHTMLPositionPX(x);
            this.div.style.top = Positioning.toHTMLPositionPX(y);
            const labelOffset = (this.div.clientWidth - (this.label.clientWidth + getBorderWidth(this.label))) / 2;
            this.label.style.left = Positioning.toHTMLPositionPX(x + labelOffset);
            this.label.style.top = Positioning.toHTMLPositionPX(y + this.div.clientHeight + 10);
        }
        setSize(size) {
            this.size = new Positioning.Vector2d(Positioning.clamp(size.x, 50, this.whiteboard.clientWidth * 0.75), Positioning.clamp(size.y, 50, this.whiteboard.clientHeight * 0.75));
            this.div.style.width = Positioning.toHTMLPositionPX(this.size.x);
            this.div.style.height = Positioning.toHTMLPositionPX(this.size.y);
            this.label.style.width = Positioning.toHTMLPositionPX(Positioning.clamp(this.size.x * 0.75, 75, Number.POSITIVE_INFINITY));        
            Whiteboard.dragOffset = new Positioning.Vector2d(0, 0); // Calling setPosition() will take into account the dragOffset variable.  This isn't desirable here, so it is set to (0, 0)
            this.setPosition(this.position); // If this method is not called, the position of the label relative to that of the div will be wrong
        }
        setType(type) {
            this.div.style.overflow = "hidden";
            this.selectorContainer.innerHTML = "";
            this.stream.src = "";
            if (type == undefined || type == null) {
                type = "button";
            } else if (type === Whiteboard.WhiteboardDraggable.Types.TOGGLE) {
                this.setColor("red");
            } else if (type === Whiteboard.WhiteboardDraggable.Types.SELECTOR) {
                this.generateSelectorHTML(this.typeSpecificData.selectableNames);
            } else if (this.type === Whiteboard.WhiteboardDraggable.Types.TEXT_TELEMETRY) {
                this.div.innerHTML = this.state;
                this.div.style.overflow = "scroll";
            } else if (type === Whiteboard.WhiteboardDraggable.Types.CAMERA_STREAM) {
                this.setStreamURL(this.typeSpecificData.streamURL);
            }
            this.type = type;
            if (type !== Whiteboard.WhiteboardDraggable.Types.TEXT_TELEMETRY) { // Because of aysnchronous functions that may run while this function is running, this code cannot be called at the top of the function (the text container may simply be populated again)
                this.textContainer.innerHTML = "";
            }
        }
        setName(name) {
            this.name = name;
        }
        setId(id) {
            if (id == null || id == "undefined" || id == "") {
                id = `${this.type.replace(" ", "_")}_${this.arrayIndex}`;
            }
            this.div.id = id;
            this.id = id;
        }
        setColor(color) {
            this.color = color;
            this.div.style.background = color;
        }
        setStreamURL(url) {
            this.typeSpecificData.streamURL = url;
            this.stream.url = url;
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
                    Whiteboard.draggables[i].updateIndex(updatedIndex); // Resets the index variable of the draggable so the draggable can find itself in the new draggables array
                    updatedIndex++;
                }
            }
            Whiteboard.draggables = temp;
            this.div.parentElement.remove();
        }
        getShallowCopy() {
            let object = {};
            object.name = this.name;
            object.position = this.position;
            object.size = this.size;
            object.color = this.color;
            object.type = this.type;
            object.id = this.id;
            object.state = this.state;
            object.typeSpecificData = this.typeSpecificData;
            return object;
        }
    },

    getDraggableIndex: function (draggable) {
        return parseInt(draggable.getAttribute("index"));
    },

    addDefaultDraggable: function () {
        Whiteboard.logChange();
        if (Whiteboard.editingMode) Whiteboard.draggables.push(new Whiteboard.WhiteboardDraggable("", new Positioning.Vector2d(100, 100), new Positioning.Vector2d(100, 100), "#0098cb", "button", null));
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
        Socket.sendState();
        let state = new Whiteboard.WhiteboardState();
        if (Whiteboard.States.stateIndex != Whiteboard.States.timeline.length) {
            Whiteboard.States.timeline = Whiteboard.States.timeline.slice(0, Whiteboard.States.stateIndex); // If the state index is not at the very end of the timeline, the user must have undone some tasks.  It doesn't make sense to keep those tasks as part of the timeline (they technically don't exist, because they have been undone), so they are deleted.
            Whiteboard.States.endState = null;
        }
        Whiteboard.States.timeline.push(state);
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
            this.state = Load.getLayoutJSONString();
        }

        restore() {
            Load.openJSON(this.state);
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

    handleStateEquality: function () {

    },

    undoChange: function () {
        if (!Whiteboard.editingMode) {
            return;
        }
        if (Whiteboard.States.timeline.length == 0) return;
        if (Whiteboard.States.stateIndex == Whiteboard.States.timeline.length) {
            Whiteboard.States.endState = new Whiteboard.WhiteboardState();
        }
        if (Whiteboard.States.stateIndex > 0) {
            Whiteboard.States.stateIndex -= 1;
        }
        if (Whiteboard.States.timeline[Whiteboard.States.stateIndex].state == Load.getLayoutJSONString() && Whiteboard.States.stateIndex > 0) {
            Whiteboard.States.stateIndex -= 1;
        }
        Whiteboard.States.timeline[Whiteboard.States.stateIndex].restore();
    },

    redoChange: function () {
        if (!Whiteboard.editingMode) {
            return;
        }
        if (Whiteboard.States.timeline.length > Whiteboard.States.stateIndex) {
            Whiteboard.States.stateIndex += 1;
        }
        try {
            if (Whiteboard.States.timeline[Whiteboard.States.stateIndex].state == Load.getLayoutJSONString() && Whiteboard.States.timeline.length > Whiteboard.States.stateIndex) {
                Whiteboard.States.stateIndex += 1;
            }
        } catch {} 
        if (Whiteboard.States.stateIndex == Whiteboard.States.timeline.length) {
            if (Whiteboard.States.endState != null) Whiteboard.States.endState.restore();
        } else {
            Whiteboard.States.timeline[Whiteboard.States.stateIndex].restore();
        }        
    },

    toggleEditingMode: function () {
        var editingToggle = document.getElementById("editingToggle");
        var labels = document.getElementsByClassName("whiteboard-label");
        var editModeOnlyBtns = document.getElementsByClassName("edit-mode-only");
        var border = document.getElementById("whiteboard-border");
        if (Whiteboard.editingMode) {
            border.style.display = "none";
            editingToggle.innerHTML = "turn on editing mode";
            Array.from(labels).forEach((label) => label.readOnly = true);
            Array.from(editModeOnlyBtns).forEach((button) => button.style.display = "none");
            this.draggables.forEach((draggable) => {draggable.div.title = ""});
        } else {
            border.style.display = "block";
            editingToggle.innerHTML = "turn off editing mode";
            Array.from(labels).forEach((label) => label.readOnly = false);
            Array.from(editModeOnlyBtns).forEach((button) => button.style.display = "block");
            this.draggables.forEach((draggable) => {draggable.div.title = `ID: ${draggable.id}`});
        }
        Whiteboard.editingMode = !Whiteboard.editingMode;
    },

    draggables: [],
    dragOffset: null,
    currentDraggable: null,
    editingMode: false,

    redoableStates: [],
    undoableStates: [],

};

window.Whiteboard = Whiteboard || {};