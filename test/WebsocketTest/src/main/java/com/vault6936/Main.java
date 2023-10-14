package com.vault6936;

import java.net.UnknownHostException;

public class Main {
    public static void main(String[] args) throws UnknownHostException {
        SocketServer server = new SocketServer(5800);
        server.start();
        System.out.println("Websocket server initialized");
    }
}