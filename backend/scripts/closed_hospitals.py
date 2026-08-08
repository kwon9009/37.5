"""폐업이 확인된 병원 목록.

한 곳에만 적어두고 여러 스크립트가 함께 쓴다.
목록이 두 군데로 갈라지면 한쪽만 고쳐서 폐업 병원이 되살아난다.

  - import_hospitals.py        : 새로 넣을 때 이 병원들은 건너뛴다
  - remove_closed_hospitals.py : 이미 들어가 있으면 지운다

폐업한 병원이 목록에 남아 있으면 보호자가 그 병원으로 연동 신청을 하게 된다.

폐업을 어떻게 알아냈나:
  개발 화면 /dev/hospital-map 으로 전체 병원 주소를 카카오 지도에서 조회했더니
  이 병원만 어떤 방법으로도 안 잡혔다. 폐업하면 카카오에서도 내려가기 때문이다.
  (나머지 병원은 전부 정상 조회 = 아직 영업 중이라는 신호)
"""

# 공공데이터 CSV(data/hospitals.csv)에는 남아 있지만 실제로는 폐업한 병원.
# CSV 원본은 "그때 데이터가 이랬다"는 근거라서 손대지 않고, 여기서 걸러낸다.
CLOSED_HOSPITALS = [
    {
        "code": "DJ008",
        "name": "보아스요양병원",
        "note": "대전 서구 도산로 224 · 2026-08-08 폐업 확인",
    },
]

CLOSED_NAMES = {h["name"] for h in CLOSED_HOSPITALS}
CLOSED_CODES = [h["code"] for h in CLOSED_HOSPITALS]
