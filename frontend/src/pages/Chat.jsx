import { useState, useEffect } from "react";
import socket from "./socket";

function Chat() {
  const [username, setUsername] = useState("");
  const [groupId, setGroupId] = useState("");
  const [joined, setJoined] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected:", socket.id);
    });

    socket.on("receiveMessage", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, []);

  const joinGroup = () => {
    if (!username || !groupId) return;

    socket.emit("joinGroup", groupId);
    setJoined(true);
  };

  const sendMessage = () => {
    if (!text || !joined) return;

    const messageData = {
      groupId,
      sender: username,
      text,
    };

    socket.emit("sendMessage", messageData);

    setText("");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Group Chat</h2>

      {!joined ? (
        <>
          <input
            placeholder="Your Name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            placeholder="Group ID"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
          />
          <button onClick={joinGroup}>Join Group</button>
        </>
      ) : (
        <>
          <div style={{ marginTop: "20px" }}>
            {messages.map((msg, index) => (
              <div key={index}>
                <strong>{msg.sender}:</strong> {msg.text}
              </div>
            ))}
          </div>

          <input
            placeholder="Message"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button onClick={sendMessage}>Send</button>
        </>
      )}
    </div>
  );
}

export default Chat;