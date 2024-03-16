package com.vault6936;

import java.net.UnknownHostException;

public class Main {
    public static void main(String[] args) throws UnknownHostException, InterruptedException {
        WebdashboardServer server = WebdashboardServer.getInstance(5800);
        System.out.println("Websocket server initialized");
        int i = 0;
        while (true) {
            DashboardLayout.setNodeValue("encoder", "counter: " + i);
            i++;
            Thread.sleep(1000);
        }
    }
}