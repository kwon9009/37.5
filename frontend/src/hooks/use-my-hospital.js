import { useEffect, useState } from "react";
import { apiClient } from "../api/client.js";
import { useAuthStore } from "../store/auth-store.js";

// 로그인한 계정의 소속 병원 이름을 가져온다.
//
// 상단 바에 병원 이름이 "서울중앙병원"으로 고정돼 있어서, 어느 병원 계정으로
// 들어가도 같은 이름이 나오는 문제가 있었다. 실제 소속을 서버에서 받아온다.
//
// 관리자(ADMIN)는 특정 병원에 속하지 않고 여러 병원을 관리하므로 병원 이름이 없다.
// 그때는 부르는 쪽에서 적당한 기본값을 쓰면 된다.

// 화면을 옮길 때마다 다시 부르지 않도록 한 번 받은 값은 들고 있는다.
// 소속 병원은 로그인해 있는 동안 바뀌지 않는다.
let cached = { token: null, name: null };

export function useMyHospital() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const role = useAuthStore((state) => state.role);
  const [hospitalName, setHospitalName] = useState(
    cached.token === accessToken ? cached.name : null,
  );

  useEffect(() => {
    if (!accessToken || role !== "DEPARTMENT") return;
    if (cached.token === accessToken && cached.name) {
      setHospitalName(cached.name);
      return;
    }

    let alive = true;

    apiClient
      .get("/departments/me")
      .then(({ data }) => {
        if (!alive) return;
        cached = { token: accessToken, name: data.hospital_name };
        setHospitalName(data.hospital_name);
      })
      .catch(() => {
        // 못 받아와도 화면은 그대로 쓸 수 있어야 한다.
        // 부르는 쪽에서 기본값을 보여준다.
      });

    return () => {
      alive = false;
    };
  }, [accessToken, role]);

  return hospitalName;
}
