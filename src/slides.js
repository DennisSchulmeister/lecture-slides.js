/*
 * Learning Slides (https://www.buzzlms.de)
 * © 2017  Dennis Schulmeister-Zimolong <dennis@pingu-mail.de>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */
"use strict";

import $ from "jquery";

import plugins from "./app.js";
import styles from "./app.less";
import themes from "../themes/";

/**
 * This is the main entry class of Learning Slides. It must be instantiated
 * inside the presentation HTML like this:
 *
 * <script src="%public_url%/learning-slides.vendor.bundle.js"></script>
 * <script src="%public_url%/learning-slides.app.bundle.js"></script>
 * <script>new Slides().start();</script>
 *
 * The constructor may be given the followong additional configuration values:
 *
 *   ============= ========== ==================================================
 *   NAME          DEFAULT    DESCRIPTION
 *   ============= ========== ==================================================
 *   container     .slides    Query selector to find the parent element, which
 *                            contains the slides
 *   ------------- ---------- --------------------------------------------------
 *   slides        section    Query selector to find the DOM elements inside
 *                            the container, which contain slide contents.
 *   ------------- ---------- --------------------------------------------------
 *   header        header     Query selector to find the DOM element inside
 *                            the container, which contains the presentation
 *                            name and front matter.
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
 *   labelOverview Overview   Label for the "Overview" button
 *   ------------- ---------- --------------------------------------------------
 *   labelPresen-  Presen-    Label for the "Presentation mode" button
 *   tationMode    tation
 *                 Mode
*    ------------- ---------- --------------------------------------------------
 *   label-       Navigation  Label for the responsive navbar toggle button
 *   Navigation
 *   ============= ========== ==================================================
 *
 * There is exactly one object of this class per presentation. It manages the
 * state logic of which slide is currently visible. However the rendering of
 * the slides and surrounding UI is delegated to the various plugin classes,
 * which therefor must bind to the various events sent by this object:
 *
 *   =========================== ================== ============================
 *   EVENT                       PARAMETERS         DESCRIPTION
 *   =========================== ================== ============================
 *   slides:started              None               Slide show is initialized
 *                                                  and ready to run
 *   --------------------------- ------------------ ----------------------------
 *   slides:newTheme             name: theme name   A new theme has been set
 *   --------------------------- ------------------ ----------------------------
 *   slides:ui:mode:xxx:disable  None               Disable UI mode xxx
 *   --------------------------- ------------------ ----------------------------
 *   slides:ui:mode:xxx:enable   None               Enable UI mode xxx
 *   --------------------------- ------------------ ----------------------------
 *   slides:showSlide            nr: slide number   Show slide with given number
 *   --------------------------- ------------------ ----------------------------
 *   slides:slideAmount          amount             Raised each time the total
 *                                                  amount of visible slides
 *                                                  changes. Will be raised at
 *                                                  least once during UI init.
 *   --------------------------- ------------------ ----------------------------
 *   slides:presentationMode     on: boolean        Presentation mode is now
 *                                                  on or off
 *   =========================== ================== ============================
 */
class Slides {
    /**
     * Constructor.
     * @param {Object} config Additional configuration values (optional)
     */
    constructor(config) {
        // Configuration values
        this.config = config || {};

        if (!this.config.container) this.config.container = ".slides";
        if (!this.config.slides) this.config.slides = "section"
        if (!this.config.header) this.config.header = "header";
        if (!this.config.theme) this.config.theme = "white";
        if (!this.config.mode) this.config.mode = "overview";
        if (!this.config.slideNumber) this.config.slideNumber = 1;
        if (!this.config.presentationMode) this.config.presentationMode = false;
        if (!this.config.labelNext) this.config.labelNext = "Next";
        if (!this.config.labelPrev) this.config.labelPrev = "Previous";
        if (!this.config.labelGoTo) this.config.labelGoTo = "Go to";
        if (!this.config.labelOverview) this.config.labelOverview = "Overview";
        if (!this.config.labelPresentationMode) this.config.labelPresentationMode = "Presentation Mode";
        if (!this.config.labelNavigation) this.config.labelNavigation = "Navigation";

        this.config.slides = `${this.config.container} > ${this.config.slides}`;

        // DOM elements with slide content
        this._container = null;
        this._slides = null;
        this._header = null;

        this._slideAmount = 0;
        this._slidesEnabled = [];

        this._uiInitialized = false;
        this._uiModes = {};
        this.ui = {};

        // Initialize plugins
        this.events = $(document.createElement("div"));
        this._plugins = {}

        for (let pluginName in plugins) {
            this._plugins[pluginName] = new plugins[pluginName](this, this.events);
        }
    }

