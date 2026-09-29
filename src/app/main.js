import * as UI from "./ui.js";
import * as CONTROLS from "./controls.js";
import * as MAP from "./map.js";
import * as SCENE from "./scene.js";

UI.init();
MAP.init();
CONTROLS.init(await SCENE.init());
