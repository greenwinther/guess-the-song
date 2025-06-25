import { storeOrder } from "@/lib/game";
export const submitAllOrdersHandler = (io, socket) => {
    socket.on("submitAllOrders", async (data, callback) => {
        try {
            for (const [sid, order] of Object.entries(data.guesses)) {
                storeOrder(data.code, parseInt(sid, 10), data.playerName, order);
            }
            // === ADD THIS: broadcast that this player has submitted ===
            io.to(data.code).emit("playerSubmitted", { playerName: data.playerName });
            callback(true);
        }
        catch (err) {
            console.error("submitAllOrders error", err);
            callback(false);
        }
    });
};
