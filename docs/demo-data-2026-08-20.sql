-- =====================================================================
-- 37.5 SmartCare  시연용 데이터 반영 스크립트
-- 작성일: 2026-08-20
--
-- 스키마 변경은 없습니다(테이블·컬럼 그대로). docs/DDL.sql 은 수정 불필요.
-- 이 스크립트는 시연 화면을 팀원 PC에서도 똑같이 보기 위한 '데이터'만 넣습니다.
--
-- 실행 전에 반드시:  USE human_exe;
-- 여러 번 실행해도 중복되지 않도록 작성했습니다.
-- =====================================================================

USE human_exe;

-- ---------------------------------------------------------------------
-- 1. 환자 이름 정리
--    시드에 연예인 이름이 들어 있었고 성별도 맞지 않았습니다
--    (강호동=FEMALE, 김연아=MALE 등). 요양병원에 맞는 이름으로 바꿉니다.
-- ---------------------------------------------------------------------
UPDATE patients SET name = '정대현' WHERE patient_id = 5;
UPDATE patients SET name = '한미경' WHERE patient_id = 6;
UPDATE patients SET name = '유성호' WHERE patient_id = 7;
UPDATE patients SET name = '강옥분' WHERE patient_id = 8;
UPDATE patients SET name = '신영수' WHERE patient_id = 9;
UPDATE patients SET name = '이순자' WHERE patient_id = 10;
UPDATE patients SET name = '김태호' WHERE patient_id = 11;
UPDATE patients SET name = '손말순' WHERE patient_id = 12;
UPDATE patients SET name = '장복동' WHERE patient_id = 13;
UPDATE patients SET name = '차영자' WHERE patient_id = 14;
UPDATE patients SET name = '백승철' WHERE patient_id = 15;

-- ---------------------------------------------------------------------
-- 2. 병동 재배치
--    한 계정은 자기 부서만 봅니다. 부서 안에서 병동이 나뉘어야 병동 탭이
--    의미가 있어서 부서마다 3개 병동으로 나눴습니다.
--    부서마다 병동 이름을 다르게 쓰는 이유: 같은 병원에서 병동·병실·침대가
--    겹치면 실제로 같은 침대에 두 명이 눕는 데이터가 됩니다.
-- ---------------------------------------------------------------------
UPDATE patients SET ward = '1병동' WHERE patient_id = 1;
UPDATE patients SET ward = '6병동' WHERE patient_id = 2;
UPDATE patients SET ward = '8병동' WHERE patient_id = 3;
UPDATE patients SET ward = '1병동' WHERE patient_id = 4;
UPDATE patients SET ward = '4병동' WHERE patient_id = 5;
UPDATE patients SET ward = '8병동' WHERE patient_id = 6;
UPDATE patients SET ward = '1병동' WHERE patient_id = 7;
UPDATE patients SET ward = '6병동' WHERE patient_id = 8;
UPDATE patients SET ward = '7병동' WHERE patient_id = 9;
UPDATE patients SET ward = '2병동' WHERE patient_id = 10;
UPDATE patients SET ward = '6병동' WHERE patient_id = 11;
UPDATE patients SET ward = '8병동' WHERE patient_id = 12;
UPDATE patients SET ward = '3병동' WHERE patient_id = 13;
UPDATE patients SET ward = '5병동' WHERE patient_id = 14;
UPDATE patients SET ward = '7병동' WHERE patient_id = 15;
UPDATE patients SET ward = '4병동' WHERE patient_id = 17;
UPDATE patients SET ward = '7병동' WHERE patient_id = 18;
UPDATE patients SET ward = '2병동' WHERE patient_id = 19;
UPDATE patients SET ward = '5병동' WHERE patient_id = 20;
UPDATE patients SET ward = '3병동' WHERE patient_id = 21;
UPDATE patients SET ward = '9병동' WHERE patient_id = 22;
UPDATE patients SET ward = '1병동' WHERE patient_id = 23;
UPDATE patients SET ward = '4병동' WHERE patient_id = 24;
UPDATE patients SET ward = '7병동' WHERE patient_id = 25;
UPDATE patients SET ward = '2병동' WHERE patient_id = 26;
UPDATE patients SET ward = '5병동' WHERE patient_id = 27;
UPDATE patients SET ward = '8병동' WHERE patient_id = 28;
UPDATE patients SET ward = '3병동' WHERE patient_id = 29;
UPDATE patients SET ward = '9병동' WHERE patient_id = 30;
UPDATE patients SET ward = '4병동' WHERE patient_id = 31;
UPDATE patients SET ward = '7병동' WHERE patient_id = 32;
UPDATE patients SET ward = '2병동' WHERE patient_id = 33;
UPDATE patients SET ward = '5병동' WHERE patient_id = 34;
UPDATE patients SET ward = '6병동' WHERE patient_id = 35;
UPDATE patients SET ward = '9병동' WHERE patient_id = 36;
UPDATE patients SET ward = '1병동' WHERE patient_id = 37;
UPDATE patients SET ward = '4병동' WHERE patient_id = 38;
UPDATE patients SET ward = '7병동' WHERE patient_id = 39;
UPDATE patients SET ward = '2병동' WHERE patient_id = 40;
UPDATE patients SET ward = '5병동' WHERE patient_id = 41;
UPDATE patients SET ward = '3병동' WHERE patient_id = 42;
UPDATE patients SET ward = '9병동' WHERE patient_id = 43;
UPDATE patients SET ward = '1병동' WHERE patient_id = 44;
UPDATE patients SET ward = '4병동' WHERE patient_id = 45;
UPDATE patients SET ward = '2병동' WHERE patient_id = 46;
UPDATE patients SET ward = '8병동' WHERE patient_id = 47;
UPDATE patients SET ward = '3병동' WHERE patient_id = 48;
UPDATE patients SET ward = '6병동' WHERE patient_id = 49;
UPDATE patients SET ward = '9병동' WHERE patient_id = 50;

