import { useState } from "react";
import Icon, { ICON_NAMES } from "../../components/icon/icon.jsx";
import StatusBadge from "../../components/status-badge/status-badge.jsx";
import PresenceBadge from "../../components/presence-badge/presence-badge.jsx";
import SpecialNoteTag from "../../components/special-note-tag/special-note-tag.jsx";
import PatientCard from "../../components/patient-card/patient-card.jsx";
import Header from "../../components/header/header.jsx";
import AdminHeader from "../../components/admin-header/admin-header.jsx";
import Sidebar from "../../components/sidebar/sidebar.jsx";
import AdminSidebar from "../../components/admin-sidebar/admin-sidebar.jsx";
import HospitalSearchModal from "../../components/modals/search-modal/search-modal.jsx";
import PatientRegisterModal from "../../components/modals/patient-register-modal/patient-register-modal.jsx";

const SEVERITIES = ["normal", "caution", "warning", "emergency", "offline", "system"];

function Section({ title, desc, children }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-[#DCE3EC] bg-white p-6 shadow-[0_2px_3px_rgba(30,42,58,0.08)]">
      <div className="flex flex-col gap-[2px]">
        <h2 className="text-base font-bold text-[#1E2A3A]">{title}</h2>
        {desc && <p className="text-xs text-[#5A6B80]">{desc}</p>}
      </div>
      {children}
    </section>
  );
}

function DevComponentLibrary() {
  const [openModal, setOpenModal] = useState(null);

  return (
    <div className="dev-component-library flex min-h-screen flex-col gap-6 bg-[#F5F7FA] p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[#1E2A3A]">공통 모듈 (컴포넌트 라이브러리)</h1>
        <p className="text-sm text-[#5A6B80]">
          src/components 아래 재사용 컴포넌트를 한 화면에서 확인·관리합니다. 이 페이지는 실제 서비스 화면이 아니라 개발용 참고 페이지입니다.
        </p>
      </div>

      <Section title="Icon" desc={`src/components/icon — 아이콘 이름으로 호출 (${ICON_NAMES.length}개)`}>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {ICON_NAMES.map((name) => (
            <div
              key={name}
              className="flex flex-col items-center gap-2 rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] p-3"
            >
              <Icon name={name} size={20} className="text-[#1E2A3A]" />
              <span className="truncate text-center text-[10px] text-[#5A6B80]">{name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="StatusBadge" desc="src/components/status-badge — severity별 상태 배지">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            {SEVERITIES.map((severity) => (
              <StatusBadge key={severity} severity={severity} />
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {SEVERITIES.map((severity) => (
              <StatusBadge key={severity} severity={severity} size="lg" />
            ))}
          </div>
          <p className="text-xs text-[#5A6B80]">label prop으로 텍스트를 덮어쓸 수 있습니다 (예: 대기중/승인됨/거절됨, 해결됨 등)</p>
        </div>
      </Section>

      <Section title="PresenceBadge / SpecialNoteTag" desc="src/components/presence-badge, special-note-tag">
        <div className="flex flex-wrap items-center gap-3">
          <PresenceBadge label="재실중" />
          <PresenceBadge label="검사중" color="#E8A13B" />
          <PresenceBadge label="외출중" color="#5A6B80" />
          <span className="mx-2 h-6 w-px bg-[#DCE3EC]" />
          <SpecialNoteTag icon="triangle-alert" color="#E8A13B" />
          <SpecialNoteTag icon="shield-alert" color="#E0442E" />
          <SpecialNoteTag icon="shield-alert" color="#E0442E" label="알레르기" showLabel />
        </div>
      </Section>

      <Section title="PatientCard" desc="src/components/patient-card — 대시보드/모니터링에서 사용">
        <div className="w-[280px]">
          <PatientCard
            name="이영희"
            room="302호 · A-2"
            severity="caution"
            heartRate={104}
            respirationRate={18}
            sensorStatus="연결됨"
            timestamp="14:32:07"
          />
        </div>
      </Section>

      <Section title="Header" desc="src/components/header — 병원 스태프용 상단바 (환자 실시간 검색 포함)">
        <div className="overflow-x-auto rounded-lg border border-[#DCE3EC]">
          <div className="min-w-[720px]">
            <Header hospitalName="서울중앙병원" userName="김간호 · RN" notificationCount={3} />
          </div>
        </div>
      </Section>

      <Section title="AdminHeader" desc="src/components/admin-header — 관리자 콘솔 전용 상단바 (병원·장치·사용자 통합 검색)">
        <div className="overflow-x-auto rounded-lg border border-[#DCE3EC]">
          <div className="min-w-[720px]">
            <AdminHeader notificationCount={5} />
          </div>
        </div>
      </Section>

      <Section
        title="Sidebar / AdminSidebar"
        desc="src/components/sidebar, admin-sidebar — 좌측 내비게이션. min-h-screen으로 화면 전체 높이(뷰포트 기준)를 채웁니다. 아래는 미리보기용으로 높이를 600px로 고정한 것입니다."
      >
        <div className="flex flex-wrap gap-4">
          <div className="h-[600px] w-[240px] shrink-0 overflow-hidden rounded-lg border border-[#DCE3EC]">
            <Sidebar active="dashboard" />
          </div>
          <div className="h-[600px] w-[240px] shrink-0 overflow-hidden rounded-lg border border-[#DCE3EC]">
            <AdminSidebar active="hospitals" />
          </div>
        </div>
      </Section>

      <Section title="Modals" desc="src/components/modals — 버튼을 눌러 실제 모달을 미리 볼 수 있습니다">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setOpenModal("search")}
            className="rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-4 py-2 text-sm font-semibold text-[#1E2A3A]"
          >
            HospitalSearchModal 열기
          </button>
          <button
            type="button"
            onClick={() => setOpenModal("patientRegister")}
            className="rounded-lg border border-[#DCE3EC] bg-[#F5F7FA] px-4 py-2 text-sm font-semibold text-[#1E2A3A]"
          >
            PatientRegisterModal 열기
          </button>
        </div>
      </Section>

      <HospitalSearchModal isOpen={openModal === "search"} onClose={() => setOpenModal(null)} onSelect={() => {}} />
      <PatientRegisterModal isOpen={openModal === "patientRegister"} onClose={() => setOpenModal(null)} />
    </div>
  );
}

export default DevComponentLibrary;
