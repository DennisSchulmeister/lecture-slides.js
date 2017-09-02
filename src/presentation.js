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

import ObservableValue from "./core/observable_value.js";
import Slide from "./slide.js";

/**
 * This class represents a collection of slides. It is used by the slideshow
 * player and sometimes by the player's clients to get information about the
 * presentation and the displayed slides.
 */
class Presentation {
    /**
     * Constructor for direct constructor of a new slide. On most cases however
     * it is better to create a new slide courtesy of the `createFromHTML`
     * method.
     *
     * @param {SlideshowPlayer} player The slideshow player controling this deck
     * @param {Array} slides Array with Slide objects
     * @param {Object} values Optional values:
     *   * {String} title: Title of the presentation
     *   * {String} headerHtml: Html code with the front matter
     */
    constructor(player, slides, values) {
        this.title = new ObservableValue(values.title || "");
        this.amountAll = new ObservableValue(0);
        this.amountVisible = new ObservableValue(0);
        this.headerHtml = new ObservableValue(values.headerHtml || "");

        this._player = player;
        this._slidesAll = slides || [];
        this._slidesEnabled = [];
        this._slidesById = {};

        this._updateSlideList();
    }

    /**
     * Take a DOMCollection with a raw slideshow definition and create a
     * Presentation object from it.
     *
     * @param {SlideshowPlayer} player The slideshow player controling this deck
     * @param {Element} html Raw slideshow definition
     * @return {Slide} New instance
     */
    static createFromHtml(player, html) {
        let jQueryHtml = $(html);

        let values = {
            title: html.dataset.title || "",
            headerHtml: jQueryHtml.find("header").wrap("<div></div>").parent().html(),
        };

        let slidesHtml = jQueryHtml.find("section");
        let slides = [];

        slidesHtml.each(index => {
            let slideHtml = slidesHtml.get(index);
            slides.push(Slide.createFromHtml(slideHtml));
        });

        return new Presentation(player, slides, values);
    }

    /**
     * Find the raw DOM element which contains the definition of a slide.
     * The slideId may either be a string or an integer. If it is a string
     * the slide is searched by its id attribute. Otherwise the slideId is
     * treated as the slide number. The slide number then refers only to
     * enabled slides.
     *
     * @param  {String|Integer} slideId id or number of the slide
     * @return {Slide} Slide definition
     */
    getSlide(slideId) {
        let slide = null;
        let slideNumber = parseInt(slideId);

        if (slideNumber.toString() === "NaN") {
            slide = this._slidesById["" + slideId];
        } else {
            slide = this._slidesEnabled[slideNumber - 1];
        }

        if (!slide) {
            console.log("Invalid slide id:", slideId);
            return null;
        }

        return slide;
    }

    /**
     * Get the slide number for a given slide.
     *
     * @param  {Slide} slide The searched for slide
     * @return {Integer} The slide number or 0 if not found or not enabled.
     */
    getSlideNumber(slide) {
        return this._slidesEnabled.indexOf(slide) + 1;
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
        let currentSlide = this.getSlide(this._player.slideNumber);
        let disabledSlide = this.getSlide(slideId);

        if (!disabledSlide) return;
        disabledSlide.enabled = false;
        this._updateSlideList();

        if (disabledSlide === currentSlide) {
            if (this._player.slideNumber < this.amountAll.value) {
                this._player.slideNumber++;
            } else {
                this._player.slideNumber--;
            }
        }
    }

    /**
     * Reenable a previously disabled slide. See `disableSlide()` for details.
     * @param {String|Integer} slideId id or number of the slide
     */
    enableSlide(slideId) {
        let enabledSlide = this.getSlide(slideId);
        if (!enabledSlide) return;
        enabledSlide.enabled = true;
        this._updateSlideList();
    }

    /**
     * Update the internal list of enabled slides. This goes through the list
     * `this._slides` and fills `this._slidesEnabled` whith all slides DOM
     * elements without an `invisible` CSS class.
     */
    _updateSlideList() {
        this._slidesEnabled = this._slidesAll.filter(slide => slide.enabled);
        this._slidesById = {};

        this._slidesEnabled.forEach(slide => {
            if (slide.id) this._slidesById[slide.id] = slide;
        });

        this.amountAll.value = this._slidesAll.length;
        this.amountVisible.value = this._slidesEnabled.length;
    }
}

export default Presentation;
