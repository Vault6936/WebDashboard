var Popup = {
    activePopup : null,

    openPopupByOpener: function (target) {
        let popup = document.getElementById(target.getAttribute("popup"));
        popup.setAttribute("open", true);
        let animated = popup.getElementsByClassName("popup-animated");
        for (i = 0; i < animated.length; i++) {
            animated.style.opacity = "100%";
        }
        Popup.activePopup = popup;
        closeBtn = popup.getElementsByClassName("close")[0];
        let contentArray = popup.getElementsByClassName("popup-content");
        let content = null;
        if (contentArray.length == 1) {
            content = popup.getElementsByClassName("popup-content")[0];
        } else {
            throw new Error("Popup wrapper div did not contain div assigned to class 'popup-content'!");
        }
    
        let size = null;
        if (popup.hasAttribute("size")) size = popup.getAttribute("size").split(/[xX]/);
    
        if (size == null) {
            Popup.setPopupSize(popup, 375, 200);
        } else {
            Popup.setPopupSize(popup, parseInt(size[0]), parseInt(size[1]), 0, 0, true)
        }
    
        setTimeout(() => content.style.display = "block", 500);
        
        popup.setAttribute("z-index", "1");
        closeBtn.style.display = "block";
        popupBackground.style.display = "block";
        popupBackground.setAttribute("z-index", "0");
    },

    openPopupByOpenerId: function(id) {
        Popup.openPopupByOpener(document.getElementById(id));
    },

    closePopupByCloser: function (target) {
        let popup = target.parentElement;
        popup.setAttribute("open", false);
        let content = popup.getElementsByClassName("popup-content")[0];
        content.style.display = "none";
        Popup.setPopupSize(popup, 0, 0, false);
        popupBackground.style.display = "none";
        target.style.display = "none";
    },

    setPopupSize: function (element, width, height) {
        width = parseFloat(width);
        height = parseFloat(height);
        element.style.width = width + "px";
        element.style.height = height + "px";
    
    },

    generateSimpleInputPopup: function (popupName, onApply, inputPlaceholder, labelName, userOpened) {
        let div = document.createElement("div");
        div.id = popupName;
        div.setAttribute("class", "popup");
        div.setAttribute("size", "300x200");
        let content = document.createElement("div");
        content.setAttribute("class", "popup-content");
        div.appendChild(content);
        let inputWrapper = document.createElement("div");
        inputWrapper.setAttribute("class", "simple-input-wrapper");
        content.append(inputWrapper)
        let label = document.createElement("p");
        label.setAttribute("class", "input-label");
        label.innerHTML = labelName ?? "set property";
        inputWrapper.appendChild(label);
        let input = document.createElement("input");
        input.setAttribute("type", "text");
        input.setAttribute("placeholder", inputPlaceholder);
        input.setAttribute("class", "popup-input");
        inputWrapper.appendChild(input);
        let applyContainer = document.createElement("div");
        applyContainer.setAttribute("class", "apply-container");
        content.appendChild(applyContainer);
        let apply = document.createElement("button");
        apply.setAttribute("class", "apply");
        apply.onclick = onApply;
        apply.innerHTML = "apply";
        applyContainer.appendChild(apply);
        document.body.appendChild(div);
    
        if (!userOpened) {
            let opener = document.createElement("a");
            opener.setAttribute("popup", popupName);
            opener.id = `open-${popupName}`;
            opener.style.display = "none";
            document.body.appendChild(opener);
        }
    
        return div;    
    },

    populatePopupList: function (popup, iterables, getName, getOnclick) {
        let listContainer = popup.getElementsByClassName("list-container")[0];
        for (let i = 0; i < iterables.length; i++) {
            let a = document.createElement("a");
            a.setAttribute("class", "default-text carousel-item selectable layout-selector-button");
            a.innerHTML = getName(iterables[i]);
            a.onclick = getOnclick(iterables[i]);
            listContainer.appendChild(a);
        }
    },

    initializePopups: function () {
        let popups = document.getElementsByClassName("popup");
        for (let i = 0; i < popups.length; i++) {
            if (popups[i].hasAttribute("code-opened")) {
                let opener = document.createElement("a");
                opener.setAttribute("class", "invisible-popup-opener");
                opener.setAttribute("popup", popups[i].id);
                opener.id = `open-${popups[i].id}`;
                document.body.appendChild(opener);
            }
            let cls = document.createElement("img");
            cls.setAttribute("class", "close");
            cls.setAttribute("src", "./images/close.svg");
            cls.addEventListener("click", (event) => {Popup.closePopupByCloser(event.target)});
            popups[i].appendChild(cls);
        }
    
        popupBackground = document.getElementById("popup-background");
        popupOpeners = document.querySelectorAll("[popup]"); //grabs all elements with a popup attribute
        for (let i = 0; i < popupOpeners.length; i++) {
            popupOpeners[i].addEventListener("click", (event) => {Popup.openPopupByOpener(event.target)})
        }
    },

    getPopupByOpener: function (target) {
        return document.getElementById(target.getAttribute("popup"));
    },

    clickCloseBtn: function () {
        try {
            Popup.activePopup.getElementsByClassName("close")[0].click();
        } catch {
            console.warn("Could not close popup.");
        }
    },

    selected: null,
};

Popup = Popup || {};
