// // src/server/socket/removeSongHandler.ts
import { removeSong } from "@/lib/rooms";
export const removeSongHandler = (io, socket) => {
    socket.on("removeSong", async (data, callback) => {
        try {
            const deletedId = await removeSong(data.code, data.songId);
            // Broadcast to everyone in-room that this song is gone
            io.to(data.code).emit("songRemoved", { songId: deletedId });
            callback({ success: true });
        }
        catch (err) {
            console.error("removeSong error", err);
            callback({ success: false, error: err.message });
        }
    });
};
