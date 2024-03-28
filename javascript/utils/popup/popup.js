var Popup = {
    openPopup: function (id) {
        let popup = document.getElementById(id);

        popup.style.display = "block";
        for (let i = 0; i < popup.children.length; i++) {
            popup.children[i].style.opacity = 0;
        }

        let animation = [{ width: "0px", height: "0px" }, { width: popup.style.width, height: popup.style.height }];
        let timing = { duration: 300, iterations: 1 };

        popup.animate(animation, timing).finished.then(() => {
            for (let i = 0; i < popup.children.length; i++) {
                popup.children[i].style.opacity = 1.0;
            }
        });

        popup.setAttribute("z-index", "1");
        Popup.popupBackground.style.display = "block";
        Popup.popupBackground.setAttribute("z-index", "0");

        let onopen = popup.getElementsByClassName("popup-onopen")[0];
        if (onopen != undefined) onopen.click();
    },

    closePopupByCloser: function (target) {
        Popup.closePopup(target);
    },

    closePopup: function (popup) {
        Popup.selected = null;
        let animation = [{ width: popup.style.width, height: popup.style.height }, { width: "0px", height: "0px" }];
        let timing = { duration: 300, iterations: 1 };
        popup.animate(animation, timing).finished.then(() => popup.style.display = "none");
        Popup.popupBackground.style.display = "none";
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

    populatePopupClickableList: function (container, iterables, getName, getOnclick, unselectedStyle, selectedStyle, isSelectable = false) {
        let group = new Popup.SelectableGroup();
        for (let i = 0; i < iterables.length; i++) {
            let selectable = new Popup.Selectable(getName(iterables[i], i), getOnclick(iterables[i], i), unselectedStyle, selectedStyle, isSelectable);
            group.add(selectable);
        }
        group.generateHTML(container);
    },

    Selectable: class {
        constructor(name, onclick, unselectedStyle, selectedStyle, isSelectable) {
            this.group = null;
            this.name = name;
            if (unselectedStyle == undefined || unselectedStyle == null) {
                this.unselectedStyle = "default-selectable " + WhiteboardSettings.Themes.selectedTheme.defaultSelectable;
            } else {
                this.unselectedStyle = unselectedStyle;
            }
            if (selectedStyle == undefined || selectedStyle == null) {
                this.selectedStyle = "default-selectable-selected " + WhiteboardSettings.Themes.selectedTheme.defaultSelectableSelected;
            } else {
                this.selectedStyle = selectedStyle;
            }
            this.anchor = document.createElement("a");
            this.anchor.setAttribute("class", this.unselectedStyle);
            this.anchor.classList.add("selectable");
            this.anchor.innerHTML = name;
            this.anchor.onclick = function () {
                if (isSelectable) {
                    this.group.select(this);
                }
                try {
                    if (!(onclick == null || onclick == undefined)) onclick();
                } catch (e) {
                    console.log(e);
                }
            }.bind(this);
            this.isSelectable = isSelectable;
        }

    },

    SelectableGroup: class {
        selected = null;
        selectables = [];
        select(selectable) {
            this.selected = selectable;
            for (let i = 0; i < this.selectables.length; i++) {
                let selectedStyles = this.selectables[i].selectedStyle.trim().split(" ");
                selectedStyles.forEach((style) => this.selectables[i].anchor.classList.remove(style));
            }
            let selectedStyles = selectable.selectedStyle.trim().split(" ");
            selectedStyles.forEach((style) => selectable.anchor.classList.add(style));
        }
        add(...selectableItems) {
            selectableItems.forEach((selectable) => { this.selectables.push(selectable); selectable.group = this; });
        }
        generateHTML(parent) {
            this.selectables.forEach((selectable) => parent.appendChild(selectable.anchor));
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

    setOnOpen: function (id, onopen) {
        let popup = document.getElementById(id);
        let anchor = document.createElement("a");
        anchor.onclick = onopen;
        anchor.classList.add("popup-onopen");
        popup.appendChild(anchor);
    },

    initializePopups: function () {
        let popups = document.getElementsByClassName("popup");
        for (let i = 0; i < popups.length; i++) {
            let cls = document.createElement("img");
            cls.setAttribute("class", "close");
            cls.addEventListener("click", () => { Popup.closePopup(Popup.getPopupFromChild(cls)) });
            popups[i].appendChild(cls);
        }
        let inputs = document.getElementsByClassName("popup-input");
        for (let i = 0; i < inputs.length; i++) {
            inputs[i].addEventListener("keydown", (event) => { if (event.key === "Enter" && document.activeElement === inputs[i]) Popup.getPopupFromChild(event.target).getElementsByClassName("apply")[0].click() });
        }
        Popup.popupBackground = document.getElementById("popup-background");
        popupOpeners = document.querySelectorAll("[popup]"); // Grabs all elements with a popup attribute
        for (let i = 0; i < popupOpeners.length; i++) {
            popupOpeners[i].addEventListener("click", () => { Popup.openPopup(popupOpeners[i].getAttribute("popup")) })
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

    getInput: function (wrapperId) {
        return document.getElementById(wrapperId).getElementsByClassName("popup-input")[0];
    },

    getInputValue: function (wrapperId) {
        return document.getElementById(wrapperId).getElementsByClassName("popup-input")[0].value;
    },

    setInputValue: function (wrapperId, value) {
        document.getElementById(wrapperId).getElementsByClassName("popup-input")[0].value = value;
    },

    popupBackground: null,
};

Popup = Popup || {};
