var Popup = {
    openPopup: function (id) {
        let popup = document.getElementById(id);

        popup.style.display = "block";
        for (let i = 0; i < popup.children.length; i++) {
            popup.children[i].style.opacity = 0;
        }

        let animation = [{width: "0px", height: "0px"}, {width: popup.style.width, height: popup.style.height}];
        let timing = {duration: 500, iterations: 1};

        popup.animate(animation, timing).finished.then(() => {        
            for (let i = 0; i < popup.children.length; i++) {
                popup.children[i].style.opacity = 1.0;
            }
        });
        
        popup.setAttribute("z-index", "1");
        popupBackground.style.display = "block";
        popupBackground.setAttribute("z-index", "0");
    },

    closePopupByCloser: function (target) {
        Popup.closePopup(target);
    },

    closePopup: function (popup) {
        let animation = [{width: popup.style.width, height: popup.style.height}, {width: "0px", height: "0px"}];
        let timing = {duration: 500, iterations: 1};

        popup.animate(animation, timing).finished.then(() => popup.style.display = "none");

        popupBackground.style.display = "none";

        for (let i = 0; i < popup.children.length; i++) {
            popup.children[i].style.opacity = 0;
        }

    },

    setPopupSize: function (element, width, height) {
        width = parseFloat(width);
        height = parseFloat(height);
        element.style.width = width + "px";
        element.style.height = height + "px";
    
    },

    generateSimpleInputPopup: function (popupName, onApply, input) {
        let div = document.createElement("div");
        div.id = popupName;
        div.setAttribute("class", "popup");
        div.style.width = "300px";
        div.style.height = "200px";

        let inputContainer = document.createElement("div");
        inputContainer.setAttribute("class", "absolute-centered-wrapper");
        div.appendChild(inputContainer);
        
        input.generateHTML(inputContainer);

        let apply = document.createElement("button");
        apply.setAttribute("class", "apply");
        apply.onclick = (event) => onApply(event);
        apply.innerHTML = "apply";
        div.appendChild(apply);

        document.body.appendChild(div);
    
        return div;    
    },

    populatePopupClickableList: function (container, iterables, getName, getOnclick) {
        for (let i = 0; i < iterables.length; i++) {
            let a = document.createElement("a");
            a.setAttribute("class", "default-text carousel-item selectable layout-selector-button");
            a.innerHTML = getName(iterables[i]);
            a.onclick = getOnclick(iterables[i], a);
            container.appendChild(a);
        }
    },

    PopupInput: class {
        constructor(placeholder, labelName, id) {
            this.labelName = labelName;
            this.placeholder = placeholder;
            this.id = id;
        }
        generateHTML(container) {
            let inputWrapper = document.createElement("div");
            inputWrapper.setAttribute("class", "simple-input-wrapper");
            inputWrapper.id = this.id;
            container.append(inputWrapper)
            let label = document.createElement("p");
            label.setAttribute("class", "input-label");
            label.innerHTML = this.labelName ?? "set property";
            inputWrapper.appendChild(label);
            let input = document.createElement("input");
            input.setAttribute("type", "text");
            input.setAttribute("placeholder", this.placeholder);
            input.setAttribute("class", "popup-input");
            inputWrapper.appendChild(input);
        }
    },

    populateVerticalInputs: function (container, ...inputs) {
        for (let i = 0; i < inputs.length; i++) {
            inputs[i].generateHTML(container);
        }
    },

    initializePopups: function () {
        let popups = document.getElementsByClassName("popup");
        for (let i = 0; i < popups.length; i++) {
            let cls = document.createElement("img");
            cls.setAttribute("class", "close");
            cls.setAttribute("src", "./images/close.svg");
            cls.addEventListener("click", () => {Popup.closePopup(Popup.getPopupFromChild(cls))});
            popups[i].appendChild(cls);
        }
        let inputs = document.getElementsByClassName("popup-input");
        for (let i = 0; i < inputs.length; i++) {
            inputs[i].addEventListener("keydown", (event) => {if (event.key === "Enter" && document.activeElement === inputs[i]) Popup.getPopupFromChild(event.target).getElementsByClassName("apply")[0].click()});
        }
        popupBackground = document.getElementById("popup-background");
        popupOpeners = document.querySelectorAll("[popup]"); //grabs all elements with a popup attribute
        for (let i = 0; i < popupOpeners.length; i++) {
            popupOpeners[i].addEventListener("click", () => {Popup.openPopup(popupOpeners[i].getAttribute("popup"))})
        }
    },

    getPopupByOpener: function (target) {
        return document.getElementById(target.getAttribute("popup"));
    },

    clickCloseBtn: function () {
        try {
            Popup.activePopups[Popup.activePopups.length - 1].getElementsByClassName("close")[0].click();
        } catch {
            console.warn("Could not close popup.");
        }
    },

    clickOpener: function (popupId) {
        document.getElementById(`open-${popupId}`).click();
    },

    getPopupFromChild: function (element) {
        if (element.classList.contains("popup") || element == null) {
            return element;
        } else {
            return Popup.getPopupFromChild(element.parentElement);
        }
    },

};

Popup = Popup || {};
