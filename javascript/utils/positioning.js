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
    },

    mousePosition: null,
};

/* See //https://stackoverflow.com/questions/12743007/can-i-add-attributes-to-window-object-in-javascript for window namespace declaration 
   or //https://stackoverflow.com/questions/2100758/javascript-or-variable-assignment-explanation for short-circuit operators.  Unfortunately, 
   using the JavaScript module system will not work apart from a server.  I suppose I could have worked out a system with a local server, but
   I really didn't feel like it :).
*/
window.Positioning = Positioning || {};