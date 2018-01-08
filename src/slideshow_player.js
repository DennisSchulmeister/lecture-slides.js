/*
 * lecture-slides.js (https://www.buzzlms.de)
 * © 2017  Dennis Schulmeister-Zimolong <dennis@pingu-mail.de>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */
"use strict";

import $ from "jquery";
import Hammer from "hammerjs";

import plugins from "./plugins/";
import styles from "./style.less";
import themes from "../themes/";

import ObservableValue from "./core/observable_value.js";
import Presentation from "./presentation.js";
import Slide from "./slide.js";
import utils from "./core/utils.js";

/**
 * This is the main entry class of Learning Slides. It must be instantiated
 * inside the presentation HTML like this:
 *
 * <script src="%public_url%/learning-slides.vendor.bundle.js"></script>
 * <script src="%public_url%/learning-slides.app.bundle.js"></script>
 * <script>new SlideshowPlayer().start();</script>
 *
 * The constructor may be given the followong additional configuration values:
 *
 *   ============= ========== ==================================================
 *   NAME          DEFAULT    DESCRIPTION
 *   ============= ========== ==================================================
 *   plugins       {}         External plugins which add additional features
*   ------------- ---------- --------------------------------------------------
 *   embedded      false      Don't set window title and browser history
 *   ------------- ---------- --------------------------------------------------
 *   container     .slides    Query selector to find the parent element, which
 *                            contains the slides
 *   ------------- ---------- --------------------------------------------------
 *   theme         white      Name of the style theme
 *   ------------- ---------- --------------------------------------------------
 *   mode          overview   UI mode at the start of the presentation.
 *                            `overview`: Show an overview of all slides
 *                            `slideshow`: Immediately start the presentation
 *   ------------- ---------- --------------------------------------------------
 *   slideNumber   1          Number of the currently visible slide
 *   ------------- ---------- --------------------------------------------------
 *   presentation- false      Whether to hide detail explanations to the slides
 *   Mode
 *   ------------- ---------- --------------------------------------------------
 *   labelNext     Next       Label for the "go to next slide" button
 *   ------------- ---------- --------------------------------------------------
 *   labelPrev     Previous   Label for the "go to previous slide" button
 *   ------------- ---------- --------------------------------------------------
 *   labelGoTo     Go to      Label for the "go to slide number" field
 *   ------------- ---------- --------------------------------------------------
 *   labelView-    View       Label for the "view" menu where the user switched
 *   Menu                     between available view modes
 *   ------------- ---------- --------------------------------------------------
 *   labelOverview Overview   Label for the "Overview" mode
 *   ------------- ---------- --------------------------------------------------
 *   labelSlide-   Slides     Label for the "Slideshow" mode
 *   View
 *   ------------- ---------- --------------------------------------------------
 *   labelPrint-   Print      Label for the "Print" mode
 *   View
 *   ------------- ---------- --------------------------------------------------
 *   labelPresen-  Presen-    Label for the "Presentation mode" button
 *   tationMode    tation
 *                 Mode
 *   ------------- ---------- --------------------------------------------------
 *   label-       Navigation  Label for the responsive navbar toggle button
 *   Navigation
 *   ------------- ---------- --------------------------------------------------
 *   labelSlide    Slide      Label for slides without a title
 *   ============= ========== ==================================================
 *
 * This class only controls the presentation state (which slide is visible)
 * and maintains the basic UI layout. It doesn't render any slides or provide
 * anything more than the a bare minimal UI, though. Therefor it contains a
 * set of observable values which need to be watched by the various plugins
 * in order to complete the UI:
 *
 *   * Initialization phase:
 *
 *       * {Boolean} init: A flag indication that initialization of the player
 *         has started. The plugins have to bind to this in order to start up
 *         at the right time when the player is available and the presentation
 *         data is available.
 *
 *       * {Boolean} ready: A flag indicating that initialization is over
 *         and the player is now running the slideshow.
 *
 *   * User Interface:
 *
 *       * {String} theme: The name of the currently set UI theme.
 *
 *       * {String} uiMode: The name of the currently active UI mode. The name
 *         itself has no meaning to the player. But it is used by the plugins
 *         to detect when they are responsible for the UI.
 *
 *       * {String} windowTitle: The window title (presentation + slide title)
 *
 *       * {String} navbarTitle: The title visible in the navigation bar
 *
 *       * {Object} page: Definition of content visible in the UI main area.
 *         The plugins set this to an object with the following keys, in order
 *         to display something in the main area:
 *
 *             * element: DOM Element with the displayed content
 *             * title: Sub title (e.g. slide title)
 *             * slideId: Optional slide id for the SPA navigation
 *             * fade: Boolean whether a cross-fade animation should be played
 *
 *   * Currently running presentation:
 *
 *       * {Integer} slideNumber: Currently visible slide number
 *
 *       * {Boolean} presentationMode: A flag indicating, that only slides with
 *         no detail explanations shall be shown.
 *
 *       * Note, that the `presentation` instance attribute contains the slides
 *         and any information on them (amount of slides, visible slides, …)
 */