-- ---------------------------------------------------------------------
-- 3. 환자 추가 (총 50명이 되도록)
--    화면에 환자가 5명뿐이라 대시보드·목록이 비어 보였습니다.
-- ---------------------------------------------------------------------
INSERT INTO patients (department_id, patient_no, name, birthdate, gender, ward, room_num, bed_num, special_notes, status, is_present, admission_date)
  SELECT 5, 'P0016', '김만수', '1950-01-01', 'MALE', '1병동', 101, 1, '', 'ADMITTED', 1, '2026-08-18'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM patients WHERE patient_no = 'P0016');
INSERT INTO patients (department_id, patient_no, name, birthdate, gender, ward, room_num, bed_num, special_notes, status, is_present, admission_date)
  SELECT 2, 'P0017', '김영수', '1935-01-01', 'MALE', '4병동', 101, 1, '', 'ADMITTED', 1, '2026-08-01'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM patients WHERE patient_no = 'P0017');
INSERT INTO patients (department_id, patient_no, name, birthdate, gender, ward, room_num, bed_num, special_notes, status, is_present, admission_date)
  SELECT 3, 'P0018', '김말자', '1942-02-02', 'FEMALE', '7병동', 101, 1, '', 'ADMITTED', 1, '2026-08-02'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM patients WHERE patient_no = 'P0018');
INSERT INTO patients (department_id, patient_no, name, birthdate, gender, ward, room_num, bed_num, special_notes, status, is_present, admission_date)
  SELECT 1, 'P0019', '박찬호', '1949-03-03', 'MALE', '2병동', 101, 2, '', 'ADMITTED', 1, '2026-08-03'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM patients WHERE patient_no = 'P0019');
INSERT INTO patients (department_id, patient_no, name, birthdate, gender, ward, room_num, bed_num, special_notes, status, is_present, admission_date)
  SELECT 2, 'P0020', '박순덕', '1956-04-04', 'FEMALE', '5병동', 101, 2, '', 'ADMITTED', 1, '2026-08-04'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM patients WHERE patient_no = 'P0020');
INSERT INTO patients (department_id, patient_no, name, birthdate, gender, ward, room_num, bed_num, special_notes, status, is_present, admission_date)
  SELECT 1, 'P0021', '이만복', '1937-05-05', 'MALE', '3병동', 101, 3, '', 'ADMITTED', 1, '2026-08-05'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM patients WHERE patient_no = 'P0021');
