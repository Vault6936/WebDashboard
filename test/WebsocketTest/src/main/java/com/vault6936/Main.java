package com.vault6936;

import java.net.UnknownHostException;

public class Main {
    public static void main(String[] args) throws UnknownHostException, InterruptedException {
        WebdashboardServer server = WebdashboardServer.getInstance(5800);
        System.out.println("Websocket server initialized");
        int i = 0;
        while (true) {
            DashboardLayout.setNodeValue("orange", "WE ALL LIVE IN A GREEN SUBMARINE.  IT USED TO BE YELLOW BUT WE PAINTED IT GREEN.  WE'VE BEEN LIVING IN THE SUBMARINE FOR " + i + " DAYS AND WE EAT SUBS NOMMMY NOM NOM NOM HAMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMmm");
            //DashboardLayout.setNodeValue("selectable_node", "left auton");
            DashboardLayout.setNodeValue("indigo", false);
            DashboardLayout.setNodeValue("blue", true);
            i++;
            Thread.sleep(1000);
        }
    }
}