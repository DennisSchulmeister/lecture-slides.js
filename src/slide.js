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
 * This class represents a single slide.
 */
class Slide {
    /**
     * Constructor for direct constructor of a new slide. On most cases however
     * it is better to create a new slide courtesy of the `createFromHTML`
     * method.
     *
     * @param {Object} values Optional values:
     *   * {Element} html: raw slide definition
     *   * {String} id: id of the slide
     *   * {String} title: title of the slide
     *   * {Element} content : DOM Node containing the slide content
     *   * {Element} details: DOM Node containing the explanation text
     *   * {Boolean} enabled: Whether the slide is visible
     */
    constructor(values) {
        values = values || {};

        this.html = values.html || document.createElement("section");
        this.id = values.id || "";
        this.title = values.title || "";
        this.content = values.content || document.createElement("div");
        this.details = values.details || document.createElement("div");
        this.enabled = values.enabled || false;
    }

    /**
     * Take a DOMCollection with a raw slide definition and create a
     * Slide object from it.
     *
     * @param {Element} html Raw slide definition
     * @return {Slide} New instance
     */
    static createFromHTML(html) {
        let values = {
            html: html,
            id: html.id,
            enabled: !html.classList.contains("invisible"),
        }

        html = $(html);
        let title = html.find("> h1");
        let content = html.find("> article");
        let details = html.find("> aside");

        if (title.length) values.title = title[0].innerHTML;
        if (content.length) values.content = content[0];
        if (details.length) values.details = details[0];

        return new Slide(values);
    }

    /**
     * This method renders the slide to a new HTML element which can be used
     * to display the slide. Due to the different types of slides (with or
     * without fixed aspect ratios, presentation more on/off, ...) this method
     * is a bit complicated. Callers however get a completely rendered slide
     * which they only need to throw on the screen.
     *
     * @param  {Boolean} presentationMode Hide detail explanations at the side
     * @return {Element} A new HTML element with the rendered slide
     */
    renderSlide(presentationMode) {
        //// TODO: 4:3, 16:9, free-form aspect ratios,
        //// TODO: scaling according to aspect ratio
        //// TODO: Different slide types (data-ratio="4:3")
        //// TODO: Grid background pattern: <section data-background-grid>
        //// TODO: Grid pos/size: <div data-grid="2,3 x 4,4">...</div>

        // Define basic layout structure
        let rendered = $($.parseHTML(`
            <!-- Main container -->
            <div
                class="ls-slide-container ls-no-fade"
                style="
                    flex-grow: 1;
                    flex-shrink: 1;

                    display: flex;
                    flex-direction: column;
                    align-content: stretch;

                    position: relative;"
            >
                <div
                    class="ls-slide-inner container-fluid p-3"
                    style="flex-grow: 1; flex-shrink: 1;"
                >
                    <div class="ls-slide-title row">
                        <!-- Slide title -->
                    </div>
                    <div class="ls-slide-main row">
                        <!-- Details and Slide -->
                    </div>
                </div>

                <!-- Slide background -->
            </div>
        `));

        rendered = $(rendered.filter("div")[0]);

        // Add background layer
        let background = this.createBackgroundElement();
        background.classList.add("ls-slide-background");
        background.style.position = "absolute";
        background.style.top = 0;
        background.style.left = 0;
        background.style.bottom = 0;
        background.style.right = 0;
        background.style.zIndex = -10;
        rendered.append(background);

        // Add title
        let titleContainer = rendered.find(".ls-slide-title");

        titleContainer.append($.parseHTML(
            `<div class="col">
                <h1>${this.title}</h1>
            </div>`
        ));

        // Add content
        let details = this.createDetailsElement();
        let content = this.createContentElement();

        let mainContainer = rendered.find(".ls-slide-main");

        if (presentationMode) {
            // Presentation mode, only slide unless there is no slide.
            // Then it's only the detail text.
            if (content.innerHTML != "") {
                content.classList.add("col-md");
                mainContainer.append(content);
            } else {
                details.classList.add("col-md");
                mainContainer.append(details);
            }
        } else if (details.innerHTML != "" && content.innerHTML != "") {
            // Slide with detailed explanation
            details.classList.add("col-md-4");
            content.classList.add("col-md-8");

            mainContainer.append(details);
            mainContainer.append(content);
        } else if (details.innerHTML != "") {
            // Only details, no slide
            details.classList.add("col-md");
            mainContainer.append(details);
        } else if (content.innerHTML != "") {
            // Only slide, no details
            content.classList.add("col-md");
            mainContainer.append(content);
        }

        // Return finished slide
        return rendered[0];
    }

    /**
     * Create a new, unstyled DOM element with the slide content. This can
     * be used to apply further CSS styles and display the slide.
     *
     * @return {Element} DOM element with the slide content
     */
    createContentElement() {
        let element = this.content.cloneNode(true);
        element.classList.add("ls-slide-content");
        return element;
    }

    /**
     * Create a new, unstyled DOM element with the detail content. This can
     * be used to apply further CSS styles and display the additional
     * explanations for a slide.
     *
     * @return {Element} DOM element with the detail content
     */
    createDetailsElement() {
        let element = this.details.cloneNode(true);
        element.classList.add("ls-slide-details");
        return element;
    }

    /**
     * Create a new DOM element with the background content of the slide.
     * This element can be used with a negative z-index in order to display
     * the slide backdrop.
     *
     * The background of a slide can be set via data attributes to the
     * <section> element. The following data attributes are recognized:
     *
     *   * data-background: Value for the CSS background statement
     *   * data-background-color: CSS color declaration
     *   * data-background-image: Image URL
     *
     * @return {Element} DOM element with the background layer
     */
    createBackgroundElement() {
        let element = document.createElement("div");
        element.classList.add("ls-slide-background");

        if (this.html.dataset.background) {
            element.style.background = this.html.dataset["background"];
        } else if (this.html.dataset.backgroundColor) {
            element.style.backgroundColor = this.html.dataset.backgroundColor;
        } else if (this.html.dataset.backgroundImage) {
            element.style.background = `url(${this.html.dataset.backgroundImage}) no-repeat center center fixed`;
            element.style.backgroundSize = "cover";
        }

        return element;
    }
}

export default Slide;
