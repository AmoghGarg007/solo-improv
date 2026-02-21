import { useState, useEffect } from "react";
import socket from "./socket";

function Chat() {
  const [sender, setSender] = useState("");
  const [receiver, setReceiver] = useState("");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);

  const roomId =
    sender && receiver
      ? [sender, receiver].sort().join("_")
      : "";

  useEffect(() => {
    if (roomId) {
      socket.emit("join_room", roomId);
    }

    socket.on("receive_message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off("receive_message");
    };
  }, [roomId]);

  const sendMessage = () => {
    if (!text || !roomId) return;

    socket.emit("send_message", {
      roomId,
      sender,
      receiver,
      text,
    });

    setText("");
  };

  return (
    <div style={{ padding: "20px" }}>
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