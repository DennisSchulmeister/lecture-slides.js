/*
 * lecture-slides.js (https://www.buzzlms.de)
 * © 2018  Dennis Schulmeister-Zimolong <dennis@pingu-mail.de>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */
"use strict";

/**
 * Plugin for the slides player object which shows all slides on one big
 * page for printing.
 */
class PrintMode {
    /**
     * Constructor
     * @param {SlideshowPlayer} player Main slides player object
     */
    constructor(player) {
        this._player = player;
        this._uiInitialized = false;
        this._enabled = false;
        this._scrollSemaphore = 0;

        if (player.registerUiMode("print")) {
            player.init.bindFunction(() => this._initUi());
        }
    }

    /**
     * Create the basic UI layout.
     */
    _initUi() {
        if (this._uiInitialized) return;
        this._uiInitialized = true;

        this._player.uiMode.bindFunction((newValue) => newValue === "print" ? this._enable() : this._disable());
        this._player.presentation.amountVisible.bindFunction(() => this._update());
        this._player.presentationMode.bindFunction(() => this._update());
        this._player.slideNumber.bindFunction(newValue => this._scrollToSlide(newValue));
        this._player.getScrollElement(true).addEventListener("scroll", event => this._updateSlideNumberOnScroll(event));

        let ui = $($.parseHTML(`
            <div
                id="ls-print"
                style="position: relative;"
            >
                <div id="ls-print-header" class="p-3">
                    <!-- Front Matter -->
                </div>
                <div id="ls-print-toc" class="pl-3 pr-3 pb-3">
                    <!-- ToC list -->
                </div>
                <div id="ls-print-slides">
                    <!-- Slides -->
                </div>
            </div>
        `));

        this._ui = ui.filter("div")[0]
    }

    /**
     * Enable print display.
     */
    _enable() {
        this._enabled = true;
        this._renderSlides(true);
    }

    /**
     * Disable print display.
     */
    _disable() {
        this._enabled = false;
    }

    /**
     * Update print display if it is enabled.
     */
    _update() {
        if (!this._enabled) return;
        this._renderSlides(false);
    }

    /**
     * Render all slides and display them in the UI. If presentation mode
     * is active only the main content of each slide is rendered. Otherwise
     * the side text is rendered below each slide.
     *
     * @param {Boolean} fade: Cross-fade to the new page (default: false)
     */
    _renderSlides(fade) {
        // Front Matter
        if (!this._ui) return

        $(this._ui).find("#ls-print-header > *").detach()
        $(this._ui).find("#ls-print-header").html(this._player.presentation.headerHtml.value);

        // List of slides
        $(this._ui).find("#ls-print-toc > *").detach()

        let tocElement = this._player.presentation.renderTableOfContents();
        $(this._ui).find("#ls-print-toc").append(tocElement);

        // The slides themselves
        $(this._ui).find("#ls-print-slides > *").detach()
        let slidesContainer = $(this._ui).find("#ls-print-slides")[0];

        for (let slideNumber = 1; slideNumber <= this._player.presentation.amountVisible.value; slideNumber++) {
            let slide = this._player.presentation.getSlide(slideNumber);

            let slideContainer = $($.parseHTML(`
                <!-- Slide container -->
                <div
                    class="ls-slide-container p-3"
                    style="position: relative;"
                >
                    <div class="ls-slide-title">
                        <!-- Title -->
                    </div>
                    <div class="ls-slide-content">
                        <!-- Slide content -->
                    </div>
                    <div class="ls-slide-details">
                        <!-- Sidetext -->
                    </div>
                </div>
            `));

            slideContainer.attr("data-slide-number", slideNumber);
            slidesContainer.append(slideContainer.filter("div")[0]);

            // Title
            let titleElement = slide.title.cloneNode(true);
            slideContainer.find(".ls-slide-title").append(titleElement);

            // Slide content
            let contentElement = slide.createContentElement();
            slideContainer.find(".ls-slide-content").append(contentElement);

            // Side text
            if (this._player.presentationMode.value) {
                slideContainer.find(".ls-slide-details").remove();
            } else {
                let detailsElement = slide.createDetailsElement();
                slideContainer.find(".ls-slide-details").replaceWith(detailsElement);
            }

            // Slide background
            let backgroundElement = slide.createBackgroundElement();
            backgroundElement.classList.add("ls-slide-background");
            backgroundElement.style.position = "absolute";
            backgroundElement.style.top = 0;
            backgroundElement.style.left = 0;
            backgroundElement.style.bottom = 0;
            backgroundElement.style.right = 0;
            backgroundElement.style.zIndex = -10;
            slideContainer.append(backgroundElement);
        }

        // Disable all links
        $(this._ui).find("a").on("click", () => { return false });

        // Mess with the Bootstrap carousel to viel all pages at once
        $(slidesContainer).find(".carousel").removeClass("carousel");
        $(slidesContainer).find(".carousel-item").addClass("active");

        // Mess with the Bootstrap nav-tabs to view all pages at once
        $(slidesContainer).find(".tab-pane").addClass("show active");

        // Fix embedded Youtube videos being too large
        $(slidesContainer).find(".embed-responsive").removeClass("embed-responsive");

        // Finally put it on the screen
        this._player.page.value = {
            element: this._ui,
            title: this._player.config.labelPrintView,
            fade: fade,
        };

        // Wait a second because otherwise we might get scroll offset 0
        // for the slide element
        window.setTimeout(() => {
            this._scrollToSlide(this._player.slideNumber.value);
        }, 1000);
    }

