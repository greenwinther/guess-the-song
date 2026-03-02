"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setStateSaveHandler = setStateSaveHandler;
exports.notifyStateChange = notifyStateChange;
let saveHandler = null;
function setStateSaveHandler(handler) {
    saveHandler = handler;
}
function notifyStateChange() {
    saveHandler === null || saveHandler === void 0 ? void 0 : saveHandler();
}
