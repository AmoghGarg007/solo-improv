module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // 🔥 AUTO MATCHING
    socket.on("joinMatch", (interests) => {

      // sort so order doesn't matter
      const roomId = interests.sort().join("_");

      socket.join(roomId);

      console.log(socket.id, "matched into:", roomId);

      // send roomId back to frontend
      socket.emit("matchedGroup", roomId);
    });

    socket.on("sendMessage", (data) => {
      io.to(data.groupId).emit("receiveMessage", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};