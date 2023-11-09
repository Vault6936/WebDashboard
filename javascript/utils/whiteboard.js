var Whiteboard = {

    WhiteboardDraggable: class {

        static Types = {
            BUTTON: "button",
            TOGGLE: "toggle",
            SELECTOR: "selector",
            BOOLEAN_TELEMETRY: "boolean telemetry",
            TEXT_TELEMETRY: "text telemetry",
            CAMERA_STREAM: "camera stream",
        };

        name;
        position;
        size;
        color;
        layer;
        type;
        id;
        state;
        typeSpecificData;

        constructor(name, position, size, color, layer, type, id, state, typeSpecificData) {
            this.bindMethods();
            this.whiteboard = document.getElementById("whiteboard");

            // #region draggable div
            this.div = document.createElement("div");
            this.selectorContainer = document.createElement("div");
            this.selectorContainer.classList.add("draggable-selectable-container");
            this.div.appendChild(this.selectorContainer);
            this.textContainer = document.createElement("div");
            this.textContainer.classList.add("draggable-text-container");
            this.div.appendChild(this.textContainer);
            this.stream = document.createElement("img");
            this.stream.setAttribute("draggable", false);
            this.stream.classList.add("camera-stream");
            this.div.appendChild(this.stream);
            this.container = document.createElement("span");
            this.label = document.createElement("input");
            if (!Whiteboard.editingMode) this.label.readOnly = true;
            this.div.className = "whiteboard-draggable";
            // #endregion 

            // #region declare class fields
            this.name = name;
            this.position = position;
            this.setColor(color);
            this.setLayer(layer);
            if (typeSpecificData == undefined) this.typeSpecificData = {}; else this.typeSpecificData = typeSpecificData;
            this.setStreamSize(this.typeSpecificData.streamSize);
            this.selectableGroup = null;
            this.setType(type);
            this.setState(state);
            this.arrayIndex = 0;
            this.updateIndex(Whiteboard.draggableRegistry.length);
            this.setId(id);
            // #endregion

            // #region dragging functionality
            this.draggingDiv = false;
            this.setSize(size);
            this.div.onmousedown = function (event) {
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
            [document, window, this.div].forEach(((thing) => { thing.onpointerup = this.stopDragging; thing.onmouseup = this.stopDragging }).bind(this));
            this.div.onmouseover = (event) => {
                if (Whiteboard.editingMode) { event.target.style.cursor = "move" } else if (this.type === Whiteboard.WhiteboardDraggable.Types.BUTTON || this.type === Whiteboard.WhiteboardDraggable.Types.TOGGLE) { event.target.style.cursor = "pointer"; if (this.type === Whiteboard.WhiteboardDraggable.Types.BUTTON) event.target.style.background = "#0098cb" } else { event.target.style.cursor = "auto" }
            }
            this.div.onmouseleave = (event) => { event.target.style.background = this.color }
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
            this.setLayer = this.setLayer.bind(this);
            this.setType = this.setType.bind(this);
            this.setId = this.setId.bind(this);
            this.setStreamURL = this.setStreamURL.bind(this);
            this.setStreamSize = this.setStreamSize.bind(this);
            this.setState = this.setState.bind(this);
            this.sendState = this.sendState.bind(this);
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
                this.selectableGroup.add(new Popup.Selectable(selectableNames[i], (() => { this.state = selectableNames[i]; this.sendState() }).bind(this), "draggable-unselect", "draggable-select", true));
            }
            this.selectableGroup.generateHTML(this.selectorContainer);
        }

        setState(state) {
            try {
                this.state = state;
                if (this.type === Whiteboard.WhiteboardDraggable.Types.TOGGLE || this.type === Whiteboard.WhiteboardDraggable.Types.BOOLEAN_TELEMETRY) {
                    this.state = String(this.state);
                    if (this.state == "true") {
                        this.setColor("limegreen");
                    } else {
                        this.setColor("red");
                    }
                } else if (this.type === Whiteboard.WhiteboardDraggable.Types.TEXT_TELEMETRY) {
                    this.textContainer.style.display = "block";
                    this.textContainer.innerHTML = state;
                } else if (this.type === Whiteboard.WhiteboardDraggable.Types.SELECTOR) {
                    let toSelect = null;
                    for (let i = 0; i < this.selectableGroup.selectables.length; i++) {
                        if (this.selectableGroup.selectables[i].name == state) {
                            toSelect = this.selectableGroup.selectables[i];
                        }
                    }
                    if (toSelect == null) throw new Error("Selector node does not have requested state");
                    this.selectableGroup.select(toSelect);
                    this.state = toSelect.name;
                }
            } catch (err) {
                console.warn(err);
                Notify.createNotice("Could not apply draggable state", "negative", 2000);
            }
        }

        sendState() {
            let data = { message: {} };
            data.message.configuration = {
                id: this.id,
                state: this.state,
            };
            data.message.clientID = Socket.clientID;
            data.message.messageType = "node update";
            data = JSON.stringify(data);
            Socket.sendData(data);
        }

        handleClick() {
            if (!Whiteboard.editingMode) {
                if (this.type == Whiteboard.WhiteboardDraggable.Types.TOGGLE) {
                    let state = "false";
                    if (this.state == "false") state = true;
                    this.setState(state);
                    this.sendState();
                }
                if (this.type === Whiteboard.WhiteboardDraggable.Types.BUTTON) {
                    data = { message: {} };
                    data.message.nodeID = this.id;
                    data.message.clientID = Socket.clientID;
                    data.message.messageType = "click";
                    data = JSON.stringify(data);
                    Socket.sendData(data);
                }
            }
        }



        mouseDrag() {
            this.setPosition(Positioning.mousePosition);
        }

        stopDragging() {
            removeEventListener("mousemove", this.mouseDrag);
            Whiteboard.dragOffset = new Positioning.Vector2d(0, 0);
            this.draggingDiv = false;
        }

        setName(name) {
            this.name = name;
        }

        setPosition(pose) {
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

        setColor(color) {
            this.color = color;
            this.div.style.background = color;
        }

        setLayer(layer, arrangeOthers = true) {
            layer = Positioning.clamp(layer, 0, Whiteboard.draggableRegistry.length);
            this.div.style.zIndex = 1000 + 2 * layer;
            this.label.style.zIndex = 1001 + 2 * layer;
            if (this.layer != undefined && layer != this.layer && arrangeOthers) { // this.layer is equivalent to the prior draggable layer, and layer is equivalent to the new layer
                Whiteboard.draggableRegistry.forEach((draggable) => {
                    if (draggable.arrayIndex == this.arrayIndex) return; // The draggable should not be doing any extra operations on itself
                    if (layer > this.layer) { // If the layer has been bumped up
                        if (draggable.layer > this.layer && draggable.layer <= layer) { // If the draggable has been moved up from layer a to layer b, each layer after layer a and through layer b should be dropped down by one layer
                            draggable.setLayer(draggable.layer - 1, false);
                        }
                    } else { // If the layer has been bumped down
                        if (draggable.layer >= layer && draggable.layer < this.layer) { // If the draggable has been moved down from layer b to layer a, each layer from layer a until layer be should be moved up by one layer
                            draggable.setLayer(draggable.layer + 1, false);
                        }
                    }
                });
            }
            this.layer = layer;
        }

        setType(type) {
            this.textContainer.style.display = "none";
            this.selectorContainer.innerHTML = "";
            this.selectorContainer.style.display = "none";
            this.stream.style.display = "none";
            this.stream.src = "";
            if (this.type != type && this.type != undefined) {
                this.state = "";
            }
            if (type == undefined || type == null) {
                type = "button";
            } else if (type === Whiteboard.WhiteboardDraggable.Types.TOGGLE) {
                this.setColor("red");
            } else if (type === Whiteboard.WhiteboardDraggable.Types.SELECTOR) {
                this.selectorContainer.style.display = "grid";
                this.generateSelectorHTML(this.typeSpecificData.selectableNames);
            } else if (this.type === Whiteboard.WhiteboardDraggable.Types.TEXT_TELEMETRY) {
                this.textContainer.style.display = "block";
                this.textContainer.innerHTML = this.state;
                console.log("hi");
            } else if (type === Whiteboard.WhiteboardDraggable.Types.BOOLEAN_TELEMETRY) {
                this.setColor("red");
            } else if (type === Whiteboard.WhiteboardDraggable.Types.CAMERA_STREAM) {
                this.stream.style.display = "block";
                this.setStreamURL(this.typeSpecificData.streamURL);
            }
            this.type = type;
        }

        setStreamSize(size) {
            if (size == undefined) return;
            this.typeSpecificData.streamSize = size;
            this.stream.style.width = Positioning.toHTMLPositionPX(size.x);
            this.stream.style.height = Positioning.toHTMLPositionPX(size.y);
        }

        setId(id) {
            if (id == null || id == "undefined" || id == "") {
                id = `${this.type.replace(" ", "_")}_${this.arrayIndex}`;
            }
            this.div.id = id;
            this.id = id;
            if (Whiteboard.editingMode) this.div.title = `ID: ${this.id}`;
        }

        setStreamURL(url) {
            this.typeSpecificData.streamURL = url;
            this.stream.src = url;
        }

        updateIndex(index) {
            this.arrayIndex = index;
            this.div.setAttribute("index", index);
        }

        delete() {
            var temp = [];
            var updatedIndex = 0;
            for (let i = 0; i < Whiteboard.draggableRegistry.length; i++) {
                if (i != this.arrayIndex) {
                    temp.push(Whiteboard.draggableRegistry[i]);
                    Whiteboard.draggableRegistry[i].updateIndex(updatedIndex); // Resets the index variable of the draggable so the draggable can find itself in the new draggableRegistry array
                    updatedIndex++;
                }
            }
            Whiteboard.draggableRegistry = temp;
            this.div.parentElement.remove();
        }

        getShallowCopy() {
            let object = {};
            object.name = this.name;
            object.position = this.position;
            object.size = this.size;
            object.color = this.color;
            object.layer = this.layer;
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
        if (Whiteboard.editingMode) Whiteboard.draggableRegistry.push(new Whiteboard.WhiteboardDraggable("", new Positioning.Vector2d(100, 100), new Positioning.Vector2d(100, 100), "#0098cb", Whiteboard.draggableRegistry.length, "button", null));
    },

    duplicate: function (draggable, keepPosition = false) {
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
        Whiteboard.draggableRegistry.push(new Whiteboard.WhiteboardDraggable(name, position, draggable.size, draggable.color, Whiteboard.draggableRegistry.length, draggable.type, null, null, draggable.typeSpecificData));
    },

    getDraggableAncestor: function (element, recursion) {
        if (recursion == undefined) recursion = 0;
        if (element == null || element.classList.contains("whiteboard-draggable")) {
            return element;
        } else if (recursion < 10) {
            return Whiteboard.getDraggableAncestor(element.parentElement, recursion + 1);
        }
        return null;
    },

    // #region undo/redo functionality
    logChange: function () {
        Socket.sendLayout();
        let state = new Whiteboard.WhiteboardState();
        if (Whiteboard.States.stateIndex != Whiteboard.States.timeline.length) {
            Whiteboard.States.timeline = Whiteboard.States.timeline.slice(0, Whiteboard.States.stateIndex); // If the state index is not at the very end of the timeline, the user must have undone some tasks.  It doesn't make sense to keep those tasks as part of the timeline (they technically don't exist, because they have been undone), so they are deleted.
            Whiteboard.States.endState = null;
        }
        Whiteboard.States.timeline.push(state);
        Whiteboard.States.stateIndex += 1;
    },

    States: {
        timeline: [],
        stateIndex: 0,
        endState: null,
        clearTimeline: function () {
            Whiteboard.States.timeline = [];
            Whiteboard.States.stateIndex = 0;
            Whiteboard.States.endState = null;
        }
    },

    WhiteboardState: class {

        constructor() {
            this.state = Load.getLayoutJSONString();
        }

        restore() {
            Load.openJSON(this.state);
        }
    },

    getDraggableById: function (id) {
        for (let i = 0; i < Whiteboard.draggableRegistry.length; i++) {
            if (Whiteboard.draggableRegistry[i].id === id) {
                return Whiteboard.draggableRegistry[i];
            }
        }
        return null;
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
        } catch { }
        if (Whiteboard.States.stateIndex == Whiteboard.States.timeline.length) {
            if (Whiteboard.States.endState != null) Whiteboard.States.endState.restore();
        } else {
            Whiteboard.States.timeline[Whiteboard.States.stateIndex].restore();
        }
    },
    // #endregion

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
            this.draggableRegistry.forEach((draggable) => { draggable.div.title = "" });
        } else {
            border.style.display = "block";
            editingToggle.innerHTML = "turn off editing mode";
            Array.from(labels).forEach((label) => label.readOnly = false);
            Array.from(editModeOnlyBtns).forEach((button) => button.style.display = "block");
            this.draggableRegistry.forEach((draggable) => { draggable.div.title = `ID: ${draggable.id}` });
        }
        Whiteboard.editingMode = !Whiteboard.editingMode;
    },

    draggableRegistry: [],
    dragOffset: null,
    currentDraggable: null,
    editingMode: false,
};

window.Whiteboard = Whiteboard || {};