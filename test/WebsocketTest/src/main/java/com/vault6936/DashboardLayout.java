package com.vault6936;

import javax.json.*;
import org.java_websocket.WebSocket;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Objects;

public class DashboardLayout {

    public ArrayList<DashboardNode> nodes;
    public final WebSocket socket;

    private final HashMap<String, Runnable> callbacks = new HashMap<>();

    public DashboardLayout(WebSocket socket) {
        this.socket = socket;
    }

    public void update(JsonObject object) {
        ArrayList<DashboardLayout.DashboardNode> nodes = new ArrayList<>();
        JsonArray jsonValues = object.getJsonArray("layout");
        for (JsonValue jsonValue : jsonValues) {
            JsonObject node = jsonValue.asJsonObject();
            nodes.add(new DashboardNode(node.getString("id"), getNodeType(node.getString("type")), String.valueOf(node.get("state"))));
        }
        this.nodes = nodes;
    }

    public void updateNode(JsonObject object) {
        JsonObject configuration = object.getJsonObject("configuration");
        String nodeID = configuration.getString("id");
        for (DashboardNode node : nodes) {
            if (Objects.equals(node.id, nodeID)) {
                node.state = configuration.getString("state");
                return;
            }
        }
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

    public String getInputValue(String id) {
        for (DashboardNode node: nodes) {
            if (Objects.equals(node.id, id)) {
                if (node.type != DashboardNode.Type.TEXT_INPUT) {
                    throw new IllegalArgumentException("Requested node is not an input node");
                }
                return node.state;
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

    public void buttonClicked(String id) {
        try {
            callbacks.get(id).run();
        } catch (NullPointerException e) {
            e.printStackTrace();
        }
    }

    public void addCallback(String buttonName, Runnable callback) {
        callbacks.put(buttonName, callback);
    }

    public static class DashboardNode {

        private final String id;
        private final Type type;
        private String state;

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
            TEXT_INPUT("text input"),
            CAMERA_STREAM("camera steam");

            private final String name;

            Type(String name) {
                this.name = name;
            }
        }
    }

}
