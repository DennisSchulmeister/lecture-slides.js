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
     * @param {SlideshowPlayer} player Main slides player object
     */
    constructor(player) {
        this._player = player;
        this._ui = null;

        if (player.registerUiMode("overview")) {
            this._uiInitialized = false;
            player.init.bindFunction(() => this._initUi());
        }
    }

    /**
     * Create the basic UI layout.-
     */
    _initUi() {
        if (this._uiInitialized) return;
        this._uiInitialized = true;

        this._player.uiMode.bindFunction((newValue) => newValue === "overview" ? this._show() : false);
        this._player.presentation.amountVisible.bindFunction(newValue => this._renderOverview(newValue));

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
        this._player.page.value = {
            element: this._ui,
            title: this._player.config.labelOverview,
            fade: true,
        };
    }

    /**
     * Render and display the slide overview.
     * @param {Integer} amountVisible Amount of visible slides
     */
    _renderOverview(amountVisible) {
        if (!this._ui) return;
        $(this._ui).find("#ls-overview-header > *").detach()
        $(this._ui).find("#ls-overview-header").html(this._player.presentation.headerHtml.value);

        // TODO: List of slides
        // TODO: Slide previews
        // TODO: Keyboard navigation
    }
}

export default OverviewMode;
