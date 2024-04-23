window.hasValue = function(variable) {
    return variable != undefined && variable != null;
}

window.getValue = function(value, defaultValue) {
    if (hasValue(value)) {
        return value;
    }
    return defaultValue;
}