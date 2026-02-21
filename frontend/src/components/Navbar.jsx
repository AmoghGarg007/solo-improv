import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

function Navbar() {

  const [showNav, setShowNav] = useState(true);

  useEffect(() => {

    let lastScroll = window.scrollY;

    const handleScroll = () => {
      const currentScroll = window.scrollY;

      if (currentScroll > lastScroll) {
        setShowNav(false); // scrolling down
      } else {
        setShowNav(true); // scrolling up
      }

      lastScroll = currentScroll;
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);

  }, []);

  return (
    <nav className={`navbar ${showNav ? "nav-show" : "nav-hide"}`}>
      <h2 className="logo">Connectify</h2>

      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/find-group">Find Group</Link>
        <Link to="/chat">Chat</Link>
        <Link to="/calendar">Calendar</Link>
        <Link to="/login">Login</Link>
      </div>
    </nav>
  );
}

export default Navbar;