class SlideshowPlayer {
    /**
     * Constructor.
     * @param {Object} config Additional configuration values (optional)
     */
    constructor(config) {
        // Configuration values
        this.config = config || {};

        if (!this.config.plugins) this.config.plugins = {};
        if (!this.config.embedded) this.config.embedded = false;
        if (!this.config.container) this.config.container = ".slides";
        if (!this.config.theme) this.config.theme = "white";
        if (!this.config.mode) this.config.mode = "overview";
        if (!this.config.slideNumber) this.config.slideNumber = 1;
        if (!this.config.presentationMode) this.config.presentationMode = false;

        if (!this.config.labelNext) this.config.labelNext = "Next";
        if (!this.config.labelPrev) this.config.labelPrev = "Previous";
        if (!this.config.labelGoTo) this.config.labelGoTo = "Go to";
        if (!this.config.labelViewMenu) this.config.labelViewMenu = "View";
        if (!this.config.labelOverview) this.config.labelOverview = "Overview";
        if (!this.config.labelSlideView) this.config.labelSlideView = "Slides";
        if (!this.config.labelPrintView) this.config.labelPrintView = "Print";
        if (!this.config.labelPresentationMode) this.config.labelPresentationMode = "Presentation Mode";
        if (!this.config.labelNavigation) this.config.labelNavigation = "Navigation";
        if (!this.config.labelSlide) this.config.labelSlide = "Slide";

        // Presentation which holds the slides
        this.presentation = null;

        // Create observable values
        this.init = new ObservableValue(false);
        this.ready = new ObservableValue(false);
        this.theme = new ObservableValue("");
        this.uiMode = new ObservableValue("");
        this.windowTitle = new ObservableValue("");
        this.navbarTitle = new ObservableValue("");
        this.page = new ObservableValue({});

        this.slideNumber = new ObservableValue(0);
        this.presentationMode = new ObservableValue(false);
        this.fadeOutColor = new ObservableValue("");

        this.uiMode.addValidator(newValue => {
            if (!this._uiModes[newValue]) {
                console.log("Unknown UI mode:", newValue);
                return false;
            }

            return true;
        });

        this.theme.addValidator(newValue => {
            if (!themes[newValue]) {
                console.log("Unknown theme:", newValue);
                return false;
            }

            return true;
        });

        this.slideNumber.addValidator(newValue => {
            if (newValue > this.presentation.amountVisible.value) {
                console.log("Invalid slide number:", newValue);
                console.log(`There are only ${this.presentation.amountVisible.value} slides`);
                return false;
            } else if (newValue < 1) {
                console.log("Invalid slide number:", newValue);
                console.log("The minimum slide number is 1.");
                return false;
            }

            return true;
        });

        this.theme.bindFunction((newValue, oldValue) => this._updateTheme(newValue, oldValue));
        this.navbarTitle.bindFunction(newValue => this._updateTitle(newValue));
        this.page.bindFunction(newValue => this._updateMainContent(newValue));

        this._lockHistory = false;
        this.slideNumber.bindFunction((newValue, oldValue) => this._pushNavigationHistory(newValue, oldValue));

        // DOM elements for the user interface
        this.ui = {};

        this._uiInitialized = false;
        this._uiModes = {};
        this._container = null;

        // Event listeners for single-page navigation
        if (!this.config.embedded) {
            window.addEventListener("click", event => this._onLinkClicked(event));
            window.addEventListener("popstate", event => this._onHistoryChanged(event));
        }

        // Plugins instances
        this._plugins = {}

        for (let pluginName in plugins) {
            this._plugins[pluginName] = new plugins[pluginName](this);
        }

        for (let pluginName in this.config.plugins) {
            let plugin = this.config.plugins[pluginName];
            this._plugins[pluginName] = plugin;
            if (plugin.setPlayer) plugin.setPlayer(this);
        }
    }

