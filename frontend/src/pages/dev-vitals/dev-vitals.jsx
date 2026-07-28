import { useVitals } from "../../api/useVitals";

function DevVitals() {
  const vitals = useVitals("test-001");

  return (
    <main className="app">
      <section className="panel">
        <p className="label">Patient test-001</p>
        <h1>Heart Rate</h1>
        <div className="metric">
          <span>{vitals?.heart_rate ?? "--"}</span>
          <small>bpm</small>
        </div>
      </section>
    </main>
  );
}

export default DevVitals;