    /**
     * Find DOM elements with the presentation data and run the presentation.
     * @param {Boolean} onload Wait until the html page has finished loading
     */
    start(onload) {
        // Find DOM nodes with presentation content
        this._container = $(this.config.container);
        this._slides = $(this.config.slides);
        this._header = $(this.config.header);

        if (!this._container || !this._slides) {
            console.log("Presentation content not found. Please check your HTML.");
            return;
        }

        // Initialize user interface
        if (!this._uiInitialized) {
            this._uiInitialized = true;

            this._slides.detach();
            this._header.detach();
            this._updateSlideList();
            this._buildUiFrame();
            this.events.trigger("slides:ui:init");

            this.theme = this.config.theme;
            this.uiMode = this.config.mode;
            this.slideNumber = this.config.slideNumber;
            this.presentationMode = this.config.presentationMode;

            this._container.removeClass("invisible");
        }

        // Notify plugins
        this.events.trigger("slides:started");
    }

    /**
     * Switch the currently used theme.
     * @param {String} theme Name of the new theme. There must be a .less-file
     *   of the same name in the theme directory. Also the .less-file must be
     *   exported by theme/index.js.
     */
    set theme(theme) {
        if (!themes[theme]) {
            console.log("Unknown theme: ", theme);
            return;
        }

        if (this.config.theme) {
            let oldTheme = themes[this.config.theme];
            this._container.removeClass(oldTheme.style);
        }

        let newTheme = themes[theme];
        this._container.addClass(newTheme.style);
        this._container.addClass(styles.container);

        this.config.theme = theme;
        this.events.trigger("slides:newTheme", {name: theme});
    }