INSERT INTO patients (department_id, patient_no, name, birthdate, gender, ward, room_num, bed_num, special_notes, status, is_present, admission_date)
  SELECT 3, 'P0022', '이금자', '1944-06-06', 'FEMALE', '9병동', 101, 3, '', 'ADMITTED', 1, '2026-08-06'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM patients WHERE patient_no = 'P0022');
INSERT INTO patients (department_id, patient_no, name, birthdate, gender, ward, room_num, bed_num, special_notes, status, is_present, admission_date)
  SELECT 1, 'P0023', '최동수', '1951-07-07', 'MALE', '1병동', 101, 4, '', 'ADMITTED', 1, '2026-08-07'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM patients WHERE patient_no = 'P0023');
INSERT INTO patients (department_id, patient_no, name, birthdate, gender, ward, room_num, bed_num, special_notes, status, is_present, admission_date)
  SELECT 2, 'P0024', '최영자', '1958-08-08', 'FEMALE', '4병동', 101, 4, '', 'ADMITTED', 1, '2026-08-08'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM patients WHERE patient_no = 'P0024');
INSERT INTO patients (department_id, patient_no, name, birthdate, gender, ward, room_num, bed_num, special_notes, status, is_present, admission_date)
  SELECT 3, 'P0025', '정길동', '1939-09-09', 'MALE', '7병동', 101, 4, '', 'ADMITTED', 1, '2026-08-09'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM patients WHERE patient_no = 'P0025');
INSERT INTO patients (department_id, patient_no, name, birthdate, gender, ward, room_num, bed_num, special_notes, status, is_present, admission_date)
  SELECT 1, 'P0026', '정복순', '1946-10-10', 'FEMALE', '2병동', 102, 1, '', 'ADMITTED', 1, '2026-08-10'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM patients WHERE patient_no = 'P0026');
INSERT INTO patients (department_id, patient_no, name, birthdate, gender, ward, room_num, bed_num, special_notes, status, is_present, admission_date)
  SELECT 2, 'P0027', '한상철', '1953-11-11', 'MALE', '5병동', 102, 1, '', 'ADMITTED', 1, '2026-08-11'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM patients WHERE patient_no = 'P0027');
INSERT INTO patients (department_id, patient_no, name, birthdate, gender, ward, room_num, bed_num, special_notes, status, is_present, admission_date)
  SELECT 3, 'P0028', '한옥희', '1960-12-12', 'FEMALE', '8병동', 102, 1, '', 'ADMITTED', 1, '2026-08-12'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM patients WHERE patient_no = 'P0028');
INSERT INTO patients (department_id, patient_no, name, birthdate, gender, ward, room_num, bed_num, special_notes, status, is_present, admission_date)
  SELECT 1, 'P0029', '오재현', '1941-01-13', 'MALE', '3병동', 102, 2, '', 'ADMITTED', 1, '2026-08-13'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM patients WHERE patient_no = 'P0029');
INSERT INTO patients (department_id, patient_no, name, birthdate, gender, ward, room_num, bed_num, special_notes, status, is_present, admission_date)
  SELECT 3, 'P0030', '오미자', '1948-02-14', 'FEMALE', '9병동', 102, 2, '', 'ADMITTED', 1, '2026-08-14'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM patients WHERE patient_no = 'P0030');
INSERT INTO patients (department_id, patient_no, name, birthdate, gender, ward, room_num, bed_num, special_notes, status, is_present, admission_date)
  SELECT 2, 'P0031', '강두식', '1955-03-15', 'MALE', '4병동', 102, 3, '', 'ADMITTED', 1, '2026-08-15'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM patients WHERE patient_no = 'P0031');
INSERT INTO patients (department_id, patient_no, name, birthdate, gender, ward, room_num, bed_num, special_notes, status, is_present, admission_date)
  SELECT 3, 'P0032', '윤정숙', '1936-04-16', 'FEMALE', '7병동', 102, 3, '', 'ADMITTED', 1, '2026-08-16'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM patients WHERE patient_no = 'P0032');
INSERT INTO patients (department_id, patient_no, name, birthdate, gender, ward, room_num, bed_num, special_notes, status, is_present, admission_date)
  SELECT 1, 'P0033', '조병길', '1943-05-17', 'MALE', '2병동', 102, 4, '', 'ADMITTED', 1, '2026-08-17'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM patients WHERE patient_no = 'P0033');
