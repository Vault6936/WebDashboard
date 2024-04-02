var Socket = {
    websocket: null,
    lastMessageTimestamp: 0,
    connecting: false,
    connected: false,

    initializeSocket: function () {
        setInterval(() => { try { Socket.websocket.send("ping") } catch { } }, 5000);
        CustomEventChecker.addEventChecker(new CustomEventChecker.EventChecker("disconnected", Socket.disconnected, window));
        addEventListener("disconnected", () => {
            Socket.connected = false;
            document.getElementById("status-container").style.backgroundColor = "red";
            document.getElementById("status").innerHTML = "disconnected";
            if (!Socket.connecting) Socket.openSocket(0);
        });
        Socket.openSocket(0);
    },

    sendLayout: function () {
        data = { 
            message,
            id, 
        };
        data.message.layout = Load.getLayoutJSON().draggableData;
        data.message.messageType = "layout state";
        data = JSON.stringify(data);
        Socket.sendData(data);
    },

    sendData: function (data) {
        try {
            Socket.websocket.send(data);
        } catch {
            if (Socket.connected) Notify.createNotice("Could not properly connect to Rio", "negative", 5000);
        }
    },

    openSocket: function (recursion) {
        if (recursion == 0) {
            Socket.connecting = true;
            Notify.createNotice("Attempting to connect to the robot...", "neutral", 3000);
        }
        try {
            Socket.websocket = new WebSocket(WhiteboardSettings.websocketURL);
        } catch {
            console.error("Error creating websocket")
        }
        Socket.websocket.onopen = () => {
            Socket.connecting = false;
            Socket.connected = true;
            Notify.createNotice("Connected to the robot!", "positive", 8000);
            document.getElementById("status-container").style.backgroundColor = "limegreen";
            document.getElementById("status").innerHTML = "connected";
            Socket.sendLayout();
        };
        Socket.websocket.onmessage = (event) => { Socket.handleMessage(event.data) };
        if (recursion < 1) {
            Socket.websocket.onerror = () => { Notify.createNotice("Could not connect to the robot!", "negative", 8000); Socket.openSocket(recursion + 1); /*console.clear()*/ };
        } else {
            Socket.websocket.onerror = () => { Socket.openSocket(recursion + 1); /*console.clear()*/ }
        }
    },

    disconnected: function () {
        return Date.now() - Socket.lastMessageTimestamp > 7500;
    },

    handleMessage: function (data) {
        Socket.lastMessageTimestamp = Date.now();
        if (data.messageType === "update") {
            try {
                data = JSON.parse(data);
                Whiteboard.getDraggableById(data.nodeID).setState(data.state);
            } catch {
                console.warn(`The server attemped to set the state of a node with id "${data.nodeID}," which does not exist.`);
                Notify.createNotice("Received invalid message from the robot", "negative", 3000);
            }
        } else if (data.messageType === "notify") {
            Notify.createNotice(data.message, data.type, parseInt(data.duration));
        }
    },

};

window.Socket = Socket || {};