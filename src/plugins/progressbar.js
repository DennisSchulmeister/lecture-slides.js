/*
 * lecture-slides.js (https://www.wpvs.de)
 * © 2017  Dennis Schulmeister-Zimolong <dennis@pingu-mail.de>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */
"use strict";

import { $ } from "jquery/src/jquery.js";

/**
 * Plugin for the slides player object which renders at the top.
 */
class ProgressBar {
    /**
     * Constructor
     * @param {SlideshowPlayer} player Main slides player object
     */
    constructor(player, events) {
        this._player = player;
        this._ui = {};
        this._uiInitialized = false;

        this._uiInitialized = false;
        player.init.bindFunction(() => this._initUi());
    }

    /**
     * Event handler for `slides:ui:init`.
     * Creates the UI widget for the progress bar.
     */
    _initUi() {
        if (this._uiInitialized) return;
        this._uiInitialized = true;

        this._player.currentSlide.bindFunction(() => this._updateProgressBar());
        this._player.presentation.amountVisible.bindFunction(() => this._updateProgressBar());

        let progressClass = "fixed-top";

        if (this._player.config.embedded) {
            progressClass = "sticky-top";
        }

        this._ui.progressbar = $($.parseHTML(`
            <div class="ls-progress ${progressClass}">
                <div class="ls-bar" role="progressbar" style="width: 33%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
        `));

        $(this._player.ui.navbar).find("#ls-navbar").before(this._ui.progressbar);
        $(this._player.ui.navbar).find("#ls-navbar").css("margin-top", "2px");  // See @progressBarHeight in style.less
    }

    /**
     * Set the new progress bar percentage when the slide number or amount
     * of slides has changes.
     */
    _updateProgressBar() {
        if (!this._uiInitialized) return;
        let percentage = 0;

        if (this._player.presentation.amountVisible.value > 0) {
            let slideIndex = this._player.currentSlide.value?.index || 0;
            percentage = (slideIndex + 1) / this._player.presentation.amountVisible.value * 100;
        }

        this._ui.progressbar.find(".ls-bar")[0].style.width = `${percentage}%`;
    }
}

export default ProgressBar;
