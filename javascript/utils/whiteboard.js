var Whiteboard = {

    WhiteboardDraggable: class {

        static Types = {
            BUTTON: "button",
            TOGGLE: "toggle",
            SELECTOR: "selector",
            BOOLEAN_TELEMETRY: "boolean telemetry",
            TEXT_TELEMETRY: "text telemetry",
            TEXT_INPUT: "text input",
            CAMERA_STREAM: "camera stream",
            GRAPH: "position graph",
            LABEL: "label",
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
            this.textField = document.createElement("textarea");
            this.textField.classList.add("draggable-text-field");
            this.textField.oninput = this.handleTyping;
            this.div.appendChild(this.textField);
            this.stream = document.createElement("img");
            this.stream.setAttribute("draggable", false);
            this.stream.classList.add("camera-stream");
            this.div.appendChild(this.stream);
            this.canvas = document.createElement("canvas");
            this.canvas.classList.add("canvas");
            this.context = this.canvas.getContext("2d");
            this.context.imageSmoothingEnabled = false;
            this.div.appendChild(this.canvas);
            this.container = document.createElement("span");
            this.label = document.createElement("input");
            if (!Whiteboard.editingMode) this.label.readOnly = true;
            this.div.className = "whiteboard-draggable";
            // #endregion 

            // #region declare class fields
            this.name = name;
            this.position = position;
            this.setSize(size);
            this.setColor(color);
            this.setLayer(layer, false);
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
                if (Whiteboard.editingMode) { event.target.style.cursor = "move" } else if (this.type === Whiteboard.WhiteboardDraggable.Types.BUTTON || this.type === Whiteboard.WhiteboardDraggable.Types.TOGGLE) { event.target.style.cursor = "pointer"; if (this.type === Whiteboard.WhiteboardDraggable.Types.BUTTON) event.target.style.background = WhiteboardSettings.Themes.selectedTheme.attributes.nodeHover } else { event.target.style.cursor = "auto" }
            }
            this.div.onmouseleave = (event) => { event.target.style.background = this.color }
            this.div.dispatchEvent(new Event("mouseleave")); //If this event isn't dispatched, the program might glitch and cause the element to think the mouse is over it
            // #endregion

            // #region set initial position
            this.container.appendChild(this.div);
            this.whiteboard.appendChild(this.container);
            this.label.setAttribute("type", "text");
            this.label.className = "whiteboard-label";
            this.label.style.background = WhiteboardSettings.Themes.selectedTheme.attributes.draggableLabelColor;
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
            this.handleTyping = this.handleTyping.bind(this);
            this.generateSelectorHTML = this.generateSelectorHTML.bind(this);
            this.getShallowCopy = this.getShallowCopy.bind(this);
            this.transformCanvasCoordinates = this.transformCanvasCoordinates.bind(this);
        }

        generateSelectorHTML(selectableNames) {
            if (selectableNames == undefined) return;
            this.typeSpecificData.selectableNames = selectableNames;
            this.selectorContainer.innerHTML = "";
            this.selectableGroup = new Popup.SelectableGroup();
            for (let i = 0; i < selectableNames.length; i++) {
                this.selectableGroup.add(new Popup.Selectable(selectableNames[i], (() => { this.state = selectableNames[i]; this.sendState() }).bind(this), WhiteboardSettings.Themes.selectedTheme.draggableUnselect, WhiteboardSettings.Themes.selectedTheme.draggableSelect, true));
            }
            this.selectableGroup.generateHTML(this.selectorContainer);
        }

        setState(state) {
            try {
                this.state = state;
                if (this.type === Whiteboard.WhiteboardDraggable.Types.TOGGLE || this.type === Whiteboard.WhiteboardDraggable.Types.BOOLEAN_TELEMETRY) {
                    this.state = String(this.state);
                    if (this.state === "true") {
                        this.setColor("limegreen");
                    } else {
                        this.setColor("red");
                    }
                } else if (this.type === Whiteboard.WhiteboardDraggable.Types.TEXT_TELEMETRY) {
                    this.textContainer.innerHTML = state;
                } else if (this.type === Whiteboard.WhiteboardDraggable.Types.TEXT_INPUT) {
                    this.textField.innerHTML = state;
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
                } else if (this.type === Whiteboard.WhiteboardDraggable.Types.GRAPH) {
                    let x = 0;
                    let y = 0;
                    let heading = 0;
                    try {
                        x = parseFloat(state.match(/x:-?[0-9.]*/)[0].replace("x:", ""));
                        y = parseFloat(state.match(/y:-?[0-9.]*/)[0].replace("y:", ""));
                        heading = parseFloat(state.match(/heading:-?[0-9.]*/)[0].replace("heading:", ""));
                    } catch {
                        Notify.createNotice("Couldn't read robot position info!", "negative", 3000)
                    }
                    this.drawGraph(x, y, heading);
                }
            } catch (err) {
                console.warn(err);
                Notify.createNotice("Could not apply draggable state", "negative", 2000);
            }
        }

        drawGraph(botX, botY, heading) {
            const x = 0;
            const y = 0;
            this.context.clearRect(0, 0, (this.size.x - 10), (this.size.y - 10));
            let spacing = 25;
            let lineColor = "#f0f0f5";
            for (let i = 0; i < Math.ceil((this.size.y - 10) / spacing); i++) {
                this.drawLine(new Positioning.Vector2d(-(this.size.x - 10) / 2, spacing * i), new Positioning.Vector2d((this.size.x - 10) / 2, spacing * i), lineColor);
                this.drawLine(new Positioning.Vector2d(-(this.size.x - 10) / 2, -spacing * (i + 1)), new Positioning.Vector2d((this.size.x - 10) / 2, -spacing * (i + 1)), lineColor);
           }
            for (let i = 0; i < Math.ceil((this.size.x - 10) / spacing); i++) {
                this.drawLine(new Positioning.Vector2d(spacing * i, -(this.size.y - 10) / 2), new Positioning.Vector2d(spacing * i, (this.size.y - 10) / 2), lineColor);
                this.drawLine(new Positioning.Vector2d(-spacing * (i + 1), -(this.size.y - 10) / 2), new Positioning.Vector2d(-spacing * (i + 1), (this.size.y - 10) / 2), lineColor);
            }
            this.context.fillStyle = "#000000";
            this.context.font = "15px Roboto";
            this.context.fillText("x: " + botX, 10, 20);
            this.context.fillText("y: " + botY, 10, 40);
            this.context.fillText("heading: " + Math.round((heading * 180 / Math.PI) % 360), 10, 60);                 
            this.drawRect(new Positioning.Pose2d(new Positioning.Vector2d(botX, botY), heading), 50, 50, "#3973ac");
            this.drawArrow(new Positioning.Pose2d(new Positioning.Vector2d(botX, botY), heading), 40, 40, "white");
        }

        transformCanvasCoordinates(pose) {
            let x = pose.x;
            let y = pose.y;
            x += (this.size.x - 10) / 2;
            y = (this.size.y - 10) / 2 - y;
            return new Positioning.Vector2d(x, y); 
        }

        rotate(point1, point2, angle) {
            let x = (point1.x - point2.x) * Math.cos(angle) - (point1.y - point2.y) * Math.sin(angle) + point2.x;
            let y = (point1.x - point2.x) * Math.sin(angle) + (point1.y - point2.y) * Math.cos(angle) + point2.y;
            return new Positioning.Vector2d(x, y);
        }

        drawLine(point1, point2, color="#000000") {
            point1 = this.transformCanvasCoordinates(point1);
            point2 = this.transformCanvasCoordinates(point2);
            this.context.strokeStyle = color;
            this.context.beginPath();
            this.context.moveTo(point1.x, point1.y);
            this.context.lineTo(point2.x, point2.y);
            this.context.closePath();
            this.context.stroke();
        }

        drawShape(vectors, color="#000000") {
            this.context.fillStyle = color;
            this.context.beginPath();
            this.context.moveTo(vectors[0].x, vectors[0].y);
            for (let i = 1; i < vectors.length; i++) {
                this.context.lineTo(vectors[i].x, vectors[i].y);
            }
            this.context.lineTo(vectors[0].x, vectors[0].y);
            this.context.closePath();
            this.context.fill();
        }


        drawArrow(pose, width, height, color="red") {
            let x = pose.vector.x;
            let y = pose.vector.y;

            let vectors = [
                this.transformCanvasCoordinates(this.rotate(new Positioning.Vector2d(x - width / 6, y - height / 2), pose.vector, pose.rotation)),
                this.transformCanvasCoordinates(this.rotate(new Positioning.Vector2d(x - width / 6, y + height / 5), pose.vector, pose.rotation)),
                this.transformCanvasCoordinates(this.rotate(new Positioning.Vector2d(x - width / 2, y + height / 5), pose.vector, pose.rotation)),
                this.transformCanvasCoordinates(this.rotate(new Positioning.Vector2d(x, y + height / 2), pose.vector, pose.rotation)),
                this.transformCanvasCoordinates(this.rotate(new Positioning.Vector2d(x + width / 2, y + height / 5), pose.vector, pose.rotation)),
                this.transformCanvasCoordinates(this.rotate(new Positioning.Vector2d(x + width / 6, y + height / 5), pose.vector, pose.rotation)),
                this.transformCanvasCoordinates(this.rotate(new Positioning.Vector2d(x + width / 6, y - height / 2), pose.vector, pose.rotation)),
            ];

            this.drawShape(vectors, color);
        }

        drawRect(pose, width, height, color="#000000") {
            let x = pose.vector.x;
            let y = pose.vector.y;

            let vectors = [
                this.transformCanvasCoordinates(this.rotate(new Positioning.Vector2d(x - width / 2, y - height / 2), pose.vector, pose.rotation)),
                this.transformCanvasCoordinates(this.rotate(new Positioning.Vector2d(x - width / 2, y + height / 2), pose.vector, pose.rotation)),
                this.transformCanvasCoordinates(this.rotate(new Positioning.Vector2d(x + width / 2, y + height / 2), pose.vector, pose.rotation)),
                this.transformCanvasCoordinates(this.rotate(new Positioning.Vector2d(x + width / 2, y - height / 2), pose.vector, pose.rotation)),
            ];

            this.drawShape(vectors, color);
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
            this.canvas.style.width = Positioning.toHTMLPositionPX(this.size.x - 10);
            this.canvas.style.height = Positioning.toHTMLPositionPX(this.size.y - 10);
            this.canvas.width = this.size.x - 10;
            this.canvas.height = this.size.y - 10;
        }

        setColor(color) {
            this.color = color;
            this.div.style.background = color;
        }

        setLayer(layer, arrangeOthers = true) {
            if (layer == this.layer) return;
            this.div.style.zIndex = 1000 + 2 * layer;
            this.label.style.zIndex = 1001 + 2 * layer;
            if (this.layer != undefined && arrangeOthers) { // this.layer is equivalent to the prior draggable layer, and layer is equivalent to the new layer
                if (layer > this.layer) {
                    for (let i = layer; i > this.layer; i--) {
                        Whiteboard.draggableRegistry[i].setLayer(i - 1, false);
                    }
                } else {
                    for (let i = layer; i < this.layer; i++) {
                        Whiteboard.draggableRegistry[i].setLayer(i + 1, false);
                    }
                }
            }
            this.layer = layer;
        }

        handleTyping() {
            this.state = this.textField.value;
            this.sendState();
        }

        setType(type) {
            this.textContainer.style.display = "none";
            this.textField.style.display = "none";
            this.selectorContainer.innerHTML = "";
            this.selectorContainer.style.display = "none";
            this.stream.style.display = "none";
            this.stream.src = "";
            this.canvas.style.display = "none";
            if (this.type != type && this.type != undefined) {
                this.state = "";
            }
            if (type == undefined || type == null) {
                type = "button";
            }
            this.type = type;
            if (this.type === Whiteboard.WhiteboardDraggable.Types.BUTTON) {

            } else if (this.type === Whiteboard.WhiteboardDraggable.Types.TOGGLE) {
                this.setColor("red");
            } else if (this.type === Whiteboard.WhiteboardDraggable.Types.SELECTOR) {
                this.selectorContainer.style.display = "grid";
                this.generateSelectorHTML(this.typeSpecificData.selectableNames);
            } else if (this.type === Whiteboard.WhiteboardDraggable.Types.TEXT_TELEMETRY) {
                this.textContainer.style.display = "block";
                this.textContainer.innerHTML = this.state;
            } else if (this.type === Whiteboard.WhiteboardDraggable.Types.TEXT_INPUT) {
                this.textField.style.display = "block";
                this.textField.innerHTML = this.state;
            } else if (this.type === Whiteboard.WhiteboardDraggable.Types.BOOLEAN_TELEMETRY) {
                this.setColor("red");
            } else if (this.type === Whiteboard.WhiteboardDraggable.Types.CAMERA_STREAM) {
                this.stream.style.display = "block";
                this.setStreamURL(this.typeSpecificData.streamURL);
            } else if (this.type === Whiteboard.WhiteboardDraggable.Types.GRAPH) {
                this.setColor("gray");
                this.canvas.style.display = "block";
            }
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
            editingToggle.innerHTML = "enable editing";
            Array.from(labels).forEach((label) => label.readOnly = true);
            Array.from(editModeOnlyBtns).forEach((button) => button.style.display = "none");
            this.draggableRegistry.forEach((draggable) => { draggable.div.title = "" });
        } else {
            border.style.display = "block";
            editingToggle.innerHTML = "disable editing";
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