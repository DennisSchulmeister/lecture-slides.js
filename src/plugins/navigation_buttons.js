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

        player.init.bindFunction(() => this._initUi());
    }

    /**
     * Event handler for `slides:ui:init`.
     * Creates the UI widgets for slide navigation.
     */
    _initUi() {
        if (this._uiInitialized) return;
        this._uiInitialized = true;

        this._player.uiMode.bindFunction((newValue) => this._updateModeButtons(newValue));
        this._player.presentationMode.bindFunction(() => this._updatePresentationMode());
        this._player.slideNumber.bindFunction(() => this._updateNavigationButtons());
        this._player.presentation.amountVisible.bindFunction(() => this._updateNavigationButtons());

        this._ui.all = $($.parseHTML(`
            <!-- View -->
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">
                    ${this._player.config.labelViewMenu}
                </a>
                <div class="dropdown-menu">
                    <!-- Overview -->
                    <a id="ls-nav-overview-mode" class="dropdown-item">
                        ${this._player.config.labelOverview}
                    </a>

                    <!-- Slides -->
                    <a id="ls-nav-slideshow-mode" class="dropdown-item">
                        ${this._player.config.labelSlideView}
                    </a>

                    <!-- Print -->
                    <a id="ls-nav-print-mode" class="dropdown-item">
                        ${this._player.config.labelPrintView}
                    </a>

                    <div class="dropdown-divider"></div>

                    <!-- Presentation mode -->
                    <a id="ls-nav-presentation-mode" class="dropdown-item">
                        ${this._player.config.labelPresentationMode}
                    </a>
                </div>
            </li>

            <!-- Slide number / Slide amount -->
            <li id="ls-nav-numbers" class="nav-item navbar-text ml-md-4"></li>

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
        this._ui.slideshowMode = this._ui.all.find("#ls-nav-slideshow-mode")[0];
        this._ui.printMode = this._ui.all.find("#ls-nav-print-mode")[0];
        this._ui.presentationMode = this._ui.all.find("#ls-nav-presentation-mode")[0];
        this._ui.prev = $(this._ui.all.find("#ls-nav-prev")[0]);
        this._ui.gotoForm = $(this._ui.all.find("#ls-nav-goto-form")[0])
        this._ui.gotoId = $(this._ui.all.find("#ls-nav-goto-id")[0])
        this._ui.next = $(this._ui.all.find("#ls-nav-next")[0]);

        /**
         * Switch to overiew UI mode
         */
        $(this._ui.overviewMode).on("click", event => {
            if (this._player.uiMode.value != "overview") {
                this._player.uiMode.value = "overview";
            }

            event.preventDefault();
        });

        /**
         * Switch to slideshow UI mode
         */
        $(this._ui.slideshowMode).on("click", event => {
            if (this._player.uiMode.value != "slideshow") {
                this._player.uiMode.value = "slideshow";
            }

            event.preventDefault();
        });

        /**
         * Switch to print UI mode
         */
        $(this._ui.printMode).on("click", event => {
            if (this._player.uiMode.value != "print") {
                this._player.uiMode.value = "print";
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
     * @param {String} uiMode Currently visible ui mode
     */
    _updateModeButtons(uiMode) {
        let classActive = "active";

        this._ui.overviewMode.classList.remove(classActive);
        this._ui.slideshowMode.classList.remove(classActive);
        this._ui.printMode.classList.remove(classActive);

        switch (uiMode) {
            case "overview":
                this._ui.overviewMode.classList.add(classActive);
                break;
            case "slideshow":
                this._ui.slideshowMode.classList.add(classActive);
                break;
            case "print":
                this._ui.printMode.classList.add(classActive);
                break;
        }
    }

    /**
     * Update state of the presentation mode toggle button.
     */
    _updatePresentationMode() {
        let presentationMode = this._player.presentationMode.value;
        let classActive = "active";

        if (presentationMode) {
            this._ui.presentationMode.classList.add(classActive);
        } else  {
            this._ui.presentationMode.classList.remove(classActive);
        }
    }
}

export default NavigationButtons;
