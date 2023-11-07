package com.vault6936;

import javax.json.*;
import java.net.http.WebSocket;
import java.util.ArrayList;
import java.util.Objects;

public class WebdashboardLayout {

    public ArrayList<DashboardNode> nodes;
    public final WebSocket socket;

    public WebdashboardLayout(WebSocket socket) {
        this.socket = socket;
    }

    public void update(JsonObject object) {
        ArrayList<WebdashboardLayout.DashboardNode> nodes = new ArrayList<>();
        JsonArray jsonValues = object.getJsonArray("draggables");
        for (JsonValue jsonValue : jsonValues) {
            JsonObject node = jsonValue.asJsonObject();
            nodes.add(new DashboardNode(node.getString("id"), getNodeType(node.getString("type")), node.getString("value")));
        }
        this.nodes = nodes;
    }

    private static DashboardNode.Type getNodeType(String inputType) {
        DashboardNode.Type type = null;
        DashboardNode.Type[] types = DashboardNode.Type.values();
        for (DashboardNode.Type value : types) {
            if (Objects.equals(value.name, inputType)) {
                type = value;
            }
        }
        return type;
    }

    public boolean getBooleanValue(String id) {
        for (DashboardNode node: nodes) {
            if (Objects.equals(node.id, id)) {
                if (!(node.type == DashboardNode.Type.BOOLEAN_TELEMETRY || node.type == DashboardNode.Type.TOGGLE)) {
                    throw new IllegalArgumentException("Requested node does not use boolean states");
                }
                return Boolean.parseBoolean(node.state);
            }
        }
        throw new IllegalArgumentException("Requested node does not exist");
    }

    public String getSelectedValue(String id) {
        for (DashboardNode node: nodes) {
            if (Objects.equals(node.id, id)) {
                if (node.type != DashboardNode.Type.SELECTOR) {
                    throw new IllegalArgumentException("Requested node is not a selector");
                }
                return node.state;
            }
        }
        throw new IllegalArgumentException("Requested node does not exist");
    }

    public static void setNodeValue(String id, String value) {
        JsonObject jsonObject = Json.createObjectBuilder()
                .add("messageType", "update")
                .add("nodeID", id)
                .add("state", value)
                .build();
        WebdashboardServer.getInstance(5800).broadcast(jsonObject.toString());
    }

    public static void setNodeValue(String id, boolean value) {
        setNodeValue(id, String.valueOf(value));
    }

    public static class DashboardNode {

        private final String id;
        private final Type type;
        private final String state;

        public DashboardNode(String id, Type type, String state) {
            this.id = id;
            this.type = type;
            this.state = state;
        }

        public enum Type {
            BUTTON("button"),
            TOGGLE("toggle"),
            SELECTOR("selector"),
            BOOLEAN_TELEMETRY("boolean telemetry"),
            TEXT_TELEMETRY("text telemetry"),
            CAMERA_STREAM("camera steam");

            private final String name;

            Type(String name) {
                this.name = name;
            }
        }
    }

}
