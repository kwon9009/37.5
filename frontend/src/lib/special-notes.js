// 환자 "특이사항" 항목 정의. 등록 모달 / 환자 상세 / 응급 스크리닝 팝업이 모두 이 목록을 공유한다.
// critical: true 항목은 응급 상황과 직결되는 심장 관련 특이사항으로, 응급 팝업에서 강조 표시된다.
export const SPECIAL_NOTE_OPTIONS = [
  { key: "pressure", icon: "bed", label: "욕창위험", critical: false },
  { key: "allergy", icon: "shield-alert", label: "알레르기", critical: false },
  { key: "mobility", icon: "accessibility", label: "거동불편", critical: false },
  { key: "swallowing", icon: "utensils-crossed", label: "연하곤란", critical: false },
  { key: "hypertension_angina", icon: "heart-pulse", label: "고혈압·협심증 병력", critical: true },
  { key: "cardiac_medication", icon: "circle-alert", label: "항혈전제·심장약 규칙 복용 필요", critical: true },
  { key: "chest_pain_watch", icon: "triangle-alert", label: "흉통 호소 여부 확인 요망", critical: true },
  { key: "other", icon: "info", label: "기타", critical: false },
];

const NOTE_BY_LABEL = new Map(SPECIAL_NOTE_OPTIONS.map((option) => [option.label, option]));

// 선택된 칩 key 목록 + 직접 입력 텍스트를 하나의 special_notes 문자열로 합친다.
export function composeSpecialNotes(selectedKeys = [], otherText = "") {
  const labels = SPECIAL_NOTE_OPTIONS.filter(
    (option) => option.key !== "other" && selectedKeys.includes(option.key),
  ).map((option) => option.label);

  const trimmedOther = otherText.trim();
  if (trimmedOther) labels.push(trimmedOther);

  return labels.join(", ");
}

// special_notes 문자열을 태그 배열로 분해한다. 알려진 라벨은 아이콘/중요도를 매칭하고,
// 그 외 텍스트(과거 자유 입력 등)는 일반 태그로 표시한다.
export function parseSpecialNotes(specialNotes) {
  if (!specialNotes) return [];

  return specialNotes
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((label) => {
      const known = NOTE_BY_LABEL.get(label);
      return known ? { ...known, label } : { key: null, icon: "info", label, critical: false };
    });
}

// special_notes 문자열을 편집 UI 초기값(선택된 칩 key 목록 + 직접 입력 텍스트)으로 분해한다.
export function splitForEditing(specialNotes) {
  if (!specialNotes) return { selectedKeys: [], otherText: "" };

  const selectedKeys = [];
  const leftovers = [];

  for (const part of specialNotes.split(",").map((item) => item.trim()).filter(Boolean)) {
    const known = NOTE_BY_LABEL.get(part);
    if (known && known.key !== "other") selectedKeys.push(known.key);
    else leftovers.push(part);
  }

  return { selectedKeys, otherText: leftovers.join(", ") };
}
