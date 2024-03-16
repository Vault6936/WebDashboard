var Socket = {
    websocket: null,
    websocketURL: "ws://10.69.36.2:5800",//"ws://127.0.0.1:5800",
    clientID: Date.now(),
    lastMessageTimestamp: 0,
    connecting: false,
    connected: false,

    initializeSocket: function () {
        setInterval(() => { try { Socket.websocket.send("ping") } catch { } }, 10000);
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
        data = { message: {} };
        data.message.layout = Load.getLayoutJSON().draggableData;
        data.message.clientID = Socket.clientID;
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
            Socket.websocket.onerror = () => { Notify.createNotice("Could not connect to the robot!", "negative", 8000); Socket.openSocket(recursion + 1); console.clear() };
        } else {
            Socket.websocket.onerror = () => { Socket.openSocket(recursion + 1); console.clear() }
        }
    },

    disconnected: function () {
        return Date.now() - Socket.lastMessageTimestamp > 15000;
    },

    handleMessage: function (data) {
        Socket.lastMessageTimestamp = Date.now();
        if (data != "pong" && !Whiteboard.editingMode) {
            try {
                data = JSON.parse(data);
                Whiteboard.getDraggableById(data.nodeID).setState(data.state);
            } catch {
                console.warn(`The server attemped to set the state of a node with id "${data.nodeID}," which does not exist.`);
                Notify.createNotice("Received invalid message from the robot", "negative", 3000);
            }
        }
    },

};

window.Socket = Socket || {};