var Positioning = {
    clamp : function (value, min, max) {
        return Math.min(max, Math.max(min, value))
    },
    toHTMLPositionPX: function (value) {
        return value + "px";
    },
    Vector2d: class {
        constructor(x ,y) {
            this.x = x;
            this.y = y;
        }
        equals(vector) {
            return parseInt(vector.x) == parseInt(this.x) && parseInt(vector.y) == parseInt(this.y);
        }
    },

    mousePosition: null,
};

window.Positioning = Positioning || {};