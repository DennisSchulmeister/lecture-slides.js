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
 * Plugin for the slides player object which renders at the top.
 */
class ProgressBar {
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

        events.on("slides:ui:init", this.initUi.bind(this));
        events.on("slides:showSlide", this.updateProgressBar.bind(this));
        events.on("slides:slideAmount", this.updateProgressBar.bind(this));
    }

    /**
     * Event handler for `slides:ui:init`.
     * Creates the UI widget for the progress bar.
     */
    initUi() {
        this._ui.progressbar = $($.parseHTML(`
            <div class="ls-progress">
                <div class="ls-bar" role="progressbar" style="width: 33%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
        `));

        $(this._slides.ui.navbar[0]).before(this._ui.progressbar);
        this._uiInitialized = true;
    }

    /**
     * Set the new progress bar percentage when the slide number or amount
     * of slides has changes.
     */
    updateProgressBar() {
        if (!this._uiInitialized) return;
        let percentage = 0;

        if (this._slides.slideAmount > 0) {
            percentage = this._slides.slideNumber / this._slides.slideAmount * 100;
        }

        this._ui.progressbar.find(".ls-bar")[0].style.width = `${percentage}%`;
    }
}

export default ProgressBar;
