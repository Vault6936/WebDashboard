var CustomEventChecker = {
    EventChecker: class {
        constructor(eventName, checker, target) {
            this.event = new CustomEvent(eventName);
            this.checker = checker;
            this.target = target;
            this.check = this.check.bind(this);
            this.fire = this.fireEvent.bind(this);
            this.lastState = false;
        }
        check() {
            try {
                const state = this.checker();
                if (state && state != this.lastState) {
                    this.fireEvent();
                };
                this.lastState = state;
            } catch {
                console.warn("Event checker object is not a function!");
            }
        }
        fireEvent() {
            this.target.dispatchEvent(this.event);
        }
    },
    
    eventCheckers: [],

    addEventChecker: function(checker) {
        window.CustomEventChecker.eventCheckers.push(checker);
    },
};

window.CustomEventChecker = CustomEventChecker || {};

setInterval(() => {
    for (let i = 0; i < window.CustomEventChecker.eventCheckers.length; i++) {
        window.CustomEventChecker.eventCheckers[i].check();
    }
}, 20);