    /**
     * Find DOM elements with the presentation data and run the presentation.
     */
    start() {
        // Find DOM nodes with presentation content
        this._container = $(this.config.container);

        if (!this._container) {
            console.log("Presentation content not found. Please check your HTML.");
            return;
        }

        let presentationHtml = this._container.clone()[0];
        this._container.empty();

        // Initialize user interface
        if (!this._uiInitialized) {
            this._uiInitialized = true;

            for (let pluginName in this._plugins) {
                let plugin = this._plugins[pluginName];
                if (!plugin.preprocessHtml) continue;
                plugin.preprocessHtml(presentationHtml, utils);
            }

            this.presentation = Presentation.createFromHtml(this, presentationHtml);
            this._buildUiFrame();

            let slideIdFromUrl = location.hash.slice(1);

            this.init.value = true;
            this.theme.value = this.config.theme;
            this.uiMode.value = this.config.mode;
            this.slideNumber.value = slideIdFromUrl.length > 0 ? slideIdFromUrl : this.config.slideNumber;
            this.presentationMode.value = this.config.presentationMode;

            delete Hammer.defaults.cssProps.userSelect; // Allow text selection on Desktop
            let hammer = new Hammer.Manager(this._container[0]);
            hammer.add(new Hammer.Swipe({event: "swipe-left", direction: Hammer.DIRECTION_LEFT}));
            hammer.add(new Hammer.Swipe({event: "swipe-right", direction: Hammer.DIRECTION_RIGHT}));
            hammer.add(new Hammer.Tap({event: "double-tap", taps: 2}));
            hammer.add(new Hammer.Press({event: "long-press", time: 750}));
            hammer.on("swipe-left", event => this._handleTouchGesture(event));
            hammer.on("swipe-right", event => this._handleTouchGesture(event));
            hammer.on("double-tap", event => this._handleTouchGesture(event));
            hammer.on("long-press", event => this._handleTouchGesture(event));

            this._container[0].addEventListener("keyup", event => this._handleKeyUpEvent(event));
            this._container.removeClass("invisible");
        }

        // Notify plugins
        this.ready.value = true;
    }

    /**
     * Called by some plugins to register a new UI mode. UI modes define the
     * principal layout and behaviour of the user interface, while this object
     * merely controls the number of slides and the current slide number. Thus
     * there is at least one UI mode plugin which is responsible for actually
     * rendering the slides and possibly another one for displaying a slide
     * overview.
     *
     * Say a plugin registered the `slideshow` UI mode while another one
     * registered the `overview` mode. When the user switches from slideshow
     * to overview mode, the following events will be triggered:
     *
     *   1. player:uiMode:disable:slideshow
     *   2. player:uiMode:enable:overview
     *
     * Each plugin is then responsible to listen to its disable and enable
     * events in order to show or hide its UI.
     *
     * @param {String} uiMode Technical ID of the UI mode
     * @returns {Boolean} true on success, false otherwise
     */
    registerUiMode(uiMode) {
        if (this._uiModes[uiMode]) {
            console.log("UI mode already registered:", uiMode);
            return false;
        }

        this._uiModes[uiMode] = true;
        return true;
    }

