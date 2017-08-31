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

/**
 * Plugin for the slides player object which renders the navigation buttons
 * at the top right of the navbar.
 */
class NavigationButtons {
    /**
     * Constructor
     * @param {Slides} slides Main slides player object
     * @param {Object} events jQuery object which triggers slide player events
     */
    constructor(slides, events) {
        this._slides = slides;
        this._events = events;
        this._ui = {};
        this._uiInitialized = false;
        this._overviewModeEnabled = false;

        events.on("slides:ui:init", () => this.initUi());
        events.on("slides:showSlide", () => this.updateNavigationButtons());
        events.on("slides:slideAmount", () => this.updateNavigationButtons());
        events.on("slides:presentationMode", () => this.updatePresentationMode());
        events.on("slides:ui:mode:overview:enable", () => this.updateOverviewMode(true));
        events.on("slides:ui:mode:overview:disable", () => this.updateOverviewMode(false));
    }

    /**
     * Event handler for `slides:ui:init`.
     * Creates the UI widgets for slide navigation.
     */
    initUi() {
        this._ui.all = $($.parseHTML(`
            <!-- Slide number / Slide amount -->
            <li id="ls-nav-numbers" class="nav-item navbar-text"></li>

            <!-- Overview -->
            <li class="nav-item ml-md-4">
                <a id="ls-nav-overview-mode" class="nav-link" href="#">
                    ${this._slides.config.labelOverview}
                </a>
            </li>

            <!-- PresentationMode -->
            <li class="nav-item">
                <a id="ls-nav-presentation-mode" class="nav-link" href="#">
                    ${this._slides.config.labelPresentationMode}
                </a>
            </li>

            <!-- Previous -->
            <li class="nav-item ml-md-4">
                <a id="ls-nav-prev" class="nav-link" href="#">
                    ${this._slides.config.labelPrev}
                </a>
            </li>

            <!-- Go To -->
            <li class="nav-item">
                <form id="ls-nav-goto-form" class="form-inline">
                    <input id="ls-nav-goto-id" class="form-control" type="text" placeholder="${this._slides.config.labelGoTo}" aria-label="${this._slides.config.labelGoTo}">
                </form>
            </li>

            <!-- Next -->
            <li class="nav-item">
                <a id="ls-nav-next" class="nav-link" href="#">
                    ${this._slides.config.labelNext}
                </a>
            </li>
        `));

        this._ui.numbers = this._ui.all.filter("#ls-nav-numbers")[0];
        this._ui.overviewMode = this._ui.all.find("#ls-nav-overview-mode")[0];
        this._ui.presentationMode = this._ui.all.find("#ls-nav-presentation-mode")[0];
        this._ui.prev = $(this._ui.all.find("#ls-nav-prev")[0]);
        this._ui.gotoForm = $(this._ui.all.find("#ls-nav-goto-form")[0])
        this._ui.gotoId = $(this._ui.all.find("#ls-nav-goto-id")[0])
        this._ui.next = $(this._ui.all.find("#ls-nav-next")[0]);

        /**
         * Toggle presentation and overiew UI mode
         */
        $(this._ui.overviewMode).on("click", event => {
            if (this._overviewModeEnabled) {
                this._slides.uiMode = "slideshow";
            } else {
                this._slides.uiMode = "overview";
            }

            event.preventDefault();
        });

        /**
         * Toggle presentation mode.
         */
        $(this._ui.presentationMode).on("click", () => {
            this._slides.presentationMode = !this._slides.presentationMode;
        });

        /**
         * Go to previous slide.
         */
        this._ui.prev.on("click", () => {
            if (this._slides.slideNumber < 2) return;
            this._slides.slideNumber--;
        });

        /**
         * Go to next slide.
         */
        this._ui.next.on("click", () => {
            if (this._slides.slideNumber >= this._slides.slideAmount) return;
            this._slides.slideNumber++;
        });

        /**
         * Go to slide with given number or id.
         */
        this._ui.gotoForm.on("submit", () => {
            let slideIdRaw = this._ui.gotoId.val();
            let slideId = parseInt(slideIdRaw);
            if (!slideId) slideId = slideIdRaw;

            this._slides.gotoSlide(slideId);
        });

        this._slides.ui.navbar.find("#ls-nav-ul").append(this._ui.all);
        this._uiInitialized = true;
    }

    /**
     * Update the navigation buttons and visible slide numbers as soon as the
     * current slide number or amount of slides changes.
     */
    updateNavigationButtons() {
        if (!this._uiInitialized) return;

        // Update number and amount
        let slideNumber = this._slides.slideNumber;
        let slideAmount = this._slides.slideAmount;

        this._ui.numbers.innerHTML = `${slideNumber} / ${slideAmount}`;
        this._ui.gotoId.val("");

        // Enable or disable back button
        if (slideNumber < 2) {
            this._ui.prev.addClass("disabled");
        } else {
            this._ui.prev.removeClass("disabled");
        }

        // Enable or disable next button
        if (slideNumber >= slideAmount) {
            this._ui.next.addClass("disabled");
        } else {
            this._ui.next.removeClass("disabled");
        }
    }

    /**
     * Update state of the overview mode toggle button.
     */
    updateOverviewMode(enabled) {
        this._overviewModeEnabled = enabled;

        if (enabled) {
            this._ui.overviewMode.classList.add("active");
        } else  {
            this._ui.overviewMode.classList.remove("active");
        }
    }

    /**
     * Update state of the presentation mode toggle button.
     */
    updatePresentationMode() {
        let presentationMode = this._slides.presentationMode;

        if (presentationMode) {
            this._ui.presentationMode.classList.add("active");
        } else  {
            this._ui.presentationMode.classList.remove("active");
        }
    }
}

export default NavigationButtons;
