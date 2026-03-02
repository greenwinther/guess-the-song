"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminDashboardHandler = void 0;
const validation_1 = require("../validation");
const guards_1 = require("../logic/guards");
const adminDashboard_1 = require("./adminDashboard");
const adminDashboardHandler = (io, socket) => {
    socket.on("ADMIN_GET_DASHBOARD", (data, cb) => {
        const code = (0, validation_1.parseRoomCode)(data === null || data === void 0 ? void 0 : data.code);
        if (!code)
            return cb({ ok: false, error: "BAD_REQUEST" });
        const room = (0, guards_1.requireRoom)(socket, () => cb({ ok: false, error: "NOT_AUTHORIZED" }));
        if (!room || room.code !== code)
            return cb({ ok: false, error: "NOT_AUTHORIZED" });
        const member = (0, guards_1.requireMember)(socket, room, () => cb({ ok: false, error: "NOT_AUTHORIZED" }));
        if (!member)
            return;
        if (!member.isHost && room.phase !== "RESULTS") {
            cb({ ok: false, error: "NOT_AUTHORIZED" });
            return;
        }
        const dashboard = (0, adminDashboard_1.buildAdminDashboard)(code);
        if (!dashboard)
            return cb({ ok: false, error: "ROOM_NOT_FOUND" });
        cb({ ok: true, dashboard });
    });
};
exports.adminDashboardHandler = adminDashboardHandler;
