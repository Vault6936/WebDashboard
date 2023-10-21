package com.vault6936;


import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;


import javax.json.Json;
import javax.json.JsonObject;
import javax.json.JsonReader;
import javax.json.stream.JsonParser;
import java.io.StringReader;
import java.net.InetSocketAddress;
import java.net.UnknownHostException;
import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Objects;

public class WebdashboardServer extends WebSocketServer {

    ArrayList<HashMap<WebSocket, String>> lastLayoutStates;

    private static WebdashboardServer instance = null;

    private WebdashboardServer(int port) throws UnknownHostException {
        super(new InetSocketAddress(port));
        setReuseAddr(true);
        start();
    }

    @Override
    public void onOpen(WebSocket conn, ClientHandshake handshake) {

    }

    @Override
    public void onClose(WebSocket conn, int code, String reason, boolean remote) {
        System.out.println(conn.getRemoteSocketAddress().getAddress().getHostAddress() + " ended the websocket connection");
    }

    @Override
    public void onMessage(WebSocket conn, String message) {
        if (Objects.equals(message, "ping")) {
            conn.send("pong");
            return;
        }
        JsonReader reader = Json.createReader(new StringReader(message));
        JsonObject object = reader.readObject();
        if (Objects.equals(object.getString("messageType", ""), "layout state")) {
            System.out.println("got a layout state message");
        }

    }

    @Override
    public void onError(WebSocket conn, Exception ex) {
        ex.printStackTrace();
        if (conn != null) {
            // some errors like port binding failed may not be assignable to a specific websocket
        }
    }

    @Override
    public void onStart() {
        System.out.println("Server started");
        setConnectionLostTimeout(1);
    }

    public static WebdashboardServer getInstance(int port) {
        if (instance == null) {
            try {
                instance = new WebdashboardServer(port);
            } catch (UnknownHostException e) {
                e.printStackTrace();
            }
        }
        return instance;
    }

}