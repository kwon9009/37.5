import { apiClient } from "./client.js";

// 병원 담당자가 쓰는 환자 연동 요청 API.
//
// 보호자가 앱에서 "이 환자의 보호자가 맞다"고 신청하면 여기로 들어온다.
// 승인하면 그 보호자가 환자의 생체정보를 볼 수 있게 되므로, 승인 전에
// 신청 내용과 실제 환자가 맞는지 확인해야 한다.

// 서버 상태값 <-> 화면에 쓰는 한글 라벨
const STATUS_TO_LABEL = {
  PENDING: "대기중",
  APPROVED: "승인됨",
  REJECTED: "거절됨",
};

const LABEL_TO_STATUS = {
  대기중: "PENDING",
  승인됨: "APPROVED",
  거절됨: "REJECTED",
};

export function statusLabel(status) {
  return STATUS_TO_LABEL[status] ?? status;
}

/** "2026-08-08T19:46:50" -> "2026-08-08 19:46" (초는 화면에서 안 쓴다) */
function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

/**
 * 서버 응답을 화면이 쓰는 모양으로 바꾼다.
 * 화면 곳곳에서 request.guardian_name 같은 서버 필드명을 직접 쓰면,
 * 나중에 응답이 바뀔 때 고칠 곳이 흩어진다.
 */
function toRow(raw) {
  return {
    id: raw.request_id,
    requester: raw.guardian_name,
    phone: raw.guardian_phone,
    patientName: raw.patient_name,
    birthDate: raw.birthdate,
    relation: raw.relation,
    status: statusLabel(raw.status),
    requestedAt: formatDateTime(raw.created_at),
    processedAt: formatDateTime(raw.processed_at),
    // 이름·생년월일이 맞는 우리 병원 환자들. 승인할 때 이 중에서 고른다.
    // 비어 있으면 그런 환자가 없다는 뜻이라 승인할 수 없다.
    candidates: (raw.matching_patients ?? []).map((p) => ({
      patientId: p.patient_id,
      patientNo: p.patient_no,
      name: p.name,
      birthDate: p.birthdate,
      ward: p.ward,
      roomNum: p.room_num,
      bedNum: p.bed_num,
    })),
  };
}

/** 우리 병원으로 들어온 연동 요청 목록. statusLabel을 주면 그 상태만 가져온다. */
export async function fetchLinkRequests(label) {
  const status = LABEL_TO_STATUS[label];
  const { data } = await apiClient.get("/patient-link-requests", {
    params: status ? { status } : undefined,
  });
  return data.map(toRow);
}

/** 연동 요청 한 건 (상세 화면용) */
export async function fetchLinkRequest(requestId) {
  const { data } = await apiClient.get(`/patient-link-requests/${requestId}`);
  return toRow(data);
}

/**
 * 승인한다. 어느 환자와 연결할지 반드시 지정해야 한다.
 * 신청서에는 이름과 생년월일만 있어서, 동명이인이 있으면 서버가 혼자 정할 수 없다.
 */
export async function approveLinkRequest(requestId, patientId) {
  const { data } = await apiClient.patch(`/patient-link-requests/${requestId}`, {
    approve: true,
    patient_id: patientId,
  });
  return toRow(data);
}

/** 거절한다. */
export async function rejectLinkRequest(requestId) {
  const { data } = await apiClient.patch(`/patient-link-requests/${requestId}`, {
    approve: false,
  });
  return toRow(data);
}

/** 서버가 내려준 사유를 꺼낸다. 없으면 기본 문구를 쓴다. */
export function errorMessage(error, fallback) {
  const detail = error?.response?.data?.detail;
  return typeof detail === "string" && detail ? detail : fallback;
}
