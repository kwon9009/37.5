// 대전 지역 요양병원 (데모 데이터)
// code: 병원에서 보호자에게 안내하는 병원 코드
// x, y: 지도 마커 배치용 상대 좌표(%)
export type HospitalInfo = {
  code: string
  name: string
  address: string
  phone: string
  x: number
  y: number
}

export const hospitalDirectory: HospitalInfo[] = [
  { code: "DJ1001", name: "대전요양병원", address: "대전 중구 문화로 282", phone: "042-220-1001", x: 46, y: 58 },
  { code: "DJ1002", name: "한밭실버요양병원", address: "대전 서구 둔산로 100", phone: "042-530-1002", x: 34, y: 48 },
  { code: "DJ1003", name: "유성온천요양병원", address: "대전 유성구 온천북로 55", phone: "042-610-1003", x: 24, y: 34 },
  { code: "DJ1004", name: "대덕행복요양병원", address: "대전 대덕구 계족로 210", phone: "042-930-1004", x: 62, y: 30 },
  { code: "DJ1005", name: "동구사랑요양병원", address: "대전 동구 동서대로 1720", phone: "042-250-1005", x: 70, y: 62 },
]

export function findHospitalByCode(code: string) {
  const key = code.trim().toUpperCase()
  return hospitalDirectory.find((h) => h.code === key) ?? null
}
