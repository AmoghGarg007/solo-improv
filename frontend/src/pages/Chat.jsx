import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

function Chat() {
  const location = useLocation();
  const navigate = useNavigate();
  const group = location.state?.group;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  // If user directly opens /chat without joining
  if (!group) {
    return (
      <div className="page-root">
        <h2>No Group Found</h2>
        <p>Please join a group first.</p>
        <button onClick={() => navigate("/findgroup")}>
          Go to Find Group
        </button>
      </div>
    );
  }

  const sendMessage = () => {
    if (!input.trim()) return;

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text: input }
    ]);

    setInput("");
  };

  return (
    <div className="page-root">
      <section className="section chat-section">

        <h2>Group Chat</h2>

        <div style={{ marginBottom: "20px" }}>
          <p><strong>Group ID:</strong> {group.id}</p>
          <p><strong>Interest:</strong> {group.interest}</p>
          <p><strong>Members:</strong> {group.members.length} / 5</p>
        </div>

        <div
          style={{
            minHeight: "200px",
            border: "1px solid #2a2a2a",
            padding: "10px",
            marginBottom: "10px",
            borderRadius: "8px"
          }}
        >
          {messages.length === 0 && <p>No messages yet.</p>}

          {messages.map((msg) => (
            <div key={msg.id}>
              <p>{msg.text}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ flex: 1 }}
          />
          <button onClick={sendMessage}>
            Send
          </button>
        </div>

      </section>
    </div>
  );
}

export default Chat;