    /**
     * Jump to a slide by number or id.
     * @param  {String|Integer} slideId id or number of the slide
     */
    gotoSlide(slideId) {
        let slide = this.presentation.getSlide(slideId);
        if (!slide) return;

        let newNumber = this.presentation.getSlideNumber(slide);
        if (newNumber > 0) this.slideNumber.value = newNumber;
    }

    /**
     * Returns the DOM element which needs to be accessed to get or set the
     * current scroll position.
     *
     * @param {Boolen} eventListener: Return the object which is needed to
     *   add an scroll-EventListener, instead.
     * @return {Element} The DOM element to set or get the scroll position
     */
    getScrollElement(eventListener) {
        if (!this.config.embedded) {
            if (eventListener) return window;
            else return document.documentElement;
        } else {
            return this._container;
        }
    }

    /**
     * This creates the most basic UI elements of the slideshow. The plugins
     * later fill it with additional widgets.
     */
    _buildUiFrame() {
        // Append navbar to container
        let navbarClass = "fixed-top";
        let mainStyle = "margin-top: 4rem";

        if (this.config.embedded) {
            navbarClass = "sticky-top";
            mainStyle = "";
        }

        this.ui.navbar = $($.parseHTML(`
            <div id="ls-main-top" class="${navbarClass}">
                <nav id="ls-navbar" class="navbar navbar-expand-md navbar-light">
                    <span id="ls-title" class="navbar-brand navbar-text">
                        <!-- Slide title -->
                    </span>

                    <button
                        class="navbar-toggler"
                        type="button"
                        data-toggle="collapse"
                        data-target="#ls-navbar-toggled"
                        aria-controls="ls-navbar-toggled"
                        aria-expanded="false"
                        aria-label="${this.config.labelNavigation}"
                    >
                        <span class="navbar-toggler-icon"></span>
                    </button>

                    <div id="ls-navbar-toggled" class="collapse navbar-collapse">
                        <ul id="ls-nav-ul" class="navbar-nav ml-auto">
                            <!-- Nav items -->
                        </ul>
                    </div>
                </nav>
            </div>
        `));

        this.ui.main = $($.parseHTML(`
            <div
                id="ls-main"
                style="
                    flex-grow: 1;
                    flex-shrink: 1;

                    display: flex;
                    flex-direction: column;
                    align-content: stretch;

                    ${mainStyle}";
            ></div>
        `));

        this.ui.fadeOut = $($.parseHTML(`
            <div
                id="ls-main-fadeout"
                style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    min-width: 100%;
                    min-height: 100%;
                    z-index: -9999;

                    transition: background-color 0.75s;"
            ></div>
        `));

        this._container.append(this.ui.fadeOut);
        this._container.append(this.ui.navbar);
        this._container.append(this.ui.main);

        // Display presentation title in the navbar
        this.navbarTitle.value = this.presentation.title.value;
    }

    /**
     * Switch the currently used theme.
     *
     * @param {String} newTheme Name of the new theme. There must be a .less-file
     *   of the same name in the theme directory. Also the .less-file must be
     *   exported by theme/index.js.
     *
     * @param {String} oldTheme Previously active theme or an empty string
     */
    _updateTheme(newValue, oldValue) {
        if (oldValue != "") {
            let oldTheme = themes[oldValue];
            this._container.removeClass(oldTheme.style);
        }

        let newTheme = themes[newValue];
        this._container.addClass(newTheme.style);
        this._container.addClass(styles.container);
    }

    /**
     * Set the title in the navigation bar.
     * @param {String} title New Title
     */
    _updateTitle(title) {
        this.ui.navbar.find("#ls-title")[0].innerHTML = title;
    }

