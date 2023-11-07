package com.vault6936;


import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;



import javax.json.Json;
import javax.json.JsonArray;
import javax.json.JsonObject;
import javax.json.JsonReader;
import java.io.StringReader;
import java.net.InetSocketAddress;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.Objects;


public class WebdashboardServer extends WebSocketServer {

    ArrayList<DashboardLayout> layouts = new ArrayList<>();

    private static WebdashboardServer instance = null;

    private WebdashboardServer(int port) throws UnknownHostException {
        super(new InetSocketAddress(port));
        setReuseAddr(true);
        start();
    }

    @Override
    public void onOpen(WebSocket conn, ClientHandshake handshake) {
        layouts.add(new DashboardLayout(conn));
    }

    @Override
    public void onClose(WebSocket conn, int code, String reason, boolean remote) {
        layouts.removeIf(layout -> Objects.equals(conn, layout.socket));
    }

    @Override
    public void onMessage(WebSocket conn, String message) {
        if (Objects.equals(message, "ping")) {
            conn.send("pong");
        } else {
            JsonReader reader = Json.createReader(new StringReader(message));
            JsonObject object = reader.readObject().getJsonObject("message");

            if (Objects.equals(object.getString("messageType"), "layout state")) {
                if (!layouts.isEmpty()) {
                    layouts.get(0).update(object);
                    System.out.println(layouts.get(0).getSelectedValue("selectable_node"));
                }
            }
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
        setConnectionLostTimeout(3);
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