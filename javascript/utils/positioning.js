var Positioning = {
    clamp: function (value, min, max) {
        return Math.min(max, Math.max(min, value))
    },
    toHTMLPositionPX: function (value) {
        return value + "px";
    },
    Vector2d: class {
        constructor(x, y) {
            this.x = parseFloat(x);
            this.y = parseFloat(y);
        }
        equals(vector) {
            return parseInt(vector.x) == parseInt(this.x) && parseInt(vector.y) == parseInt(this.y);
        }
    },

    Pose2d: class {
        constructor(vector, rotation) {
            this.vector = vector;
            this.rotation = parseFloat(rotation);
        }

        getRotationRadians() {
            return this.rotation;
        }

        getRotationDegrees() {
            return this.rotation * 180 / Math.PI;
        }
    },

    mousePosition: null,
};

window.Positioning = Positioning || {};