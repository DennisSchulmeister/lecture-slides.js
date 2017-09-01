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
 * Plugin for the slides player object which allows to show a slide overview.
 */
class OverviewMode {
    /**
     * Constructor
     * @param {Slides} slides Main slides player object
     * @param {Object} events jQuery object which triggers slide player events
     */
    constructor(slides, events) {
        this._slides = slides;
        this._events = events;
        this._ui = null;

        slides.registerUiMode("overview");

        events.on("slides:ui:init", () => this._initUi());
        events.on("slides:ui:mode:overview:enable", () => this._show());
        events.on("slides:slideAmount", () => this._renderOverview());
    }

    /**
     * Create the basic UI layout.-
     */
    _initUi() {
        let ui = $($.parseHTML(`
            <div class="p-3">
                <div class="container-fluid">
                    <div id="ls-overview-header" class="row"></div>
                    <div class="row">
                        <div id="ls-overview-toc" class="col-md"></div>
                        <div id="ls-overview-preview" class="col-md"></div>
                    </div>
                </div>
            </div>
        `));

        this._ui = ui.filter("div")[0]
        this._renderOverview();
    }

    /**
     * Show UI in the main area.
     */
    _show() {
        this._slides.uiMainContent = this._ui;
    }

    /**
     * Render and display the slide overview.
     */
    _renderOverview() {
        if (!this._ui) return;
        $(this._ui).find("#ls-overview-header > *").detach()
        $(this._ui).find("#ls-overview-header").append(this._slides.header);
    }


}

export default OverviewMode;
