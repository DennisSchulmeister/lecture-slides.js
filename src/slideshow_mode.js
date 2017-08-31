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

        slides.registerUiMode("slideshow");
    }
}

export default SlideshowMode;
