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
 * This is the main UI mode which runs the presentation.
 */
class SlideshowMode {
    /**
     * Constructor
     * @param {Slides} slides Main slides player object
     * @param {Object} events jQuery object which triggers slide player events
     */
    constructor(slides, events) {
        this._slides = slides;
        this._events = events;
        this._enabled = false;

        slides.registerUiMode("slideshow");

        events.on("slides:ui:mode:slideshow:enable", () => this._enable());
        events.on("slides:ui:mode:slideshow:disable", () => this._disable());

        events.on("slides:showSlide", () => this._update());
        events.on("slides:presentationMode", () => this._update());
    }

    /**
     * Enable slideshow display.
     */
    _enable() {
        this._enabled = true;
        this._renderSlide();
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
        this._renderSlide();
    }

    /**
     * Render and display the current slide.
     */
    _renderSlide() {
        let slide = this._slides.getSlide(this._slides.slideNumber);
        if (!slide) return;

        let rendered = slide.renderSlide(this._slides.presentationMode);
        this._slides.uiMainContent = rendered;
    }
}

export default SlideshowMode;
