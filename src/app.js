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

// Bootstrap
import "bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';

// Own assets
import "./app.less";

import Slides from "./slides.js";
import ProgressBar from "./progressbar.js";
import NavigationButtons from "./navigation_buttons.js";
import SlideshowMode from "./slideshow_mode.js";
import OverviewMode from "./overview_mode.js";

window.Slides = Slides;

export default {
    // Don't add "Slides" here! This list is used in the Slide class.
    ProgressBar,
    NavigationButtons,
    SlideshowMode,
    OverviewMode,
};
