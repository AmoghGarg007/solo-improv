import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useState ,  useEffect } from "react";

function CalendarPage() {

  useEffect(() => {
  document.title = "Events Calendar | Connectify";
}, []);

  const [date, setDate] = useState(new Date());

  return (
    <div className="page-root">

      <section className="section calendar-section">

        <h2 className="section-title">Events Calendar</h2>

        <div className="calendar-wrapper glass">
          <Calendar onChange={setDate} value={date} />
        </div>

      </section>

    </div>
  );
}

export default CalendarPage;