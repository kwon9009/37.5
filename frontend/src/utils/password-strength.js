const MIN_LENGTH = 8;

// 영문/숫자/특수문자 등 몇 종류를 섞어 썼는지 센다
function countCharTypes(password) {
  const checks = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/];
  return checks.reduce((count, regex) => count + (regex.test(password) ? 1 : 0), 0);
}

export function getPasswordStrength(password) {
  if (!password) {
    return { level: "none", isValid: false, label: "" };
  }

  const hasMinLength = password.length >= MIN_LENGTH;
  const typeCount = countCharTypes(password);
  const isValid = hasMinLength && typeCount >= 2;

  if (!isValid) {
    return { level: "weak", isValid: false, label: "약함" };
  }
  if (typeCount >= 3) {
    return { level: "strong", isValid: true, label: "강함" };
  }
  return { level: "medium", isValid: true, label: "보통" };
}

export const PASSWORD_HINT = "8자 이상, 영문/숫자/특수문자 중 2종류 이상 조합해 주세요.";
