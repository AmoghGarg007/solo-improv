import { useState, useEffect } from "react";
import socket from "./socket";

function Chat() {
  const [sender, setSender] = useState("");
  const [receiver, setReceiver] = useState("");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [joined, setJoined] = useState(false);

  // listen for incoming messages once
  useEffect(() => {
    socket.on("receiveMessage", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, []);

  const getRoomId = () => {
    return [sender, receiver].sort().join("_");
  };

  const joinRoom = () => {
    if (!sender || !receiver) return;

    const roomId = getRoomId();

    socket.emit("joinGroup", roomId);
    setJoined(true);
  };

  const sendMessage = () => {
    if (!text || !joined) return;

    const messageData = {
      groupId: getRoomId(),
      sender,
      receiver,
      text,
    };

    socket.emit("sendMessage", messageData);

    // instant local update
    setMessages((prev) => [...prev, messageData]);

    setText("");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Chat</h2>

      <input
        placeholder="Your Name"
        value={sender}
        onChange={(e) => setSender(e.target.value)}
      />

      <input
        placeholder="Receiver Name"
        value={receiver}
        onChange={(e) => setReceiver(e.target.value)}
      />

      <button onClick={joinRoom}>Join Chat</button>

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
    </div>
  );
}

export default Chat;