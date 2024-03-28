window.Draggable =  class {
    draggable;
    draggingNode;
    position;
    onDrag = () => {};

    constructor(draggable) {
        this.draggable = draggable;
        this.draggingNode = false;

        this.setDraggablePosition = this.setDraggablePosition.bind(this);
        this.mouseDrag = this.mouseDrag.bind(this);
        this.stopDragging = this.stopDragging.bind(this);

        this.draggable.onmousedown = function (event) {
            event.stopPropagation();
            if (Whiteboard.editingMode && event.button === 0) {
                if (this.draggingNode) {
                    this.stopDragging();
                } else {
                    Whiteboard.dragOffset = new Positioning.Vector2d(Positioning.mousePosition.x - this.draggable.getBoundingClientRect().left, Positioning.mousePosition.y - this.draggable.getBoundingClientRect().top);
                    addEventListener("mousemove", this.mouseDrag);
                    Whiteboard.logChange();
                    this.draggingNode = true;
                }
            }
        }.bind(this);
        onmouseup = this.stopDragging;
        [document, window, this.draggable].forEach(((object) => { object.onpointerup = this.stopDragging; object.onmouseup = this.stopDragging }).bind(this));
    }

    mouseDrag(event) {
        event.stopPropagation();
        this.setDraggablePosition(Positioning.mousePosition.add(new Positioning.Vector2d(-Whiteboard.dragOffset.x, -Whiteboard.dragOffset.y)));
        this.onDrag();
    }

    setDraggablePosition(pose) {
        const x = Positioning.clamp(pose.x, 25, this.whiteboard.clientWidth - this.div.clientWidth - 25);
        const y = Positioning.clamp(pose.y, 65, this.whiteboard.clientHeight - this.div.clientHeight - 50);
        this.position = new Positioning.Vector2d(x, y);
        this.draggable.style.left = Positioning.toHTMLPositionPX(x);
        this.draggable.style.top = Positioning.toHTMLPositionPX(y);
    }

    stopDragging() {
        removeEventListener("mousemove", this.mouseDrag);
        Whiteboard.dragOffset = new Positioning.Vector2d(0, 0);
        this.draggingNode = false;
    }
};

window.PathPoint = class extends Draggable {    

    parentDraggable;
    relativePosition;
    div;

    fieldVector; // That is, the position in field coordinates
    followRadius;
    targetFollowRotation; // In radians
    targetEndRotation; // In radians
    maxVelocity;


    constructor(parentDraggable, relativePosition) {
        let div = document.createElement("div");
        super(div);
        this.div = div;
        this.div.classList.add("path-point");
        this.whiteboard = document.getElementById("whiteboard");
        this.parentDraggable = parentDraggable;
        this.parentDraggable.draggable.appendChild(this.div);
        this.relativePosition = (relativePosition == null || relativePosition == undefined ? new Positioning.Vector2d(0, 0) : relativePosition);
        super.setDraggablePosition(this.relativePosition.add(this.parentDraggable.position));
        super.onDrag = (function() {
            this.relativePosition = this.position.add(new Positioning.Vector2d(-parentDraggable.position.x, -parentDraggable.position.y));
        }).bind(this);
    }

    remove() {
        this.parentDraggable.draggable.removeChild(this.div);
    }
}

