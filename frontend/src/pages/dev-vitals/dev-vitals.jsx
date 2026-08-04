import { useVitals } from "../../api/useVitals";

function DevVitals() {
  const { vitals, status } = useVitals(1);

  return (
    <main className="app">
      <section className="panel">
        <p className="label">Patient 1</p>
        <h1>Heart Rate</h1>

        {status === "loading" && <p className="label">연결 중...</p>}

        {status === "error" && (
          <p className="label" style={{ color: "#E0442E" }}>
            서버 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.
          </p>
        )}

        {status === "connected" && vitals == null && <p className="label">수신된 데이터가 없습니다.</p>}

        {status === "connected" && vitals != null && (
          <div className="metric">
            <span>{vitals.heart_rate ?? "--"}</span>
            <small>bpm</small>
          </div>
        )}
      </section>
    </main>
  );
}

export default DevVitals;