INSERT INTO patients (department_id, patient_no, name, birthdate, gender, ward, room_num, bed_num, special_notes, status, is_present, admission_date)
  SELECT 2, 'P0034', '강귀연', '1950-06-18', 'FEMALE', '5병동', 102, 4, '', 'ADMITTED', 1, '2026-08-18'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM patients WHERE patient_no = 'P0034');
INSERT INTO patients (department_id, patient_no, name, birthdate, gender, ward, room_num, bed_num, special_notes, status, is_present, admission_date)
  SELECT 2, 'P0035', '임수길', '1957-07-19', 'MALE', '6병동', 103, 1, '', 'ADMITTED', 1, '2026-08-01'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM patients WHERE patient_no = 'P0035');
INSERT INTO patients (department_id, patient_no, name, birthdate, gender, ward, room_num, bed_num, special_notes, status, is_present, admission_date)
  SELECT 3, 'P0036', '조말순', '1938-08-20', 'FEMALE', '9병동', 103, 1, '', 'ADMITTED', 1, '2026-08-02'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM patients WHERE patient_no = 'P0036');
INSERT INTO patients (department_id, patient_no, name, birthdate, gender, ward, room_num, bed_num, special_notes, status, is_present, admission_date)
  SELECT 1, 'P0037', '서정만', '1945-09-21', 'MALE', '1병동', 103, 2, '', 'ADMITTED', 1, '2026-08-03'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM patients WHERE patient_no = 'P0037');
INSERT INTO patients (department_id, patient_no, name, birthdate, gender, ward, room_num, bed_num, special_notes, status, is_present, admission_date)
  SELECT 2, 'P0038', '임숙자', '1952-10-22', 'FEMALE', '4병동', 103, 2, '', 'ADMITTED', 1, '2026-08-04'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM patients WHERE patient_no = 'P0038');
INSERT INTO patients (department_id, patient_no, name, birthdate, gender, ward, room_num, bed_num, special_notes, status, is_present, admission_date)
  SELECT 3, 'P0039', '신광호', '1959-11-23', 'MALE', '7병동', 103, 2, '', 'ADMITTED', 1, '2026-08-05'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM patients WHERE patient_no = 'P0039');
INSERT INTO patients (department_id, patient_no, name, birthdate, gender, ward, room_num, bed_num, special_notes, status, is_present, admission_date)
  SELECT 1, 'P0040', '서경자', '1940-12-24', 'FEMALE', '2병동', 103, 3, '', 'ADMITTED', 1, '2026-08-06'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM patients WHERE patient_no = 'P0040');
INSERT INTO patients (department_id, patient_no, name, birthdate, gender, ward, room_num, bed_num, special_notes, status, is_present, admission_date)
  SELECT 2, 'P0041', '황보석', '1947-01-25', 'MALE', '5병동', 103, 3, '', 'ADMITTED', 1, '2026-08-07'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM patients WHERE patient_no = 'P0041');
INSERT INTO patients (department_id, patient_no, name, birthdate, gender, ward, room_num, bed_num, special_notes, status, is_present, admission_date)
  SELECT 1, 'P0042', '신영순', '1954-02-26', 'FEMALE', '3병동', 103, 4, '', 'ADMITTED', 1, '2026-08-08'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM patients WHERE patient_no = 'P0042');
INSERT INTO patients (department_id, patient_no, name, birthdate, gender, ward, room_num, bed_num, special_notes, status, is_present, admission_date)
  SELECT 3, 'P0043', '문태식', '1935-03-27', 'MALE', '9병동', 103, 4, '', 'ADMITTED', 1, '2026-08-09'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM patients WHERE patient_no = 'P0043');
INSERT INTO patients (department_id, patient_no, name, birthdate, gender, ward, room_num, bed_num, special_notes, status, is_present, admission_date)
  SELECT 1, 'P0044', '황금순', '1942-04-01', 'FEMALE', '1병동', 104, 1, '', 'ADMITTED', 1, '2026-08-10'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM patients WHERE patient_no = 'P0044');
INSERT INTO patients (department_id, patient_no, name, birthdate, gender, ward, room_num, bed_num, special_notes, status, is_present, admission_date)
  SELECT 2, 'P0045', '배기환', '1949-05-02', 'MALE', '4병동', 104, 1, '', 'ADMITTED', 1, '2026-08-11'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM patients WHERE patient_no = 'P0045');
