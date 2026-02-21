import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

function FindGroup() {

  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    document.title = "Find Group | Connectify";
  }, []);

  const interests = [
    "AI / ML",
    "Web Dev",
    "Cybersecurity",
    "Gaming",
    "Design",
    "Music",
    "Entrepreneurship",
    "Fitness",
  ];

  const toggleInterest = (item) => {
    setSelected((prev) =>
      prev.includes(item)
        ? prev.filter((i) => i !== item)
        : [...prev, item]
    );
  };

const matchUser = async () => {
  try {
    const res = await fetch("http://localhost:5000/api/groups/join", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        interests: selected,
      }),
    });

    const data = await res.json();

    // Optional: show message
    setMessage(`Joined group for ${data.interest}`);

    // Navigate to chat and send group data
    navigate("/chat", { state: { group: data } });

  } catch (err) {
    console.error(err);
  }
};

  return (
    <div className="page-root">
      <section className="section findgroup-section">
        <h2 className="section-title">Find Your Group</h2>

        <div className="interest-grid">
          {interests.map((item) => (
            <div
              key={item}
              className={`interest-card glass ${
                selected.includes(item) ? "selected" : ""
              }`}
              onClick={() => toggleInterest(item)}
            >
              {item}
            </div>
          ))}
        </div>

        <div className="match-btn-wrapper">
          <button
            disabled={selected.length === 0}
            onClick={matchUser}
          >
            Match Me
          </button>
        </div>

        {message && <p>{message}</p>}
      </section>
    </div>
  );
}

export default FindGroup;