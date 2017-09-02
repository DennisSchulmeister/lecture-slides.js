/*
 * lecture-slides.js (https://www.buzzlms.de)
 * © 2017  Dennis Schulmeister-Zimolong <dennis@pingu-mail.de>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */
"use strict";

// Bootstrap
import "bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';

// Own assets
import "./app.less";
import additionalPlugins from "../plugins.js";

import SlideshowPlayer from "./slideshow_player.js";
import ProgressBar from "./plugins/progressbar.js";
import NavigationButtons from "./plugins/navigation_buttons.js";
import SlideshowMode from "./plugins/slideshow_mode.js";
import OverviewMode from "./plugins/overview_mode.js";

window.SlideshowPlayer = SlideshowPlayer;

let plugins = {
    // Don't add "SlideshowPlayer" here! This list is used in the SlideshowPlayer class.
    ProgressBar,
    NavigationButtons,
    SlideshowMode,
    OverviewMode,
};

for (let name in additionalPlugins) {
    plugins[name] = additionalPlugins[name];
}

export default plugins;
