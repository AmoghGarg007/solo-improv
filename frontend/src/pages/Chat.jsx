import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import socket from "../socket";

function Chat() {
  const location = useLocation();
  const navigate = useNavigate();

  const storedGroup = localStorage.getItem("active_group");
  const autoGroupId = location.state?.groupId || storedGroup || "";

  const [username, setUsername] = useState(
    localStorage.getItem("demo_username") || ""
  );

  const [groupId] = useState(autoGroupId);
  const [joined, setJoined] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);

  const groupTitle = groupId
    ? groupId.split("_").join(" + ")
    : "Group Chat";

  /* ===============================
     AUTO JOIN IF NAME EXISTS
  =============================== */
  useEffect(() => {
    if (!groupId) return;

    if (username) {
      socket.emit("joinGroup", groupId);
      setJoined(true);
    }
  }, [groupId, username]);

  /* ===============================
     RECEIVE MESSAGES
  =============================== */
  useEffect(() => {
    if (!groupId) return;

    socket.on("receiveMessage", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [groupId]);

  const handleNameSubmit = () => {
    if (!username || !groupId) return;

    localStorage.setItem("demo_username", username);
    localStorage.setItem("active_group", groupId);

    socket.emit("joinGroup", groupId);
    setJoined(true);
  };

  const sendMessage = () => {
    if (!text.trim() || !joined) return;

    socket.emit("sendMessage", {
      groupId,
      sender: username,
      text,
    });

    setText("");
  };

  /* ===============================
     NO GROUP CASE
  =============================== */
  if (!groupId) {
    return (
      <div className="chat-page">
        <div className="chat-box glass">
          <h2>No Active Group</h2>
          <p>Please go to Find Group first.</p>
          <button onClick={() => navigate("/findgroup")}>
            Go to Find Group
          </button>
        </div>
      </div>
    );
  }

  /* ===============================
     MAIN CHAT UI
  =============================== */
  return (
    <div className="chat-page">

      <div className="chat-box glass">

        <h2>{groupTitle}</h2>

        {!joined ? (
          <div className="chat-join">
            <input
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleNameSubmit();
              }}
            />
            <button onClick={handleNameSubmit}>
              Enter Chat
            </button>
          </div>
        ) : (
          <>
            <div className="chat-messages">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`chat-message ${
                    msg.sender === username ? "self" : "other"
                  }`}
                >
                  <strong>{msg.sender}:</strong> {msg.text}
                </div>
              ))}
            </div>

            <div className="chat-input-row">
              <input
                placeholder="Type a message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
              />
              <button onClick={sendMessage}>
                Send
              </button>
            </div>
          </>
        )}

      </div>

    </div>
  );
}

export default Chat;