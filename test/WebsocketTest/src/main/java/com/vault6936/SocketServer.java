package com.vault6936;


import org.java_websocket.WebSocket;
import org.java_websocket.drafts.Draft;
import org.java_websocket.drafts.Draft_6455;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

import java.net.InetSocketAddress;
import java.net.UnknownHostException;
import java.nio.ByteBuffer;
import java.util.Collections;

public class SocketServer extends WebSocketServer {

    public SocketServer(int port) throws UnknownHostException {
        super(new InetSocketAddress(port));
        setReuseAddr(true);
    }

    public SocketServer(InetSocketAddress address) {
        super(address);
        setReuseAddr(true);
    }

    public SocketServer(int port, Draft_6455 draft) {
        super(new InetSocketAddress(port), Collections.<Draft>singletonList(draft));
        setReuseAddr(true);
    }

    @Override
    public void onOpen(WebSocket conn, ClientHandshake handshake) {
        broadcast("{\"button0\": \"hi\"}");
    }

    @Override
    public void onClose(WebSocket conn, int code, String reason, boolean remote) {
        System.out.println(conn.getRemoteSocketAddress().getAddress().getHostAddress() + " ended the websocket connection");
    }

    @Override
    public void onMessage(WebSocket conn, String message) {
        if (message == "ping") conn.send("pong");
        System.out.println(message);
    }

    @Override
    public void onMessage(WebSocket conn, ByteBuffer message) {
        broadcast(message.array());
        System.out.println(conn + ": " + message);
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

}