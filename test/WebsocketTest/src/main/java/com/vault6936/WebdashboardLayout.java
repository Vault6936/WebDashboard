package com.vault6936;

import javax.json.Json;
import javax.json.JsonObject;

public class WebdashboardLayout {

    public static void setNodeValue(String id, String state) {
        JsonObject jsonObject = Json.createObjectBuilder()
                .add("messageType", "update")
                .add("nodeID", id)
                .add("state", state)
                .build();
        WebdashboardServer.getInstance(5800).broadcast(jsonObject.toString());
    }

    public static void setNodeValue(String id, boolean state) {
        setNodeValue(id, String.valueOf(state));
    }

}
