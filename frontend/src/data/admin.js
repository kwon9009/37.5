export const HOSPITALS = [
  { id: "서울중앙병원", name: "서울중앙병원", region: "수도권", beds: 820, devices: 342, manager: "김도현", active: true },
  { id: "부산해운대병원", name: "부산해운대병원", region: "영남권", beds: 540, devices: 210, manager: "이수진", active: true },
  { id: "대구가톨릭병원", name: "대구가톨릭병원", region: "영남권", beds: 610, devices: 188, manager: "박준영", active: true },
  { id: "인천송도병원", name: "인천송도병원", region: "수도권", beds: 430, devices: 156, manager: "최민아", active: false },
  { id: "광주무등병원", name: "광주무등병원", region: "호남권", beds: 380, devices: 122, manager: "정하늘", active: true },
  { id: "대전한밭병원", name: "대전한밭병원", region: "충청권", beds: 290, devices: 98, manager: "한지우", active: true },
  { id: "울산현대병원", name: "울산현대병원", region: "영남권", beds: 340, devices: 110, manager: "오세훈", active: false },
];

export const DEVICES = [
  { id: "VG-302-A1", room: "302호", bed: "A-1", online: true, battery: 92, lastSeen: "14:32:07" },
  { id: "VG-302-A2", room: "302호", bed: "A-2", online: true, battery: 78, lastSeen: "14:31:59" },
  { id: "VG-305-A1", room: "305호", bed: "A-1", online: true, battery: 64, lastSeen: "14:32:03" },
  { id: "VG-305-A2", room: "305호", bed: "A-2", online: false, battery: 12, lastSeen: "13:48:21" },
  { id: "VG-308-A1", room: "308호", bed: "A-1", online: true, battery: 88, lastSeen: "14:30:44" },
  { id: "VG-308-A2", room: "308호", bed: "A-2", online: true, battery: 41, lastSeen: "14:31:12" },
  { id: "VG-311-A1", room: "311호", bed: "A-1", online: false, battery: 0, lastSeen: "12:05:33" },
  { id: "VG-311-A2", room: "311호", bed: "A-2", online: true, battery: 57, lastSeen: "14:29:50" },
];

export const USERS = [
  { id: "김도현", name: "김도현", email: "dohyun.kim@smc.kr", role: "시스템관리자", hospital: "서울중앙병원", lastLogin: "2026-07-02 09:14", active: true },
  { id: "이수진", name: "이수진", email: "sujin.lee@hde.kr", role: "의료진", hospital: "부산해운대병원", lastLogin: "2026-07-02 08:47", active: true },
  { id: "박준영", name: "박준영", email: "jy.park@dcmc.kr", role: "의료진", hospital: "대구가톨릭병원", lastLogin: "2026-07-01 21:03", active: true },
  { id: "최민아", name: "최민아", email: "mina.choi@isb.kr", role: "의료진", hospital: "인천송도병원", lastLogin: "2026-07-02 07:20", active: true },
  { id: "정하늘", name: "정하늘", email: "haneul.jung@gmd.kr", role: "의료진", hospital: "광주무등병원", lastLogin: "2026-06-30 18:55", active: false },
  { id: "한지우", name: "한지우", email: "jiwoo.han@djh.kr", role: "보호자", hospital: "대전한밭병원", lastLogin: "2026-07-02 06:10", active: true },
  { id: "오세훈", name: "오세훈", email: "sehun.oh@uhd.kr", role: "의료진", hospital: "울산현대병원", lastLogin: "2026-06-29 14:32", active: false },
  { id: "윤서아", name: "윤서아", email: "seoa.yoon@smc.kr", role: "시스템관리자", hospital: "서울중앙병원", lastLogin: "2026-07-02 09:01", active: true },
];
