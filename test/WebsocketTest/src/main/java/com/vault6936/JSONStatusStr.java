package com.vault6936;

public abstract class JSONStatusStr {

    private String id;
    private String status;
    private String value;

    public JSONStatusStr(String id, String status, String value) {
        this.id = id;
        this.status = status;
        this.value = value;
    }
    public JSONStatusStr(String id, Object status, Object value) {
        this(id, status.toString(), value.toString());
    }
}
