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

import ObservableValue from "@dschulmeis/ls-utils/observable_value.js";
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
     * @param {SlideshowPlayer} player The slideshow player controlling this deck
     * @param {Array} slides Array with Slide objects
     * @param {Object} values Optional values:
     *   * {String} title: Title of the presentation
     *   * {String} headerHtml: Html code with the front matter
     */
    constructor(player, slides, values) {
        this.title         = new ObservableValue(values.title || "");
        this.amountVisible = new ObservableValue(0);
        this.headerHtml    = new ObservableValue(values.headerHtml || "");

        this._player         = player;
        this._slidesAll      = slides || [];
        this._slidesByNumber = {};

        this._updateSlideList();
    }

    /**
     * Take a DOMCollection with a raw slideshow definition and create a
     * Presentation object from it.
     *
     * @param {SlideshowPlayer} player The slideshow player controlling this deck
     * @param {Element} html Raw slideshow definition
     * @return {Slide} New instance
     */
    static async createFromHtml(player, html) {
        // Get general presentation properties
        let jQueryHtml = $(html);

        let values = {
            title:      html.dataset.title || "",
            headerHtml: jQueryHtml.find("header").wrap("<div></div>").parent().html(),
        };

        // Resolve <ls-include src="xxx.html"> references
        for (let lsIncludeElement of jQueryHtml.children("ls-include")) {
            if (!lsIncludeElement.hasAttribute("src")) continue;

            let response = await fetch(lsIncludeElement.getAttribute("src"));
            let responseHtml = await response.text();

            lsIncludeElement.outerHTML = responseHtml;
        }

        // Resolve template references
        let templates = jQueryHtml.find("section[data-define-template]");
        
        for (let templateReference of jQueryHtml.find("section[data-use-template]")) {
            let template = templates.filter(`[data-define-template="${templateReference.dataset.useTemplate}"]`);

            if (!template[0]) {
                console.warn(`Unknown slide template: ${templateReference.dataset.useTemplate}`);
                continue;
            }

            template = template.clone()[0];
            template.removeAttribute("data-define-template");

            let templateHtml = template.innerHTML;
            let variablesReplaced = false;

            for (let attributeName of templateReference.getAttributeNames()) {
                if (!attributeName.startsWith("data-")) continue;
                let attributeValue = templateReference.getAttribute(attributeName);

                templateHtml = templateHtml.replaceAll(`$${attributeName.slice(5)}$`, attributeValue);
                variablesReplaced = true;
            }

            if (variablesReplaced) {
                template.innerHTML = templateHtml;
            }

            templateReference.replaceWith(template);
        }

        // Run scripts nested in the slides
        for (let script of jQueryHtml.find("script")) {
            let mimeType = script.getAttribute("type") || "text/javascript";

            if (mimeType.toLowerCase() === "text/javascript") {
                eval(script.innerHTML);
            }
        }

        // Create slide objects
        let slidesHtml   = jQueryHtml.find("section");
        let slides       = [];
        let slideNumbers = [];

        for (let slideHtml of slidesHtml) {
            if (slideHtml.dataset.defineTemplate) continue;

            if (slideHtml.hasAttribute("data-chapter")) {
                slideHtml.dataset.chapter = slideHtml.dataset.chapter || "h1";
            }

            // Calculate slide number
            let slideNumber = "";

            if (slideHtml.dataset.chapter === "h0") {
                slideNumber = "0";
            } else {
                let level = slideHtml.dataset.chapter || "slide";
                let index = slideNumbers.findIndex(slideNumber_ => slideNumber_.level === level);
    
                if (index >= 0) {
                    slideNumbers.splice(index + 1);
                } else {
                    slideNumbers.push({
                        level:   level,
                        counter: 0,
                    });
                }
    
                slideNumbers[slideNumbers.length - 1].counter += 1;
    
                for (let slideNumber_ of slideNumbers) {
                    if (!slideNumber) slideNumber = `${slideNumber_.counter}`;
                    else slideNumber = `${slideNumber}.${slideNumber_.counter}`;
                }
            }

            // Create Slide
            slides.push(Slide.createFromHtml(slideHtml, slideNumber));
        }

        // Create presentation object
        return new Presentation(player, slides, values);
    }

    /**
     * Find the raw DOM element which contains the definition of a slide.
     * Search by slide number string.
     *
     * @param  {String} slideNumber Number of the slide, e.g. "3.1.2"
     * @return {Slide} Slide definition
     */
    getSlideByNumber(slideNumber) {
        let slide = this._slidesByNumber[slideNumber];

        if (!slide) {
            console.warn("Invalid slide number:", slideNumber);
            return null;
        }

        return slide;
    }

    /**
     * Find the raw DOM element which contains the definition of a slide.
     * Search via the numeric index (page number).
     *
     * @param  {String} slideIndex Numeric slide index, e.g. 2
     * @return {Slide} Slide definition
     */
    getSlideByIndex(slideIndex) {
        let slide = this._slidesAll[slideIndex];

        if (!slide) {
            console.warn("Invalid slide index:", slideIndex);
            return null;
        }

        return slide;
    }

    /**
     * Update the internal list of enabled slides. This goes through the list
     * `this._slides` and fills `this._slidesEnabled` with all slides DOM
     * elements without an `invisible` CSS class.
     */
    _updateSlideList() {
        this._slidesByNumber = {};
        let index = -1;

        for (let slide of this._slidesAll) {
            slide.index = ++index;
            this._slidesByNumber[slide.number] = slide;
        }

        this.amountVisible.value = this._slidesAll.length;
    }

    /**
     * This method renders a list of all slides (the Table of Contents) to
     * a new HTML element which can be used to display the ToC at any place.
     *
     * The returned HTML element will have either one of the following classes
     * to enable different styling for flat ToCs without chapters and nested
     * ToCs with chapters.
     *
     *   * .ls-toc-with-chapters
     *   * .ls-toc-without-chapters
     *
     * The contained ToC entries will either have the following classes to
     * distinguish between the name of a slide or its captions:
     *
     *   * .ls-toc-entry
     *   * .ls-toc-caption
     *
     * Additionally ToC entries will have either one of the following classes
     * to distinguish between top-level and nested entries:
     *
     *   * .ls-toc-entry-slide
     *   * .ls-toc-entry-chapter-h1
     *   * .ls-toc-entry-chapter-h2
     *   * .ls-toc-entry-chapter-h3
     *   * ...
     *
     * The final result will thus be something like this:
     *
     *   <div class="ls-toc-with-chapters">
     *       <div data-slide="1" class="ls-toc-entry ls-toc-entry-chapter ls-toc-entry-chapter-h1">
     *           <a href="#1">Chapter Slide</a>
     *           <div class="ls-toc-caption">
     *               Caption Text
     *           </div>
     *       </div>
     *       <div data-slide="1" class="ls-toc-entry ls-toc-entry-chapter ls-toc-entry-chapter-h2">
     *           <a href="#1">Sub-Chapter Slide</a>
     *           <div class="ls-toc-caption">
     *               Caption Text
     *           </div>
     *       </div>
     *       <div data-slide="2" class="ls-toc-entry ls-toc-entry-slide">
     *           <a href="#1">Normal Slide</a>
     *           <div class="ls-toc-caption">
     *               Caption Text
     *           </div>
     *       </div>
     *       …
     *   </div>
     *
     * And for a simple ToC without chapters and sub-chapters:
     *
     *   <div class="ls-toc-without-chapters">
     *       <div data-slide="1" class="ls-toc-entry ls-toc-entry-slide">
     *           <a href="#1">Slide Name</a>
     *           <div class="ls-toc-caption">
     *               Caption Text
     *           </div>
     *       </div>
     *       …
     *   </div>
     *
     * @return {Element} A new HTML element with the rendered ToC
     */
    renderTableOfContents() {
        let tocElement = $(document.createElement("div"));
        let tocHasChapters = false;

        for (let slideIndex = 0; slideIndex < this.amountVisible.value; slideIndex++) {
            let slide = this.getSlideByIndex(slideIndex);

            let title = slide.titleText;
            if (title === "") title = `${this._player.config.labelSlide} ${slideIndex}`;

            let caption = slide.caption.innerHTML;

            if (caption != "") {
                let captionStyle = "";
                let captionClass = "";

                if (slide.caption.attributes.style != undefined) captionStyle = slide.caption.attributes.style.value;
                if (slide.caption.attributes.class != undefined) captionClass = slide.caption.attributes.class.value;

                caption = `<div class="ls-toc-caption ${captionClass}" style="${captionStyle}">${caption}</div>`;
            }

            let extraClasses = "";

            if (slide.chapter) {
                tocHasChapters = true;
                extraClasses = `ls-toc-entry-chapter ls-toc-entry-chapter-${slide.chapter}`;
            } else {
                extraClasses = "ls-toc-entry-slide";
            }

            tocElement.append(`
                <div data-slide="${slide.number}" class="ls-toc-entry ${extraClasses}">
                    <a href="#${slide.number}">${title}</a>
                    ${caption}
                </div>
            `);
        }

        if (tocHasChapters) {
            tocElement[0].classList.add("ls-toc-with-chapters");
        } else {
            tocElement[0].classList.add("ls-toc-without-chapters");
        }

        return tocElement;
    }
}

export default Presentation;