INSERT INTO patients (department_id, patient_no, name, birthdate, gender, ward, room_num, bed_num, special_notes, status, is_present, admission_date)
  SELECT 1, 'P0046', '문정자', '1956-06-03', 'FEMALE', '2병동', 104, 2, '', 'ADMITTED', 1, '2026-08-12'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM patients WHERE patient_no = 'P0046');
INSERT INTO patients (department_id, patient_no, name, birthdate, gender, ward, room_num, bed_num, special_notes, status, is_present, admission_date)
  SELECT 3, 'P0047', '송달수', '1937-07-04', 'MALE', '8병동', 104, 2, '', 'ADMITTED', 1, '2026-08-13'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM patients WHERE patient_no = 'P0047');
INSERT INTO patients (department_id, patient_no, name, birthdate, gender, ward, room_num, bed_num, special_notes, status, is_present, admission_date)
  SELECT 1, 'P0048', '배옥순', '1944-08-05', 'FEMALE', '3병동', 104, 3, '', 'ADMITTED', 1, '2026-08-14'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM patients WHERE patient_no = 'P0048');
INSERT INTO patients (department_id, patient_no, name, birthdate, gender, ward, room_num, bed_num, special_notes, status, is_present, admission_date)
  SELECT 2, 'P0049', '안종국', '1951-09-06', 'MALE', '6병동', 104, 3, '', 'ADMITTED', 1, '2026-08-15'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM patients WHERE patient_no = 'P0049');
INSERT INTO patients (department_id, patient_no, name, birthdate, gender, ward, room_num, bed_num, special_notes, status, is_present, admission_date)
  SELECT 3, 'P0050', '송자영', '1958-10-07', 'FEMALE', '9병동', 104, 3, '', 'ADMITTED', 1, '2026-08-16'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM patients WHERE patient_no = 'P0050');

-- ---------------------------------------------------------------------
-- 4. 장치·현재값 채우기
--    대시보드/모니터링 쿼리가 devices, vital_checks 와 INNER JOIN 이라
--    이 둘이 없는 환자는 화면에 아예 안 뜹니다.
--    (값은 자리만 채우는 용도 - 화면은 프론트 목업이 덮어씁니다)
-- ---------------------------------------------------------------------
INSERT INTO devices (hospital_id, patient_id, status, serial_num)
  SELECT d.hospital_id, p.patient_id, 'ACTIVE',
         CONCAT('MR6', LPAD(p.patient_id, 5, '0'))
  FROM patients p
  JOIN departments d ON d.department_id = p.department_id
  LEFT JOIN devices dev ON dev.patient_id = p.patient_id
  WHERE dev.device_id IS NULL;

INSERT INTO vital_checks (patient_id, heart_rate, resp_rate, status)
  SELECT p.patient_id, 75, 16, 'NORMAL'
  FROM patients p
  LEFT JOIN vital_checks vc ON vc.patient_id = p.patient_id
  WHERE vc.vital_check_id IS NULL;

-- ---------------------------------------------------------------------
-- 5. 확인
-- ---------------------------------------------------------------------
SELECT '환자 수' AS 항목, COUNT(*) AS 값 FROM patients
UNION ALL SELECT '장치 수', COUNT(*) FROM devices
UNION ALL SELECT '현재값 수', COUNT(*) FROM vital_checks;

-- 부서·병동별 인원 (화면에 뜨는 기준)
SELECT d.name AS 부서, p.ward AS 병동, COUNT(*) AS 인원
  FROM patients p
  JOIN departments d ON d.department_id = p.department_id
  JOIN devices dev   ON dev.patient_id  = p.patient_id
  JOIN vital_checks vc ON vc.patient_id = p.patient_id
  GROUP BY d.department_id, d.name, p.ward
  ORDER BY d.department_id, p.ward;

-- 같은 병원에서 침대가 겹치는지 (0건이어야 정상)
SELECT p.ward, p.room_num, p.bed_num, COUNT(*) AS 중복
  FROM patients p JOIN departments d ON d.department_id = p.department_id
  GROUP BY d.hospital_id, p.ward, p.room_num, p.bed_num
  HAVING 중복 > 1;
