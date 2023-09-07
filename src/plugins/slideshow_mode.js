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

import $ from "jquery/src/jquery.js";

/**
 * This is the main UI mode which runs the presentation.
 */
class SlideshowMode {
    /**
     * Constructor
     * @param {SlideshowPlayer} player Main slides player object
     */
    constructor(player) {
        this._player = player;
        this._uiInitialized = false;
        this._enabled = false;

        if (player.registerUiMode("slideshow")) {
            player.init.bindFunction(() => this._initUi());
        }
    }

    /**
     * Create the basic UI layout.
     */
    _initUi() {
        if (this._uiInitialized) return;
        this._uiInitialized = true;

        this._player.uiMode.bindFunction((newValue) => newValue === "slideshow" ? this._enable() : this._disable());
        this._player.slideNumber.bindFunction(() => this._update());
        this._player.presentationMode.bindFunction(() => this._update());

        let ui = $($.parseHTML(`
            <div
                id="ls-slideshow"
                style="
                    flex-grow: 1;
                    flex-shrink: 1;

                    display: flex;
                    flex-direction: column;
                    align-content: stretch;

                    position: relative;"
            >
            </div>
        `));

        this._ui = ui.filter("div")[0]
    }

    /**
     * Enable slideshow display.
     */
    _enable() {
        this._enabled = true;
        this._renderSlide(true);

        // Raise ls-slide-changed event to trigger custom scripts which update the
        // slide content, in case the slide has been visible on the table of contents
        // and the user directly switched to the presentation from there.
        window.dispatchEvent(new CustomEvent("ls-slide-changed", {
            detail: {
                previousSlide: this._player.slideNumber.value,
                currentSlide: this._player.slideNumber.value
            }
        }));
    }

    /**
     * Disable slideshow display.
     */
    _disable() {
        this._enabled = false;
    }

    /**
     * Update slideshow display if it is enabled.
     */
    _update() {
        if (!this._enabled) return;
        this._renderSlide(false);
    }

    /**
     * Render and display the current slide.
     * @param {Boolean} fade: Cross-fade to the new page (default: false)
     */
    _renderSlide(fade) {
        fade = fade || false;

        let slide = this._player.presentation.getSlideByNumber(this._player.slideNumber.value);
        if (!slide) return;

        let rendered = slide.renderSlide(this._player.presentationMode.value);

        this._ui.innerHTML = "";
        $(this._ui).append(rendered);

        this._player.page.value = {
            element: this._ui,
            title: slide.titleText,
            slideId: this._player.slideNumber,
            fade: fade,
        };
    }
}

export default SlideshowMode;
