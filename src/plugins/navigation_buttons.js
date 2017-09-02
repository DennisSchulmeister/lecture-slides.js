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
     * @param {SlideshowPlayer} player Main slides player object
     */
    constructor(player, events) {
        this._player = player;
        this._ui = {};
        this._uiInitialized = false;
        this._overviewModeEnabled = false;

        player.init.bindFunction(() => this._initUi());
    }

    /**
     * Event handler for `slides:ui:init`.
     * Creates the UI widgets for slide navigation.
     */
    _initUi() {
        if (this._uiInitialized) return;
        this._uiInitialized = true;

        this._player.uiMode.bindFunction((newValue) => newValue === "overview" ? this._updateOverviewMode(true) : this._updateOverviewMode(false));
        this._player.slideNumber.bindFunction(() => this._updateNavigationButtons());
        this._player.presentation.amountVisible.bindFunction(() => this._updateNavigationButtons());
        this._player.presentationMode.bindFunction(() => this._updatePresentationMode());

        this._ui.all = $($.parseHTML(`
            <!-- Slide number / Slide amount -->
            <li id="ls-nav-numbers" class="nav-item navbar-text"></li>

            <!-- Overview -->
            <li class="nav-item ml-md-4">
                <a id="ls-nav-overview-mode" class="nav-link">
                    ${this._player.config.labelOverview}
                </a>
            </li>

            <!-- PresentationMode -->
            <li class="nav-item">
                <a id="ls-nav-presentation-mode" class="nav-link">
                    ${this._player.config.labelPresentationMode}
                </a>
            </li>

            <!-- Previous -->
            <li class="nav-item ml-md-4">
                <a id="ls-nav-prev" class="nav-link">
                    ${this._player.config.labelPrev}
                </a>
            </li>

            <!-- Go To -->
            <li class="nav-item">
                <form id="ls-nav-goto-form" class="form-inline">
                    <input id="ls-nav-goto-id" class="form-control" type="text" placeholder="${this._player.config.labelGoTo}" aria-label="${this._player.config.labelGoTo}">
                </form>
            </li>

            <!-- Next -->
            <li class="nav-item">
                <a id="ls-nav-next" class="nav-link">
                    ${this._player.config.labelNext}
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
                this._player.uiMode.value = "slideshow";
            } else {
                this._player.uiMode.value = "overview";
            }

            event.preventDefault();
        });

        /**
         * Toggle presentation mode.
         */
        $(this._ui.presentationMode).on("click", () => {
            this._player.presentationMode.value = !this._player.presentationMode.value;
        });

        /**
         * Go to previous slide.
         */
        this._ui.prev.on("click", () => {
            if (this._player.slideNumber.value < 2) return;
            this._player.slideNumber.value--;
        });

        /**
         * Go to next slide.
         */
        this._ui.next.on("click", () => {
            if (this._player.slideNumber.value >= this._player.presentation.amountVisible.value) return;
            this._player.slideNumber.value++;
        });

        /**
         * Go to slide with given number or id.
         */
        this._ui.gotoForm.on("submit", () => {
            let slideIdRaw = this._ui.gotoId.val();
            let slideId = parseInt(slideIdRaw);
            if (!slideId) slideId = slideIdRaw;

            this._player.gotoSlide(slideId);
        });

        this._player.ui.navbar.find("#ls-nav-ul").append(this._ui.all);
        this._uiInitialized = true;
    }

    /**
     * Update the navigation buttons and visible slide numbers as soon as the
     * current slide number or amount of slides changes.
     */
    _updateNavigationButtons() {
        if (!this._uiInitialized) return;

        // Update number and amount
        let slideNumber = this._player.slideNumber.value;
        let slideAmount = this._player.presentation.amountVisible.value;

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
    _updateOverviewMode(enabled) {
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
    _updatePresentationMode() {
        let presentationMode = this._player.presentationMode.value;

        if (presentationMode) {
            this._ui.presentationMode.classList.add("active");
        } else  {
            this._ui.presentationMode.classList.remove("active");
        }
    }
}

export default NavigationButtons;
