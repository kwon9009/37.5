import { apiClient } from "@/api/client.js"

/**
 * 환자 연동 신청.
 *
 * 보호자가 "이 환자의 보호자가 맞다"고 병원에 신청하고, 병원이 승인하면
 * 그 환자의 생체정보를 볼 수 있게 된다. 승인 전까지는 대기 화면에 머문다.
 */

export type LinkRequestStatus = "PENDING" | "APPROVED" | "REJECTED"

export type LinkRequest = {
  request_id: number
  hospital_id: number
  hospital_name: string
  patient_name: string
  birthdate: string
  relation: string
  status: LinkRequestStatus
  created_at: string
  processed_at: string | null
}

export type SubmitLinkRequest = {
  hospitalCode: string
  patientName: string
  /** YYYY-MM-DD */
  birthdate: string
  relation: string
}

/** 환자와의 관계 선택지. DB에 이미 쓰이는 값들과 맞춰 둔다. */
export const RELATIONS = ["배우자", "아들", "딸", "부모", "형제", "보호자"] as const

/**
 * 연동 신청을 보낸다.
 *
 * 실패하면 화면에 그대로 보여줄 수 있는 한국어 메시지를 담아 던진다.
 * (같은 신청이 이미 대기 중이면 409, 병원 코드가 없으면 404가 온다)
 */
export async function submitLinkRequest(input: SubmitLinkRequest): Promise<LinkRequest> {
  try {
    const { data } = await apiClient.post("/patient-link-requests", {
      hospital_code: input.hospitalCode,
      patient_name: input.patientName,
      birthdate: input.birthdate,
      relation: input.relation,
    })
    return data as LinkRequest
  } catch (error) {
    throw new Error(messageOf(error, "신청을 보내지 못했습니다. 잠시 후 다시 시도해 주세요."))
  }
}

/** 내가 낸 신청 목록 (최근 것부터) */
export async function fetchMyLinkRequests(): Promise<LinkRequest[]> {
  const { data } = await apiClient.get("/patient-link-requests/me")
  return data as LinkRequest[]
}

/** 서버가 내려준 사유를 꺼낸다. 없으면 기본 문구를 쓴다. */
function messageOf(error: unknown, fallback: string): string {
  const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data
    ?.detail
  return typeof detail === "string" && detail ? detail : fallback
}
