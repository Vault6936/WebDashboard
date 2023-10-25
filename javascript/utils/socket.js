var Socket = {
    websocket: null,
    websocketURL: "ws://10.69.36.2:5800",//"ws://127.0.0.1:5800",
    clientID : Date.now(),
    lastMessageTimestamp: 0,
    connecting: false,

    initializeSocket: function() {
        setInterval(() => {try {Socket.websocket.send("ping")} catch {}}, 10000);
        CustomEventChecker.addEventChecker(new CustomEventChecker.EventChecker("disconnected", Socket.disconnected, window));
        addEventListener("disconnected", () => {
            document.getElementById("status-container").style.backgroundColor = "red";
            document.getElementById("status").innerHTML = "disconnected";
            if (!Socket.connecting) Socket.openSocket(0);
        });
        Socket.openSocket(0);
    },

    sendState: function() {
        let data = {};
        data.layout = Load.getLayoutJSON();
        data.clientID = Socket.clientID;
        data.messageType = "layout state";
        data = JSON.stringify(data);
        try {
            Socket.websocket.send(data);
        } catch {}
    },

    openSocket: function (recursion) {
        if (recursion == 0) {
            Socket.connecting = true;
            Notify.createNotice("Attempting to connect to the RoboRio...", "neutral", 3000);
        }
        try {
            Socket.websocket = new WebSocket(Socket.websocketURL);
        } catch {
            console.error("Error creating websocket")
        }
        Socket.websocket.onopen = () => {
            Socket.connecting = false;
            Notify.createNotice("Connected to the RoboRio!", "positive", 8000);
            document.getElementById("status-container").style.backgroundColor = "limegreen";
            document.getElementById("status").innerHTML = "connected";
            Socket.sendState();
        };
        Socket.websocket.onmessage = (event) => {Socket.handleMessage(event.data)};
        if (recursion < 1) {
            Socket.websocket.onerror = () => {Notify.createNotice("Could not connect to the RoboRio!", "negative", 8000); Socket.openSocket(recursion + 1); console.clear()};
        } else {
            Socket.websocket.onerror = () => {Socket.openSocket(recursion + 1); console.clear()}
        }
    },

    disconnected: function () {
        return Date.now() - Socket.lastMessageTimestamp > 15000;
    },
    
    handleMessage: function (data) {
        Socket.lastMessageTimestamp = Date.now();
        if (data != "pong") {
            try {
                data = JSON.parse(data);
                Whiteboard.getDraggableById(data.nodeID).handleDataFromRio(data);

            } catch (err) {
                console.warn(err);
                Notify.createNotice("Could not apply message from Rio", "negative", 3000);
            }
        }
    },

};

window.Socket = Socket || {};