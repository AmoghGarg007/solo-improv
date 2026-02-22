import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import socket from "../socket";

function Chat() {

  const location = useLocation();
  const navigate = useNavigate();

  const storedGroup       = localStorage.getItem("active_group");
  const storedDisplayName = localStorage.getItem("active_group_display_name");
  const storedLinks       = JSON.parse(localStorage.getItem("active_group_links") || "[]");
  const storedExpiresAt   = localStorage.getItem("active_group_expires_at");

  const autoGroupId =
    location.state?.groupId?.roomId ||
    location.state?.groupId ||
    storedGroup || "";

  const autoDisplayName =
    location.state?.groupId?.displayName ||
    storedDisplayName || "";

  const autoLinks =
    location.state?.groupId?.links ||
    storedLinks || [];

  const autoExpiresAt =
    location.state?.groupId?.expiresAt ||
    (storedExpiresAt ? parseInt(storedExpiresAt) : null);

  const [username, setUsername]       = useState(localStorage.getItem("demo_username") || "");
  const [groupId, setGroupId]         = useState(autoGroupId);
  const [displayName, setDisplayName] = useState(autoDisplayName);
  const [links, setLinks]             = useState(autoLinks);
  const [joined, setJoined]           = useState(false);
  const [text, setText]               = useState("");
  const [messages, setMessages]       = useState([]);
  const [expiresAt, setExpiresAt]     = useState(autoExpiresAt);
  const [timeLeft, setTimeLeft]       = useState(null);
  const [expired, setExpired]         = useState(false);
  const [resetKey, setResetKey]       = useState(0);

  const messagesContainerRef = useRef(null);
  const timerRef             = useRef(null);

  const groupTitle = displayName || groupId || "Group Chat";

  /* =========================
     COUNTDOWN TICK
  ========================== */

  useEffect(() => {

    if (!expiresAt) return;

    clearInterval(timerRef.current);

    const tick = () => {
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) {
        setTimeLeft(0);
        setExpired(true);
        clearInterval(timerRef.current);
      } else {
        setTimeLeft(remaining);
      }
    };

    tick();
    timerRef.current = setInterval(tick, 1000);

    return () => clearInterval(timerRef.current);

  }, [expiresAt, resetKey]);

  /* =========================
     FORMAT TIME
  ========================== */

  const formatTime = (ms) => {
    if (ms === null || ms === undefined) return "--:--";
    const totalSeconds = Math.floor(ms / 1000);
    const days    = Math.floor(totalSeconds / 86400);
    const hours   = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0)  return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  /* =========================
     AUTO SCROLL
  ========================== */

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  /* =========================
     CHECK GROUP EXISTS
  ========================== */

  useEffect(() => {
    if (!autoGroupId) return;
    socket.emit("checkGroup", autoGroupId, (exists) => {
      if (!exists) {
        localStorage.removeItem("active_group");
        localStorage.removeItem("active_group_display_name");
        localStorage.removeItem("active_group_links");
        localStorage.removeItem("active_group_expires_at");
        navigate("/find-group");
      }
    });
  }, []);

  /* =========================
     SOCKET LISTENERS
  ========================== */

  useEffect(() => {

    const handleReceiveMessage = (message) => {
      setMessages(prev => [...prev, message]);
    };

    const handleJoinedGroup = (payload) => {
      const gId = typeof payload === "string" ? payload : payload.groupId;
      const exp  = typeof payload === "string" ? null   : payload.expiresAt;

      setGroupId(gId);
      setJoined(true);
      localStorage.setItem("active_group", gId);

      if (exp) {
        setExpiresAt(exp);
        setResetKey(k => k + 1);
        localStorage.setItem("active_group_expires_at", String(exp));
      } else {
        const stored = localStorage.getItem("active_group_expires_at");
        if (stored) {
          setExpiresAt(parseInt(stored));
          setResetKey(k => k + 1);
        }
      }
    };

    const handleMatchedGroup = ({ roomId, displayName, links, expiresAt: exp }) => {
      setGroupId(roomId);
      setDisplayName(displayName);
      setLinks(links || []);
      if (exp) {
        setExpiresAt(exp);
        setResetKey(k => k + 1);
        localStorage.setItem("active_group_expires_at", String(exp));
      }
      localStorage.setItem("active_group", roomId);
      localStorage.setItem("active_group_display_name", displayName);
      localStorage.setItem("active_group_links", JSON.stringify(links || []));
    };

    const handleTimerReset = ({ expiresAt: exp }) => {
      clearInterval(timerRef.current);
      setTimeLeft(null);
      setExpired(false);
      setExpiresAt(exp);
      setResetKey(k => k + 1);
      localStorage.setItem("active_group_expires_at", String(exp));
    };

    const handleChatExpired = () => {
      setExpired(true);
      setTimeLeft(0);
      clearInterval(timerRef.current);
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("joinedGroup",    handleJoinedGroup);
    socket.on("matchedGroup",   handleMatchedGroup);
    socket.on("timerReset",     handleTimerReset);
    socket.on("chatExpired",    handleChatExpired);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("joinedGroup",    handleJoinedGroup);
      socket.off("matchedGroup",   handleMatchedGroup);
      socket.off("timerReset",     handleTimerReset);
      socket.off("chatExpired",    handleChatExpired);
    };

  }, []);

  /* =========================
     JOIN GROUP
  ========================== */

  const handleNameSubmit = () => {
    if (!username || !groupId) return;
    localStorage.setItem("demo_username", username);
    socket.emit("joinGroup", {
      requestedGroup: groupId,
      username,
      clientId: socket.id
    });
  };

  /* =========================
     SEND MESSAGE
  ========================== */

  const sendMessage = () => {
    if (!text.trim() || !joined || expired) return;
    const msg = { groupId, sender: username, text };
    socket.emit("sendMessage", msg);
    setMessages(prev => [...prev, msg]);
    setText("");
  };

  /* =========================
     NO GROUP STATE
  ========================== */

  if (!groupId) {
    return (
      <div className="chat-page">
        <div className="chat-box glass">
          <h2>No Active Group</h2>
          <button onClick={() => navigate("/find-group")}>
            Go to Find Group
          </button>
        </div>
      </div>
    );
  }

  /* =========================
     UI
  ========================== */

  return (
    <div className="chat-page">
      <div className="chat-box glass">

        <div className="chat-header">
          <h2>{groupTitle}</h2>
          <div className={`chat-timer ${timeLeft !== null && timeLeft < 3600000 ? "chat-timer-urgent" : ""}`}>
            {expired
              ? "Chat closed"
              : timeLeft !== null
                ? `⏱ ${formatTime(timeLeft)}`
                : "⏱ --:--"
            }
          </div>
        </div>

        {expired && (
          <div className="chat-expired-banner">
            This chat has ended. No new messages can be sent.
          </div>
        )}

        {!joined ? (
          <div className="chat-join-row">
            <input
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => { if (e.key === "Enter") handleNameSubmit(); }}
            />
            <button onClick={handleNameSubmit}>Enter Chat</button>
          </div>
        ) : (
          <>
            <div className="chat-messages" ref={messagesContainerRef}>
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`chat-message ${msg.sender === username ? "self" : "other"}`}
                >
                  <strong>{msg.sender}:</strong> {msg.text}
                </div>
              ))}
            </div>

            <div className="chat-input-row">
              <input
                placeholder={expired ? "Chat has ended" : "Type a message..."}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyPress={(e) => { if (e.key === "Enter") sendMessage(); }}
                disabled={expired}
              />
              <button onClick={sendMessage} disabled={expired}>Send</button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

export default Chat;