var Whiteboard = {

    WhiteboardDraggable: class extends Draggable {

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
            PATH: "path",
        };

        arrayIndex;
        pathPoints = [];

        configuration = {
            name: undefined,
            position: new Positioning.Vector2d(50, 50),
            size: new Positioning.Vector2d(100, 100),
            color: undefined,
            layer: undefined,
            type: Whiteboard.WhiteboardDraggable.Types.BUTTON,
            id: undefined,
            state: undefined,
            streamURL: undefined,
            streamSize: undefined,
            selectableNames: undefined,
            fontSize: undefined,
            pathPoints: [],
        };

        constructor(configuration) {
            let div = document.createElement("div");
            div.setAttribute("draggable", false);
            super(div);
            this.bindMethods();
            this.whiteboard = document.getElementById("whiteboard");

            // #region draggable div
            this.div = div;
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
            this.fieldImg = document.createElement("img");
            this.fieldImg.setAttribute("draggable", false);
            this.fieldImg.classList.add("path");
            this.fieldImg.setAttribute("draggable", false);
            this.div.appendChild(this.fieldImg);
            this.container = document.createElement("div");
            this.label = document.createElement("input");
            if (!Whiteboard.editingMode) this.label.readOnly = true;
            this.div.className = "whiteboard-draggable";
            this.onDrag = (function() {
                this.configuration.position = this.position;
                this.updateChildPositions();
            }).bind(this);
            // #endregion 

            // #region declare class fields
            this.configuration.type = configuration.type; // initialize the type variable

            this.updateIndex(Whiteboard.draggableRegistry.length);
            this.configuration.name = configuration.name;
            this.configuration.position = configuration.position;
            this.setSize(configuration.size);
            this.setFontSize(configuration.fontSize);
            this.setColor(configuration.color);
            this.setStreamSize(configuration.streamSize);
            this.selectableGroup = null;
            this.configuration.pathPoints = configuration.pathPoints;


            this.configureType(configuration.type, true);
            this.setId(configuration.id); // Once the type is configured, set the id and the state
            this.setState(configuration.state);
            this.setLayer(configuration.layer, false); // After everything is displayed, set the layer

            // #endregion

            // #region dragging functionality
 
            this.div.onmouseover = (event) => {
                if (Whiteboard.editingMode) { event.target.style.cursor = "move" } else if (this.configuration.type === Whiteboard.WhiteboardDraggable.Types.BUTTON || this.configuration.type === Whiteboard.WhiteboardDraggable.Types.TOGGLE) { event.target.style.cursor = "pointer"; if (this.configuration.type === Whiteboard.WhiteboardDraggable.Types.BUTTON) event.target.style.background = WhiteboardSettings.Themes.selectedTheme.attributes.nodeHover } else { event.target.style.cursor = "auto" }
            }

            this.div.onmouseleave = (event) => { event.target.style.background = this.configuration.color }
            this.div.dispatchEvent(new Event("mouseleave")); //If this event isn't dispatched, the program might glitch and cause the element to think the mouse is over it
            // #endregion

            // #region set initial position
            this.container.appendChild(this.div);
            this.whiteboard.appendChild(this.container);
            this.label.setAttribute("type", "text");
            this.label.className = "whiteboard-label";
            this.label.style.background = WhiteboardSettings.Themes.selectedTheme.attributes.draggableLabelColor;
            this.label.placeholder = "Untitled";
            this.label.value = this.configuration.name;
            this.container.appendChild(this.label);
            Whiteboard.dragOffset = new Positioning.Vector2d(0, 0);
            this.setPosition(this.configuration.position);
            this.div.onclick = this.handleClick;
            // #endregion
        }

        bindMethods() {
            this.isType = this.isType.bind(this);
            this.setState = this.setState.bind(this);
            this.handleClick = this.handleClick.bind(this);
            this.setName = this.setName.bind(this);
            this.setPosition = this.setPosition.bind(this);
            this.updateChildPositions = this.updateChildPositions.bind(this);
            this.setSize = this.setSize.bind(this);
            this.setColor = this.setColor.bind(this);
            this.setLayer = this.setLayer.bind(this);
            this.configureType = this.configureType.bind(this);
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
            this.setFontSize = this.setFontSize.bind(this);
            this.addPathPoint = this.addPathPoint.bind(this);
            this.drawPathLines = this.drawPathLines.bind(this);
            this.getPathPointsSimpleObj = this.getPathPointsSimpleObj.bind(this);
            this.removePathPoint = this.removePathPoint.bind(this);
        }

        generateSelectorHTML(selectableNames) {
            if (selectableNames == undefined) return;
            this.configuration.selectableNames = selectableNames;
            this.selectorContainer.innerHTML = "";
            this.selectableGroup = new Popup.SelectableGroup();
            for (let i = 0; i < selectableNames.length; i++) {
                this.selectableGroup.add(new Popup.Selectable(selectableNames[i], (() => { this.configuration.state = selectableNames[i]; this.sendState() }).bind(this), WhiteboardSettings.Themes.selectedTheme.draggableUnselect, WhiteboardSettings.Themes.selectedTheme.draggableSelect, true));
            }
            this.selectableGroup.generateHTML(this.selectorContainer);
        }

        setState(state) {
            try {
                this.configuration.state = state;
                if (this.configuration.type === Whiteboard.WhiteboardDraggable.Types.TOGGLE || this.configuration.type === Whiteboard.WhiteboardDraggable.Types.BOOLEAN_TELEMETRY) {
                    this.configuration.state = String(this.configuration.state);
                    if (this.configuration.state === "true") {
                        this.setColor("limegreen");
                    } else {
                        this.setColor("red");
                    }
                } else if (this.configuration.type === Whiteboard.WhiteboardDraggable.Types.TEXT_TELEMETRY) {
                    this.textContainer.innerHTML = state;
                } else if (this.configuration.type === Whiteboard.WhiteboardDraggable.Types.TEXT_INPUT) {
                    this.textField.innerHTML = state;
                } else if (this.configuration.type === Whiteboard.WhiteboardDraggable.Types.SELECTOR) {
                    let toSelect = null;
                    for (let i = 0; i < this.selectableGroup.selectables.length; i++) {
                        if (this.selectableGroup.selectables[i].name == state) {
                            toSelect = this.selectableGroup.selectables[i];
                        }
                    }
                    if (toSelect == null) throw new Error("Selector node does not have requested state");
                    this.selectableGroup.select(toSelect);
                    this.configuration.state = toSelect.name;
                } else if (this.configuration.type === Whiteboard.WhiteboardDraggable.Types.GRAPH) {
                    let x = 0.00;
                    let y = 0.00;
                    let heading = 0.00;
                    try {
                        x = Positioning.round(parseFloat(state.match(/x:-?[0-9.]*/)[0].replace("x:", "")), 4);
                        y = Positioning.round(parseFloat(state.match(/y:-?[0-9.]*/)[0].replace("y:", "")), 4);
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

        drawPathLines() {
            this.context.clearRect(0, 0, (this.configuration.size.x), (this.configuration.size.y));
            for (let i = 0; i < this.pathPoints.length - 1; i++) {
                let point1 = this.pathPoints[i]; 
                let vector1 = point1.position.add(new Positioning.Vector2d(point1.div.getBoundingClientRect().width / 2, point1.div.getBoundingClientRect().height / 2));
                let point2 = this.pathPoints[i + 1];
                let vector2 = point2.position.add(new Positioning.Vector2d(point2.div.getBoundingClientRect().width / 2, point2.div.getBoundingClientRect().height / 2));
                this.drawLine(vector1.add(new Positioning.Vector2d(-this.position.x, -this.position.y)), vector2.add(new Positioning.Vector2d(-this.position.x, -this.position.y)), "#f5770a", 5);
            }
        }

        drawGraph(botX, botY, heading) {
            const x = 0;
            const y = 0;
            this.context.clearRect(0, 0, (this.configuration.size.x), (this.configuration.size.y));
            let spacing = 25;
            let lineColor = "#f0f0f5";
            for (let i = 0; i < Math.ceil((this.configuration.size.y) / spacing); i++) {
                this.drawLineTransformed(new Positioning.Vector2d(-(this.configuration.size.x) / 2, spacing * i), new Positioning.Vector2d((this.configuration.size.x) / 2, spacing * i), lineColor);
                this.drawLineTransformed(new Positioning.Vector2d(-(this.configuration.size.x) / 2, -spacing * (i + 1)), new Positioning.Vector2d((this.configuration.size.x) / 2, -spacing * (i + 1)), lineColor);
           }
            for (let i = 0; i < Math.ceil((this.configuration.size.x) / spacing); i++) {
                this.drawLineTransformed(new Positioning.Vector2d(spacing * i, -(this.configuration.size.y) / 2), new Positioning.Vector2d(spacing * i, (this.configuration.size.y) / 2), lineColor);
                this.drawLineTransformed(new Positioning.Vector2d(-spacing * (i + 1), -(this.configuration.size.y) / 2), new Positioning.Vector2d(-spacing * (i + 1), (this.configuration.size.y) / 2), lineColor);
            }
            this.context.fillStyle = "#000000";
            this.context.font = "15px Roboto";
            this.context.fillText("x: " + botX, 10, 20);
            this.context.fillText("y: " + botY, 10, 40);
            this.context.fillText("heading: " + Positioning.round((heading * 180 / Math.PI) % 360, 2) + "°", 10, 60);         
            let multiplier = 5;        
            this.drawRect(new Positioning.Pose2d(new Positioning.Vector2d(botX * multiplier, botY * multiplier), heading), 50, 50, "#3973ac");
            this.drawArrow(new Positioning.Pose2d(new Positioning.Vector2d(botX * multiplier, botY * multiplier), heading), 40, 40, "white");
        }

        transformCanvasCoordinates(pose) {
            let x = pose.x;
            let y = pose.y;
            x += (this.configuration.size.x ) / 2;
            y = (this.configuration.size.y) / 2 - y;
            return new Positioning.Vector2d(x, y); 
        }

        rotate(point1, point2, angle) {
            let x = (point1.x - point2.x) * Math.cos(angle) - (point1.y - point2.y) * Math.sin(angle) + point2.x;
            let y = (point1.x - point2.x) * Math.sin(angle) + (point1.y - point2.y) * Math.cos(angle) + point2.y;
            return new Positioning.Vector2d(x, y);
        }

        drawLine(point1, point2, color="#000000", lineWidth = 1) {
            let oldLineWidth = this.context.lineWidth;
            this.context.lineWidth = lineWidth;
            this.context.strokeStyle = color;
            this.context.beginPath();
            this.context.moveTo(point1.x, point1.y);
            this.context.lineTo(point2.x, point2.y);
            this.context.closePath();
            this.context.stroke();
            this.context.lineWidth = oldLineWidth;
        }

        drawLineTransformed(point1, point2, color="#000000", lineWidth = 1) {
            this.drawLine(this.transformCanvasCoordinates(point1), this.transformCanvasCoordinates(point2), color, lineWidth);
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
                id: this.configuration.id,
                state: this.configuration.state,
            };
            data.message.clientID = Socket.clientID;
            data.message.messageType = "node update";
            data = JSON.stringify(data);
            Socket.sendData(data);
        }

        handleClick() {
            if (!Whiteboard.editingMode) {
                if (this.configuration.type == Whiteboard.WhiteboardDraggable.Types.TOGGLE) {
                    let state = "false";
                    if (this.configuration.state == "false") state = true;
                    this.setState(state);
                    this.sendState();
                }
                if (this.configuration.type === Whiteboard.WhiteboardDraggable.Types.BUTTON) {
                    data = { message: {} };
                    data.message.nodeID = this.configuration.id;
                    data.message.clientID = Socket.clientID;
                    data.message.messageType = "click";
                    data = JSON.stringify(data);
                    Socket.sendData(data);
                }
            }
        }

        setName(name) {
            this.configuration.name = name;
        }

        setPosition(pose) {
            if (pose == undefined || pose == null) {
                pose == new Positioning.Vector2d(0, 0);
            }
            super.setDraggablePosition(pose);
            this.configuration.position = this.position;
            const labelOffset = (this.div.clientWidth - (this.label.clientWidth + getBorderWidth(this.label))) / 2;
            this.label.style.left = Positioning.toHTMLPositionPX(this.position.x + labelOffset);
            this.label.style.top = Positioning.toHTMLPositionPX(this.position.y + this.div.clientHeight + 10);
        }

        updateChildPositions() {
            const labelOffset = (this.div.clientWidth - (this.label.clientWidth + getBorderWidth(this.label))) / 2;
            this.label.style.left = Positioning.toHTMLPositionPX(this.position.x + labelOffset);
            this.label.style.top = Positioning.toHTMLPositionPX(this.position.y + this.div.clientHeight + 10);
            if (this.isType(Whiteboard.WhiteboardDraggable.Types.PATH)) {
                for (let i = 0; i < this.pathPoints.length; i++) {
                    this.pathPoints[i].setDraggablePosition(this.position.add(this.pathPoints[i].relativePosition));
                }
            }
        }

        isType(type) {
            return this.configuration.type === type;
        }

        getPathPointsSimpleObj() {
            let array = [];
            for (let i = 0; i < this.pathPoints.length; i++) {
                array.push({
                    "relativePosition": this.pathPoints[i].relativePosition,
                    "fieldVector": this.pathPoints[i].fieldVector,
                });
            }
            return array;
        }

        getPathPointIndex(pathPointNode) {
            let i = 0;
            while (i < this.pathPoints.length) { // Since both are html objects, the triple equals operator will compare reference only
                if (pathPointNode === this.pathPoints[i].draggable) {
                    break;
                }
                i++;
            }
            return i;
        }

        getPathPointObject(pathPointNode) {
            return this.pathPoints[this.getPathPointIndex(pathPointNode)];
        }

        removePathPoint(pathPointNode) {
            Whiteboard.logChange();
            let index = this.getPathPointIndex(pathPointNode);
            try {
                let temp = [];
                for (let i = 0; i < this.pathPoints.length; i++) {
                    if (i == index) {
                        this.div.removeChild(pathPointNode);
                    } else {
                        temp.push(this.pathPoints[i]);
                    }
                }
                this.pathPoints = temp;
            } catch(error) {
                console.log(error);
            }
        }

        setSize(size) {
            this.configuration.size = new Positioning.Vector2d(Positioning.clamp(size.x, 50, this.whiteboard.clientWidth * 0.75), Positioning.clamp(size.y, 50, this.whiteboard.clientHeight * 0.75));
            this.div.style.width = Positioning.toHTMLPositionPX(this.configuration.size.x);
            this.div.style.height = Positioning.toHTMLPositionPX(this.configuration.size.y);
            this.label.style.width = Positioning.toHTMLPositionPX(Positioning.clamp(this.configuration.size.x * 0.75, 75, Number.POSITIVE_INFINITY));
            Whiteboard.dragOffset = new Positioning.Vector2d(0, 0); // Calling setPosition() will take into account the dragOffset variable.  This isn't desirable here, so it is set to (0, 0)
            this.setPosition(this.configuration.position); // If this method is not called, the position of the label relative to that of the div will be wrong
            if (this.isType(Whiteboard.WhiteboardDraggable.Types.GRAPH) || this.isType(Whiteboard.WhiteboardDraggable.Types.PATH)) {
                if (this.isType(Whiteboard.WhiteboardDraggable.Types.GRAPH)) {
                    this.drawGraph(0, 0, 0);
                } else if (Whiteboard.WhiteboardDraggable.Types.PATH) {
                    this.fieldImg.style.width = Positioning.toHTMLPositionPX(this.configuration.size.x);
                    this.fieldImg.style.height = Positioning.toHTMLPositionPX(this.configuration.size.y);
                }
                this.canvas.style.width = Positioning.toHTMLPositionPX(this.configuration.size.x);
                this.canvas.style.height = Positioning.toHTMLPositionPX(this.configuration.size.y);
                this.canvas.width = this.configuration.size.x;
                this.canvas.height = this.configuration.size.y;
            }
        }

        setFontSize(size) {
            if (size == undefined) {
                size = 15;
            }
            this.configuration.fontSize = size;
            this.textContainer.style.fontSize = Positioning.toHTMLPositionPX(size);
        }

        setColor(color) {
            this.configuration.color = color;
            this.div.style.background = color;
        }

        setLayer(layer, arrangeOthers = true) {
            if (layer === this.configuration.layer) return;
            this.div.style.zIndex = 1000 + layer;
            this.label.style.zIndex = 1000 + layer;
            if (this.configuration.layer != undefined && arrangeOthers) { // this.configuration.layer is equivalent to the prior draggable layer, and layer is equivalent to the new layer
                if (layer > this.configuration.layer) {
                    for (let i = layer; i > this.configuration.layer; i--) {
                        Whiteboard.draggableRegistry[i].setLayer(i - 1, false);
                        Whiteboard.draggableRegistry[i].setLayer(i - 1, false);
                        console.log(Whiteboard.draggableRegistry[i]);
                    }
                } else {
                    for (let i = layer; i < this.configuration.layer; i++) {
                        Whiteboard.draggableRegistry[i].setLayer(i + 1, false);
                    }
                }
            }
            this.configuration.layer = layer;
        }

        handleTyping() {
            this.configuration.state = this.textField.value;
            this.sendState();
        }

        sendPath() {
            Notify.createNotice(`sent path "${this.configuration.id}" to the control hub`, "positive", 4000);
        }

        configureType(type, newObject = false) {
            this.textContainer.style.display = "none";
            this.textField.style.display = "none";
            this.selectorContainer.innerHTML = "";
            this.selectorContainer.style.display = "none";
            this.stream.style.display = "none";
            this.stream.src = "";
            this.canvas.style.display = "none";
            this.fieldImg.style.display = "none";
            clearInterval(this.drawPathLines, 20);
            if (this.configuration.type != type && this.configuration.type != undefined) {
                this.configuration.state = "";
            }
            if (type == undefined || type == null) {
                type = "button";
            }
            this.configuration.type = type;
            if (this.configuration.type === Whiteboard.WhiteboardDraggable.Types.BUTTON) {

            } else if (this.configuration.type === Whiteboard.WhiteboardDraggable.Types.TOGGLE) {
                this.setColor("red");
            } else if (this.configuration.type === Whiteboard.WhiteboardDraggable.Types.SELECTOR) {
                this.selectorContainer.style.display = "grid";
                this.generateSelectorHTML(this.configuration.selectableNames);
            } else if (this.configuration.type === Whiteboard.WhiteboardDraggable.Types.TEXT_TELEMETRY) {
                this.textContainer.style.display = "block";
                this.textContainer.innerHTML = this.configuration.state;
            } else if (this.configuration.type === Whiteboard.WhiteboardDraggable.Types.TEXT_INPUT) {
                this.textField.style.display = "block";
                this.textField.innerHTML = this.configuration.state;
            } else if (this.configuration.type === Whiteboard.WhiteboardDraggable.Types.BOOLEAN_TELEMETRY) {
                this.setColor("red");
            } else if (this.configuration.type === Whiteboard.WhiteboardDraggable.Types.CAMERA_STREAM) {
                this.stream.style.display = "block";
                this.setStreamURL(this.configuration.streamURL);
            } else if (this.configuration.type === Whiteboard.WhiteboardDraggable.Types.GRAPH) {
                this.setColor("gray");
                this.canvas.style.display = "block";
                this.canvas.style.backgroundColor = "white";
                this.drawGraph(0, 0, 0);
            } else if (this.configuration.type === Whiteboard.WhiteboardDraggable.Types.PATH) {
                this.fieldImg.style.display = "block";
                this.canvas.style.display = "block";
                this.canvas.style.backgroundColor = "transparent";
                this.fieldImg.setAttribute("src", "./game/centerstage.png");
                if (newObject && this.configuration.pathPoints != undefined) {
                    for (let i = 0; i < this.configuration.pathPoints.length; i++) {
                        this.pathPoints.push(new PathPoint(this, Positioning.Vector2d.from(this.configuration.pathPoints[i].relativePosition)));
                    }
                }
                setInterval(this.drawPathLines, 20);
            }
        }

        setStreamSize(size) {
            if (size == undefined) return;
            this.configuration.streamSize = size;
            this.stream.style.width = Positioning.toHTMLPositionPX(size.x);
            this.stream.style.height = Positioning.toHTMLPositionPX(size.y);
        }

        setId(id) {
            if (id == null || id == "undefined" || id == "") {
                id = `${this.configuration.type.replace(" ", "_")}_${this.arrayIndex}`;
            }
            this.div.id = id;
            this.configuration.id = id;
            if (Whiteboard.editingMode) this.div.title = `ID: ${this.configuration.id}`;
        }

        setStreamURL(url) {
            this.configuration.streamURL = url;
            this.stream.src = url;
        }

        addPathPoint() {
            Whiteboard.logChange();
            this.pathPoints.push(new PathPoint(this));
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
            this.configuration.pathPoints = this.getPathPointsSimpleObj();
            return this.configuration;
        }
    },

    getDraggableIndex: function (draggable) {
        return parseInt(draggable.getAttribute("index"));
    },

    addDefaultDraggable: function () {
        Whiteboard.logChange();
        let configuration = {
            "name": "",
            "position": new Positioning.Vector2d(100, 100),
            "size": new Positioning.Vector2d(100, 100),
            "color": "#0098cb",
            "layer": Whiteboard.draggableRegistry.length,
            "type": "button",
            "id": null,
        };
        if (Whiteboard.editingMode) Whiteboard.draggableRegistry.push(new Whiteboard.WhiteboardDraggable(configuration));
    },

    duplicate: function (draggable, keepPosition = false) {
        let position = new Positioning.Vector2d(0, 0);
        if (keepPosition) {
            position = draggable.configuration.position;
        }
        let name;
        try {
            name = this.getDraggableName(draggable);
        } catch {
            name = draggable.configuration.name;
        }
        let configuration = {
            "name": name,
            "position": position,
            "size": draggable.configuration.size,
            "color": draggable.configuration.color,
            "layer": Whiteboard.draggableRegistry.length,
            "type": draggable.configuration.type,
            "state": "",
            "id": null,
        };
        Whiteboard.draggableRegistry.push(new Whiteboard.WhiteboardDraggable(configuration));
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
            if (Whiteboard.draggableRegistry[i].configuration.id === id) {
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
            this.draggableRegistry.forEach((draggable) => { draggable.div.title = `ID: ${draggable.configuration.id}` });
        }
        Whiteboard.editingMode = !Whiteboard.editingMode;
    },

    draggableRegistry: [],
    dragOffset: null,
    currentDraggable: null,
    currentPathPoint: null,
    editingMode: false,
};

window.Whiteboard = Whiteboard || {};