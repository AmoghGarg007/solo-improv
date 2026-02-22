const groups = {};

const CHAT_ACTIVE_DURATION = 5 * 24 * 60 * 60 * 1000;
const CHAT_DELETE_DELAY    = 2 * 24 * 60 * 60 * 1000;

const adjectives = [
  "Cosmic", "Chaotic", "Legendary", "Sneaky", "Turbo",
  "Spicy", "Cursed", "Sleepy", "Hyper", "Feral",
  "Glitchy", "Sus", "Unhinged", "Crispy", "Vibing",
  "Caffeinated", "Mysterious", "Absurd"
];

const nouns = [
  "Penguins", "Potatoes", "Ninjas", "Raccoons", "Gremlins",
  "Noodles", "Wizards", "Goblins", "Pandas", "Tacos",
  "Ducks", "Gnomes", "Bots", "Monkeys", "Hamsters",
  "Pirates", "Sloths", "Flamingos", "Otters", "Waffles"
];

const randomGCName = () => {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj} ${noun}`;
};


/* ===============================
   TIMER HELPERS
================================ */

const resetGroupTimer = (io, groupId) => {

  const group = groups[groupId];
  if (!group) return;

  if (group.expiryTimer) clearTimeout(group.expiryTimer);
  if (group.deleteTimer) clearTimeout(group.deleteTimer);

  const expiresAt = Date.now() + CHAT_ACTIVE_DURATION;
  group.expiresAt = expiresAt;

  io.to(groupId).emit("timerReset", { expiresAt });

  group.expiryTimer = setTimeout(() => {

    if (!groups[groupId]) return;

    groups[groupId].locked = true;
    io.to(groupId).emit("chatExpired");

    console.log(`Group ${groupId} chat locked`);

    group.deleteTimer = setTimeout(() => {
      delete groups[groupId];
      console.log(`Group ${groupId} deleted`);
    }, CHAT_DELETE_DELAY);

  }, CHAT_ACTIVE_DURATION);

};


/* ===============================
   SOCKET EXPORT
================================ */

module.exports = (io) => {

  io.on("connection", (socket) => {

    console.log("User connected:", socket.id);

    /* ===============================
       MATCH BY INTERESTS
    =============================== */

    socket.on("joinMatch", (interests) => {

      let targetGroup    = null;
      let bestScore      = 0;
      let sharedInterest = null;

      for (const id in groups) {

        if (groups[id].members.length >= 5) continue;
        if (groups[id].locked) continue;

        const allGroupInterests = [
          ...new Set(Object.values(groups[id].memberInterests).flat())
        ];

        const common = interests.filter(i => allGroupInterests.includes(i));

        if (common.length > 0 && common.length > bestScore) {
          bestScore      = common.length;
          targetGroup    = id;
          sharedInterest = common[0];
        }
      }

      if (!targetGroup) {

        const groupId = `group_${Date.now()}`;

        groups[groupId] = {
          members:         [],
          memberInterests: {},
          displayName:     randomGCName(),
          links:           [],
          locked:          false,
          expiresAt:       null,
          expiryTimer:     null,
          deleteTimer:     null
        };

        targetGroup = groupId;
      }

      if (groups[targetGroup].members.length >= 5) {
        socket.emit("groupFull");
        return;
      }

      if (!groups[targetGroup].members.includes(socket.id)) {
        groups[targetGroup].members.push(socket.id);
        groups[targetGroup].memberInterests[socket.id] = interests;
      }

      if (sharedInterest && !groups[targetGroup].links.includes(sharedInterest)) {
        groups[targetGroup].links.push(sharedInterest);
      }

      socket.join(targetGroup);

      const { displayName, links, expiresAt } = groups[targetGroup];

      socket.emit("matchedGroup", {
        roomId: targetGroup,
        displayName,
        links,
        expiresAt
      });

      console.log(
        "Matched:", socket.id, "->", targetGroup,
        `(${displayName}) | chain: ${links.join(" → ") || "first member"}`
      );

      console.log("Members:", groups[targetGroup].members.length);

    });


    /* ===============================
       CHAT
    =============================== */

    socket.on("joinGroup", ({ requestedGroup, username }) => {

      socket.join(requestedGroup);

      console.log(`${username} joined group: ${requestedGroup}`);

      if (groups[requestedGroup]) {
        resetGroupTimer(io, requestedGroup);
        // Emit directly to joiner too in case they missed the room broadcast
        socket.emit("timerReset", { expiresAt: groups[requestedGroup].expiresAt });
      }

      const expiresAt = groups[requestedGroup]?.expiresAt || null;

      socket.emit("joinedGroup", { groupId: requestedGroup, expiresAt });

    });


    socket.on("sendMessage", (data) => {

      const group = groups[data.groupId];

      if (!group || group.locked) {
        socket.emit("chatExpired");
        return;
      }

      socket.to(data.groupId).emit("receiveMessage", data);

    });


    /* ===============================
       CHECK GROUP
    =============================== */

    socket.on("checkGroup", (groupId, callback) => {
      callback(!!groups[groupId]);
    });


    /* ===============================
       DISCONNECT
    =============================== */

    socket.on("disconnect", () => {

      console.log("User disconnected:", socket.id);

      for (const id in groups) {

        groups[id].members = groups[id].members.filter(m => m !== socket.id);
        delete groups[id].memberInterests[socket.id];

        if (groups[id].members.length === 0) {
          if (groups[id].expiryTimer) clearTimeout(groups[id].expiryTimer);
          if (groups[id].deleteTimer) clearTimeout(groups[id].deleteTimer);
          delete groups[id];
          console.log("Deleted empty group:", id);
        }
      }

    });

  });

};