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
     * Create the basic UI layout.
     */
    _initUi() {
        if (this._uiInitialized) return;
        this._uiInitialized = true;

        this._player.uiMode.bindFunction((newValue) => newValue === "overview" ? this._show() : false);
        this._player.presentation.amountVisible.bindFunction(newValue => this._renderOverview(newValue));
        this._player.slideNumber.bindFunction(newValue => this._highlightActiveSlide(newValue));

        let ui = $($.parseHTML(`
            <!-- Main container -->
            <div
                style="
                    flex-grow: 1;
                    flex-shrink: 1;

                    display: flex;
                    flex-direction: column;
                    align-content: stretch;

                    position: relative;"
            >
                <div
                    class="container-fluid p-3"
                    style="flex-grow: 1; flex-shrink: 1;"
                >
                    <div class="row">
                        <div id="ls-overview-header" class="col">
                            <!-- Front matter -->
                        </div>
                    </div>
                    <div class="row">
                        <div id="ls-overview-toc" class="col">
                            <!-- ToC list -->
                        </div>
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
     * Render and display the slide overview on the left.
     * @param {Integer} amountVisible Amount of visible slides
     */
    _renderOverview(amountVisible) {
        // Front matter
        if (!this._ui) return

        $(this._ui).find("#ls-overview-header > *").detach()
        $(this._ui).find("#ls-overview-header").html(this._player.presentation.headerHtml.value);

        // List of slides on the left
        $(this._ui).find("#ls-overview-toc > *").detach();
        $(this._ui).find("#ls-overview-preview > *").detach();

        let tocElement = this._player.presentation.renderTableOfContents();
        $(this._ui).find("#ls-overview-toc").append(tocElement);
    }

    /**
     * Highlight current slide on the ToC list.
     * @param  {Integer} slideNumber Current slide number
     */
    _highlightActiveSlide(slideNumber) {
        if (!this._ui) return;

        $(this._ui).find("#ls-overview-toc a").removeClass("active");
        $(this._ui).find(`#ls-overview-toc div[data-slide="${slideNumber}"] > a`).addClass("active");
    }
}

export default OverviewMode;