    /**
     * Switch the currently visible content of the main area. At least a DOM
     * element with the content must be given. Optionaly the window title may
     * be changed and a slide ID for backwards navigation can be remembered.
     *
     * @param {Object} page Page definition of the new main content:
     *     * {Element} element: DOM element to show
     *     * {String} title: Sub title (e.g. slide title) (optional)
     *     * {String} slideId: Slide id for SPA navigation (optional)
     *     * {Boolean} fade: Cross-fade to the new page (optional)
     */
    _updateMainContent(page) {
        // Show new content
        let element = page.element || document.createElement("div");
        let title = page.title || "";
        let slideId = page.slideId;
        let fade = page.fade || false;

        let oldContent = this.ui.main.find("*");

        if (oldContent.length === 0 || !fade) {
            this.ui.main[1].innerHTML = "";
            this.ui.main[1].appendChild(element);
        } else {
            this.ui.main.fadeOut("fast", () => {
                // Don't use jQuery detach() and append() here as this will
                // break updating the UI elements !?!?!
                this.ui.main[1].innerHTML = "";
                this.ui.main[1].appendChild(element);
            }).delay(100).fadeIn("fast");
        }

        // Update window title
        if (this.presentation.title.value != "" && title != "") {
            document.title = `${this.presentation.title.value}: ${title}`;
        } else if (this.presentation.title.value != "") {
            document.title = this.presentation.title.value;
        } else if (title != "") {
            document.title = title;
        }
    }

    /**
     * Push a new entry to the browser's navigation history. This is called
     * automatically when the slide number has changed independent of the
     * current plugin actually showing the slide. However the history is only
     * written in slideshow mode.
     *
     * @param  {Integer} newSlideNumber New slide number
     * @param  {Integer} oldSlideNumber Previous slide number or 0
     */
    _pushNavigationHistory(newSlideNumber, oldSlideNumber) {
        if (this._lockHistory) return;
        if (!this.uiMode.value === "slideshow") return;

        let state = {
            slideId: newSlideNumber,
        };

        let url = `#${newSlideNumber}`;

        if (oldSlideNumber == 0) {
            history.replaceState(JSON.stringify(state), "", url);
        } else {
            history.pushState(JSON.stringify(state), "", url);
        }
    }

    /**
     * DOM event handler for clicked links. The event handler is actually added
     * to the window object in order to capture all clicks to all links no matter
     * how and when the link elements were created.
     *
     * Normal links will continue to work as usual, triggering the browser
     * to load a new page. However if the link contains a hash URL the link
     * will be used to goto a new slide.
     *
     * Thus the following link loads a new page from the server:
     *
     *   <a href="/goto/new/page">New Page</a>
     *
     * The following link goes to slide by its number:
     *
     *   <a href="#42">Slide 42</a>
     *
     * The following link goes to slide by its id:
     *
     *   <a href="#introduction">Intro Slide</a>
     *
     * @param {DOMEvent} event The captured click event
     */
    _onLinkClicked(event) {
        let target = event.target;
        while (target && target.nodeName != "A") target = target.parentNode;
        if (!target || target.nodeName != "A") return;

        let href = target.getAttribute("href");
        if (href === null || !href.startsWith("#")) return;

        let slideId = target.hash.slice(1);
        if (!slideId.length) return;

        event.preventDefault();
        this.gotoSlide(slideId);

        if (this.uiMode.value != "slideshow") this.uiMode.value = "slideshow";
    }

    /**
     * DOM event handler for the popstate event which is triggered by the
     * browser everytime the navigation history inside the same page has
     * changed. Usually this means that the user clicked to back or forward
     * buttons of the browser or window.history has been changed via some
     * javascript code.
     *
     * This event causes the player to goto a new slide whose number or
     * id was given in the hash tag of the URL.
     *
     * @param {DOMEvent} event The captured popstate event
     */
    _onHistoryChanged(event) {
        let slideId = 1;

        if (event.state) {
            let state = JSON.parse(event.state)
            slideId = state.slideId;
        } else {
            slideId = location.hash.slice(1);
        }

        this._lockHistory = true;
        this.gotoSlide(slideId);
        this._lockHistory = false;

        if (this.uiMode.value != "slideshow") this.uiMode.value = "slideshow";
    }

