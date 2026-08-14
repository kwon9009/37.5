CREATE DATABASE IF NOT EXISTS human_exe
DEFAULT CHARACTER SET utf8mb4
DEFAULT COLLATE utf8mb4_unicode_ci;
USE human_exe;

CREATE TABLE hospitals (
hospital_id BIGINT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(50) NOT NULL,
area VARCHAR(20) NOT NULL, -- 2026-08-05 추가: 시·도 단위 지역명(예: '대전광역시'). 대전만 실제 데이터고 나머지 지역은 목업이라, 보호자가 지역을 골라 병원을 찾을 수 있어야 함
address VARCHAR(255) NOT NULL, -- 2026-08-05 수정: VARCHAR(50) -> VARCHAR(255). 대전 45개 병원 실측 최대 47자로 한도에 3자밖에 안 남아 입력 실패 위험
hospital_code VARCHAR(10) NOT NULL UNIQUE, -- 보호자에게 문자로 전달하는 병원 코드. 지역별 접두사(대전 DJ, 서울 SU, 경기 GG, 부산 BS, 대구 DG)
bed_count INT NOT NULL,
phone VARCHAR(20) NULL, -- 2026-08-12 추가: 병원 대표 전화번호. 보호자 앱의 "병원 연락하기" 버튼이 이 번호로 건다. 폐업·개명 등으로 못 구한 병원이 있어 NULL 허용(그 병원은 버튼이 비활성된다)
created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
is_active BOOLEAN NOT NULL DEFAULT TRUE, -- 2026-08-14 추가: 병원 계정 활성/비활성 상태. 관리자가 병원 상세 화면에서 토글한다
UNIQUE KEY uk_hospital_name_address (name, address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2026-07-22 추가: 병원 직접 등록 요청/승인 플로우용 (승인 시 hospitals 테이블에 INSERT)
CREATE TABLE hospital_requests (
  hospital_request_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  hospital_name VARCHAR(50) NOT NULL,
  area VARCHAR(20) NOT NULL, -- 승인 시 hospitals.area(NOT NULL)로 복사된다
  address VARCHAR(255) NOT NULL,
  bed_count INT NOT NULL, -- 2026-08-05 추가: 승인 시 hospitals.bed_count(NOT NULL)로 복사되므로 필수. 없으면 승인 자체가 불가능
  status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE users (
user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
login_id VARCHAR(50) NOT NULL UNIQUE,
email VARCHAR(100) NULL UNIQUE, -- 2026-07-16 추가: 부서 계정 비밀번호 찾기용. 보호자 등은 아직 없어서 nullable
password VARCHAR(255) NOT NULL,
is_active BOOLEAN NOT NULL DEFAULT TRUE,
role ENUM('ADMIN','DEPARTMENT','GUARDIAN') NOT NULL,
created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE admins (
admin_id BIGINT AUTO_INCREMENT PRIMARY KEY,
user_id BIGINT NOT NULL UNIQUE,
name VARCHAR(20) NOT NULL,
email VARCHAR(50) NOT NULL,
phone VARCHAR(20) NOT NULL,
is_super_admin BOOLEAN NOT NULL DEFAULT FALSE, -- 2026-08-14 추가: 전체 병원을 보는 슈퍼관리자인지. admin_hospitals는 "담당자 표시"용이라 접근 범위 판단에 못 씀
created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
CONSTRAINT fk_admin_user FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE admin_hospitals (
admin_hospital_id BIGINT AUTO_INCREMENT PRIMARY KEY,
admin_id BIGINT NOT NULL,
hospital_id BIGINT NOT NULL,
UNIQUE KEY uk_admin_hospital (admin_id, hospital_id),
FOREIGN KEY(admin_id) REFERENCES admins(admin_id) ON DELETE CASCADE,
FOREIGN KEY(hospital_id) REFERENCES hospitals(hospital_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE departments (
department_id BIGINT AUTO_INCREMENT PRIMARY KEY,
hospital_id BIGINT NOT NULL,
user_id BIGINT NOT NULL UNIQUE,
name VARCHAR(20) NOT NULL,
created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
UNIQUE KEY uk_department_hospital_name (hospital_id, name),
CONSTRAINT fk_department_hospital FOREIGN KEY(hospital_id) REFERENCES hospitals(hospital_id) ON DELETE CASCADE,
CONSTRAINT fk_department_user FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE guardians (
guardian_id BIGINT AUTO_INCREMENT PRIMARY KEY,
user_id BIGINT NOT NULL UNIQUE,
name VARCHAR(20) NOT NULL,
phone VARCHAR(20) NOT NULL,
created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
CONSTRAINT fk_guardian_user FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE patients (
patient_id BIGINT AUTO_INCREMENT PRIMARY KEY,
department_id BIGINT NOT NULL,
patient_no VARCHAR(20) NOT NULL UNIQUE,
name VARCHAR(20) NOT NULL,
birthdate DATE NOT NULL,
gender ENUM('MALE','FEMALE') NOT NULL,
ward VARCHAR(20) NOT NULL,
room_num INT NOT NULL,
bed_num INT NOT NULL,
special_notes TEXT NOT NULL,
status ENUM('ADMITTED','DISCHARGED') NOT NULL,
is_present BOOLEAN NOT NULL DEFAULT TRUE, -- 2026-07-22 추가: 재실 여부 (대시보드 presence_label에 사용)
admission_date DATE NOT NULL,
discharge_date DATE NULL,
created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
CONSTRAINT fk_patient_department FOREIGN KEY(department_id) REFERENCES departments(department_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2026-08-04 추가: 보호자가 병원 코드로 환자 연동을 신청하고 병원이 승인하는 플로우용
--                 (승인 시 patient_guardians 테이블에 INSERT)
CREATE TABLE patient_link_requests (
request_id BIGINT AUTO_INCREMENT PRIMARY KEY,
guardian_id BIGINT NOT NULL,
hospital_id BIGINT NOT NULL,
patient_name VARCHAR(20) NOT NULL,
birthdate DATE NOT NULL,
relation VARCHAR(20) NOT NULL,
status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- 2026-08-05 추가: 다른 테이블과 동일하게 공통 컬럼 맞춤
processed_at TIMESTAMP NULL, -- 병원이 승인/거절한 시각. 대기 중(PENDING)이면 NULL
-- 2026-08-05 삭제: uk_patient_link_request UNIQUE (guardian_id, hospital_id, patient_name, birthdate)
--   사유: 한 번 거절되면 같은 정보로 재신청이 영영 불가능해짐.
--        (MySQL은 '대기 중인 것만 중복 금지' 같은 조건부 UNIQUE를 지원하지 않음)
--        중복 신청 검사는 서버 코드에서 처리한다.
KEY idx_link_request_lookup (hospital_id, status),   -- 2026-08-05 추가: 병원의 '대기 중 신청 목록' 조회용
KEY idx_link_request_guardian (guardian_id, status), -- 2026-08-05 추가: 보호자의 '내 신청 상태' 조회용
CONSTRAINT fk_link_request_guardian FOREIGN KEY (guardian_id) REFERENCES guardians(guardian_id) ON DELETE CASCADE,
CONSTRAINT fk_link_request_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals(hospital_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE patient_guardians (
patient_guardian_id BIGINT AUTO_INCREMENT PRIMARY KEY,
patient_id BIGINT NOT NULL,
guardian_id BIGINT NOT NULL,
relation VARCHAR(20) NOT NULL,
UNIQUE KEY uk_patient_guardian (patient_id, guardian_id),
FOREIGN KEY(patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
FOREIGN KEY(guardian_id) REFERENCES guardians(guardian_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE devices (
device_id BIGINT AUTO_INCREMENT PRIMARY KEY,
hospital_id BIGINT NOT NULL, -- 2026-08-14 추가: 장치는 재고 등록 시점부터 병원 소속이 정해진다(환자 배정과 분리)
patient_id BIGINT NULL, -- 2026-08-14 수정: NOT NULL -> NULL. 관리자가 재고 등록만 하고, 병원이 환자에게 나중에 배정하는 흐름 지원
status ENUM('ACTIVE','OFFLINE','ERROR') NOT NULL,
serial_num VARCHAR(20) NOT NULL UNIQUE,
created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
FOREIGN KEY(hospital_id) REFERENCES hospitals(hospital_id) ON DELETE CASCADE,
FOREIGN KEY(patient_id) REFERENCES patients(patient_id) ON DELETE SET NULL -- 2026-08-14 수정: ON DELETE CASCADE -> SET NULL. 환자가 삭제돼도 장치는 재고로 남아야 한다
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE vital_checks (
vital_check_id BIGINT AUTO_INCREMENT PRIMARY KEY,
patient_id BIGINT NOT NULL,
heart_rate INT NOT NULL,
resp_rate INT NOT NULL,
status ENUM('NORMAL','WARNING','ALERT','DANGER') NOT NULL, -- 2026-07-22: ALERT 값 추가 (NORMAL/WARNING 사이 세분화)
created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
FOREIGN KEY(patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE vital_logs (
vital_log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
patient_id BIGINT NOT NULL,
avg_heart_rate INT NOT NULL,
avg_resp_rate INT NOT NULL,
recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY(patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE emergency_logs (
emergency_log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
patient_id BIGINT NOT NULL,
heart_rate INT NOT NULL,
resp_rate INT NOT NULL,
event_type VARCHAR(50) NOT NULL,
created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY(patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2026-08-14 추가: 시스템 전역 설정. 딱 한 행만 쓴다.
-- .env(EARLY_WARNING_ENABLED, DANGER_SUSTAIN_SEC)에 있던 값을 관리자가
-- 서버 재시작 없이 화면에서 바꿀 수 있도록 DB로 옮긴 것.
CREATE TABLE system_settings (
system_setting_id BIGINT AUTO_INCREMENT PRIMARY KEY,
early_warning_enabled BOOLEAN NOT NULL DEFAULT FALSE,
danger_sustain_sec INT NOT NULL DEFAULT 10,
-- 2026-08-14 추가: NEWS2 응급(DANGER) 판정 경계값. WARNING/ALERT 세부 기준은 NEWS2 표준 그대로 두고
-- 이 바깥쪽 경계만 의료진이 조정 가능(서버가 NEWS2 기본값 근처로만 허용)
heart_rate_danger_low INT NOT NULL DEFAULT 40,
heart_rate_danger_high INT NOT NULL DEFAULT 131,
resp_rate_danger_low INT NOT NULL DEFAULT 8,
resp_rate_danger_high INT NOT NULL DEFAULT 25,
created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE alerts (
alert_id BIGINT AUTO_INCREMENT PRIMARY KEY,
patient_id BIGINT NOT NULL,
department_id BIGINT NULL,
guardian_id BIGINT NULL,
message VARCHAR(100) NOT NULL,
status ENUM('NORMAL','WARNING','ALERT','DANGER') NOT NULL,
is_read BOOLEAN NOT NULL DEFAULT FALSE,
sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY(patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
FOREIGN KEY(department_id) REFERENCES departments(department_id) ON DELETE SET NULL,
FOREIGN KEY(guardian_id) REFERENCES guardians(guardian_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
