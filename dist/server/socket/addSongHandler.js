import { addSong } from "@/lib/rooms";
export const addSongHandler = (io, socket) => {
    socket.on("addSong", async (data, callback) => {
        try {
            const song = await addSong(data.code, {
                url: data.url,
                submitter: data.submitter,
                title: data.title,
            });
            const withTitle = Object.assign(Object.assign({}, song), { title: data.title });
            console.log("🔔 [server] emitting songAdded:", song);
            // Broadcast just the new song
            io.to(data.code).emit("songAdded", withTitle);
            callback({ success: true, song: withTitle });
        }
        catch (err) {
            console.error("🔔 [server] addSong error", err);
            callback({ success: false, error: err.message });
        }
    });
};
