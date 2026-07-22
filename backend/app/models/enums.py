from enum import Enum


class Gender(str, Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"


class PatientStatus(str, Enum):
    ADMITTED = "ADMITTED"
    DISCHARGED = "DISCHARGED"


class DeviceStatus(str, Enum):
    ACTIVE = "ACTIVE"
    OFFLINE = "OFFLINE"
    ERROR = "ERROR"


class VitalStatus(str, Enum):
    NORMAL = "NORMAL"
    WARNING = "WARNING"
    ALERT = "ALERT"
    DANGER = "DANGER"


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    DEPARTMENT = "DEPARTMENT"
    GUARDIAN = "GUARDIAN"