    /**
     * Get the name of the current theme.
     * @return {String} Name of the current theme
     */
    get theme() {
        return this.config.theme;
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
     *   1. slides:uiMode:disable:slideshow
     *   2. slides:uiMode:enable:overview
     *
     * Each plugin is then responsible to listen to its disable and enable
     * events in order to show or hide its UI.
     *
     * @param {String} uiMode Technical ID of the UI mode
     */
    registerUiMode(uiMode) {
        this._uiModes[uiMode] = true;
    }

    /**
     * Switch the currently active UI mode.
     * @param {String} uiMode Technical ID of the UI mode
     */
    set uiMode(uiMode) {
        if (!this._uiModes[uiMode]) {
            console.log("Unknown UI mode:", uiMode);
            return;
        }

        this.events.trigger(`slides:ui:mode:${this.config.mode}:disable`);
        this.events.trigger(`slides:ui:mode:${uiMode}:enable`);
        this.config.mode = uiMode;
    }

    /**
     * Get the currently active UI mode.
     * @return {String} Technical ID of the UI mode
     */
    get uiMode() {
        return this.config.mode;
    }

    /**
     * Set a flag whether to hide the detail explanations to the slides.
     * This is called presentation mode because the long explanations are
     * not meant to be shown on beamer.
     *
     * @param {Boolean} presentationMode true of false
     */
    set presentationMode(presentationMode) {
        this.config.presentationMode = presentationMode;
        this.events.trigger("slides:presentationMode", {on: presentationMode});
    }

    /**
     * Get whether detail explanations are hidden.
     * @return {Boolean} true of false
     */
    get presentationMode() {
        return this.config.presentationMode;
    }

    /**
     * Set the currently visible slide
     * @param  {Integer} slideNumber Slide number
     */
    set slideNumber(slideNumber) {
        if (slideNumber > this._slideAmount) {
            console.log("Invalid slide number:", slideNumber);
            console.log(`There are only ${this._slideAmount} slides`);
            return;
        } else if (slideNumber < 1) {
            console.log("Invalid slide number:", slideNumber);
            console.log("The minimum slide number is 1.");
            return;
        }

        this.config.slideNumber = slideNumber;
        this.events.trigger("slides:showSlide", {nr: slideNumber});
    }

    /**
     * Get the number of the currently visible slide
     * @return {Integer} Slide number
     */
    get slideNumber() {
        return this.config.slideNumber;
    }

    /**
     * Get the amount of availbe slides
     * @return {Integer} Slide amount
     */
    get slideAmount() {
        return this._slideAmount;
    }

    /**
     * Find the raw DOM element which contains the definition of a slide.
     * The slideId may either be a string or an integer. If it is a string
     * the slide is searched by its id attribute. Otherwise the slideId is
     * treated as the slide number. The slide number then refers only to
     * enabled slides.
     *
     * @param  {String|Integer} slideId id or number of the slide
     * @return {jQueryDomElement} DOM element with the slide definition
     */
    getSlide(slideId) {
        let slide = null;

        if (typeof slideId === 'string' || slideId instanceof String) {
            for (let i = 0; i < this._slidesEnabled.length; i++) {
                let slide1 = this._slidesEnabled[i];

                if (slide1.attr("id") === slideId) {
                    slide = slide1;
                    break;
                }
            }
        } else {
            slide = this._slidesEnabled[slideId - 1];
        }

        if (!slide) {
            console.log("Invalid slide id:", slideId);
            return null;
        }

        return slide;
    }

    /**
     * Jump to a slide by number or id.
     * @param  {String|Integer} slideId id or number of the slide
     */
    gotoSlide(slideId) {
        let slide = this.getSlide(slideId);
        if (!slide) return;

        for (let i = 0; i < this._slidesEnabled.length; i++) {
            let slide1 = this._slidesEnabled[i];

            if (slide === slide1) {
                this.slideNumber = i + 1;
                break;
            }
        }
    }

    /**
     * Disable a slide and thus remove it from the presentation. This can be
     * used to toggle extra slides at runtime. e.g. one could insert an
     * "Explain details" button to a slide which would enable or disable
     * some extra slides.
     *
     * The slideId can either be an integer or an string. If it is an integer
     * it refers to the slide number. If it is an string it refers to the id
     * attribute of the slide.
     *
     * BEWARE: It is safer to access slides by id because the number constantly
     * changes when slides are added or removed.
     *
     * If the currently visible slide is disabled the next slide will be shown.
     *
     * In order to permanently disable a slide it can also be given the
     * `invisible` CSS class in the HTML definition. This makes it possible
     * to have slides disabled by default which can be reenabled at run time.
     *
     * @param {String|Integer} slideId id or number of the slide
     */
    disableSlide(slideId) {
        let currentSlide = this.getSlide(this.config.slideNumber);

        let slideElement = this.getSlide(slideId);
        if (!slideElement) return;
        slideElement.addClass("invisible");
        this._updateSlideList();

        if (slideElement === currentSlide) {
            if (this.config.slideNumber < this._slideAmount) {
                this.slideNumber = this.config.slideNumber + 1;
            } else {
                this.slideNumber = this.config.slideNumber - 1;
            }
        }
    }

    /**
     * Reenable a previously disabled slide. See `disableSlide()` for details.
     * @param {String|Integer} slideId id or number of the slide
     */
    enableSlide(slideId) {
        let slideElement = this.getSlide(slideId);
        if (!slideElement) return;
        slideElement.removeClass("invisible");
        this._updateSlideList();
    }

    /**
     * Update the internal list of enabled slides. This goes through the list
     * `this._slides` and fills `this._slidesEnabled` whith all slides DOM
     * elements without an `invisible` CSS class.
     */
    _updateSlideList() {
        this._slidesEnabled = [];

        this._slides.each(index => {
            let slide = $(this._slides.get(index));

            if (!slide.hasClass("invisible")) {
                this._slidesEnabled.push(slide);
            }
        });

        this._slideAmount = this._slidesEnabled.length;
        this.events.trigger("slides:slideAmount", {amount: this._slideAmount});
    }

    /**
     * This creates the most basic UI elements of the slideshow. The plugins
     * later fill it with additional widgets.
     */
    _buildUiFrame() {
        this.ui.navbar = $($.parseHTML(`
            <nav id="ls-navbar" class="navbar navbar-expand-md navbar-light sticky-top">
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
        `));

        this.ui.main = $($.parseHTML(`
            <div id="ls-main" class="container-fluid"></div>
        `));

        this._container.append(this.ui.navbar);
        this._container.append(this.ui.main);
    }

    /**
     * Set the title in the navigation bar.
     * @param {String} title New Title
     */
    setTitle(title) {
        this.ui.navbar.find("#ls-title")[0].innerHTML = title;
    }
}

export default Slides;
