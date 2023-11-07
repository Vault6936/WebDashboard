var Notify = {
    Notice: class {
        constructor(message, type, duration) {
            let color = "gray";
            if (type === "positive") {
                color = "limegreen";
            } else if (type === "negative") {
                color = "red";
            }
            this.message = message;
            this.container = document.createElement("div");
            let textContainer = document.createElement("div");
            textContainer.classList.add("notice-text-wrapper");
            let p = document.createElement("p");
            p.classList.add("default-text");
            p.classList.add("notice");
            p.innerHTML = message;
            this.container.appendChild(textContainer);
            textContainer.appendChild(p);
            this.container.classList.add("notice-container");
            this.container.style.backgroundColor = color;
            document.body.appendChild(this.container);
            this.fade = null;


            this.fadeInAnimation = [{ opacity: 0 }, { opacity: 1 }];
            this.fadeOutAnimation = [{ opacity: 1 }, { opacity: 0 }];
            this.fadeTiming = { duration: 500, iterations: 1 };

            this.fadeSequence();

            this.duration = duration;
        }

        fadeSequence() {
            let fadeIn = new Promise((resolve, reject) => {
                try {
                    this.container.animate(this.fadeInAnimation, this.fadeTiming);
                    this.container.style.opacity = "1.0";
                    resolve();
                } catch {
                    reject("Failed to properly display notice.  Check your browser version.");
                }

            });
            fadeIn.then(() => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        this.container.animate(this.fadeOutAnimation, this.fadeTiming).finished.then(() => resolve()); //https://developer.mozilla.org/en-US/docs/Web/API/Animation/finished
                    }, this.duration)
                }
                )
            }).then(() => this.container.remove());
        }
    },

    createNotice: function (message, type, duration) {
        new Notify.Notice(message, type, duration);
    },
};

window.Notify = Notify || {};