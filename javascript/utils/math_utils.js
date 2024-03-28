var Positioning = {
    clamp: function (value, min, max) {
        return Math.min(max, Math.max(min, value))
    },
    toHTMLPositionPX: function (value) {
        return value + "px";
    },    
    round: function (number, precision = 0) {
        return Math.round(number * 10 ** precision) / (10 ** precision);
    },
    Vector2d: class {
        constructor(x, y) {
            this.x = parseFloat(x);
            this.y = parseFloat(y);
        }

        add(vector) {
            return new Positioning.Vector2d(this.x + vector.x, this.y + vector.y);
        }

        equals(vector) {
            return parseInt(vector.x) == parseInt(this.x) && parseInt(vector.y) == parseInt(this.y);
        }

        static from(obj) {
            return new Positioning.Vector2d(obj.x, obj.y);
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