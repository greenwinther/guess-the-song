"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detailQuestionHandler = void 0;
const validation_1 = require("../validation");
const roomStore_1 = require("../../server/store/roomStore");
const publicRoom_1 = require("../state/publicRoom");
const detailQuestionHandler = (io, socket) => {
    socket.on("DETAIL_QUESTION", (data) => {
        const code = (0, validation_1.parseRoomCode)(data.code);
        if (!code)
            return;
        const question = (0, validation_1.parseOptionalText)(data.question);
        (0, roomStore_1.setDetailQuestion)(code, question);
        const room = (0, roomStore_1.getRoom)(code);
        if (!room)
            return;
        io.to(code).emit("roomData", (0, publicRoom_1.toPublicRoom)(room));
    });
};
exports.detailQuestionHandler = detailQuestionHandler;