    /**
     * Scroll to a given slide when the user asks for it in the UI.
     * @param {Integer} slideNumber Current slide number
     */
    _scrollToSlide(slideNumber) {
        if (!this._enabled) return;
        if (this._scrollSemaphore > 0) return;
        this._scrollSemaphore++;

        let slideElement = $(this._ui).find(`[data-slide-number="${slideNumber}"]`);
        let scrollPosition = slideElement.position().top;
        this._player.getScrollElement().scrollTop = scrollPosition;

        this._scrollSemaphore--;
    }

    /**
     * Update the current slide number as soon as a slide scrolls into the
     * top half of the window.
     *
     * NOTE: This doesn't work right when the slideshow player runs embedded in
     * an HTML element other than <body>. Therefor this method Immediately
     * returns in that case.
     *
     * NOTE: As of Firefox 46 this event listener causes a warning in the
     * developer console. But the alternative API Compositor Worklet is not
     * ready, yet. Although we could achieve an similar with requestAnimationFrame,
     * which seems to be too much of a hassle and performance hit for the
     * simple thing we are doing here (updating a number as soon as an
     * element scrolls into view).
     *
     * @param {ScrollEvent} event The browser's scroll event
     */
    _updateSlideNumberOnScroll(event) {
        if (!this._enabled) return;
        if (this._scrollSemaphore > 0) return;
        if (this._player.config.embedded) return;

        this._scrollSemaphore++;

        let nearesSlideNumber = -Infinity;
        let nearesSlidePosition = -Infinity;

        for (let slideNumber = 1; slideNumber <= this._player.presentation.amountVisible.value; slideNumber++) {
            let slideElement = $(this._ui).find(`[data-slide-number="${slideNumber}"]`)[0];
            let slidePosition = slideElement.getBoundingClientRect();

            if (slidePosition.top < event.view.innerHeight / 2) {
                if (slidePosition.top > nearesSlidePosition) {
                    nearesSlideNumber = slideNumber;
                    nearesSlidePosition = slidePosition.top;
                }
            }
        }

        if (nearesSlideNumber > 0) {
            this._player.slideNumber.value = nearesSlideNumber;
        }

        this._scrollSemaphore--;
    }
}

export default PrintMode;