    /**
     * Handle keyboard events. The following keys are supported:
     *
     *   * Left Arrow: Previous slide
     *   * Right Arrow, Space, Enter, N: Next slide
     *   * ESC, 1: Overview Mode
     *   * 2: Slideshow Mode
     *   * 3: Print Mode
     *   * P: Presentation Mode
     *   * B: Fade to black
     *   * W: Fade to white
     *
     * @param {KeyboardEvent} event The DOM event
     */
    _handleKeyUpEvent(event) {
        if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) return;

        switch (event.code) {
            case "ArrowLeft":
                // Previous slide
                if (this.fadeOutColor.value === "") {
                    if (this.slideNumber.value > 1) {
                        this.slideNumber.value--;
                    }
                }
                break;
            case "ArrowRight":
            case "Enter":
            case "Space":
            case "KeyN":
                // Next slide
                if (this.fadeOutColor.value === "") {
                    if (this.slideNumber.value < this.presentation.amountVisible.value) {
                        this.slideNumber.value++;
                    }
                }
                break;
            case "Escape":
            case "Digit1":
            case "Numpad1":
                // Switch to overview mode
                if (this.fadeOutColor.value === "") {
                    if (this.uiMode.value != "overview") {
                        this.uiMode.value = "overview";
                    }
                }
                break;
            case "Digit2":
            case "Numpad2":
                // Switch to slideshow mode
                if (this.fadeOutColor.value === "") {
                    if (this.uiMode.value != "slideshow") {
                        this.uiMode.value = "slideshow";
                    }
                }
                break;
            case "Key3":
            case "Digit3":
            case "Numpad3":
                // Switch to print mode
                if (this.fadeOutColor.value === "") {
                    if (this.uiMode.value != "print") {
                        this.uiMode.value = "print";
                    }
                }
                break;
            case "KeyP":
                // Toggle presentation mode
                if (this.fadeOutColor.value === "") {
                    this.presentationMode.value = !this.presentationMode.value;
                }
                break;
            case "KeyB":
                // Fade to black
                this._toggleFadeOut("black");
                break;
            case "KeyW":
                // Fade to white
                this._toggleFadeOut("white");
                break;
        }
    }

    /**
     * Handle touch gestures. The following gestures are supported:
     *
     *   * Swipe left: Next slide
     *   * Swipe right: Previous slide
     *   * Double Tap: Toggle presentation mode
     * @param  {[HammerEvent]} event hammer.js touch gesture event
     */
    _handleTouchGesture(event) {
        if (event.pointerType === "mouse") return;

        switch (event.type) {
            case "swipe-left":
                // Next slide
                if (this.fadeOutColor.value === "") {
                    if (this.slideNumber.value < this.presentation.amountVisible.value) {
                        this.slideNumber.value++;
                    }
                }
                break;
            case "swipe-right":
                // Previous slide
                if (this.fadeOutColor.value === "") {
                    if (this.slideNumber.value > 1) {
                        this.slideNumber.value--;
                    }
                }
                break;
            case "double-tap":
                // Toggle presentation mode
                if (this.fadeOutColor.value === "") {
                    this.presentationMode.value = !this.presentationMode.value;
                }
                break;
            case "long-press":
                // Toggle overview
                if (this.fadeOutColor.value === "") {
                    if (this.uiMode.value === "slideshow") {
                        this.uiMode.value = "overview";
                    } else if (this.uiMode.value === "overview") {
                        this.uiMode.value = "slideshow";
                    }
                }
                break;
        }
    }

    /**
     * This implements the fade to black and fade to white features. Calling
     * this method will either fade the countent out or fades it back in.
     *
     * @param  {String} color CSS color declaration
     */
    _toggleFadeOut(color) {
        let div = this.ui.fadeOut.filter("*")[0];

        if (this.fadeOutColor.value != color) {
            // Fade out content
            this.fadeOutColor.value = color;
            div.style.zIndex = 9999;
            div.style.backgroundColor = color;
        } else {
            // Fade in content
            this.fadeOutColor.value = "";
            div.style.backgroundColor = "rgba(0,0,0,0)";
            window.setTimeout(() => div.style.zIndex = -9999, 1000);
        }
    }
}

export default SlideshowPlayer;
