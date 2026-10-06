from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional
from datetime import datetime

class StudentBase(BaseModel):
    student_id: str = Field(..., description="Unique university roll or student identifier (e.g. STU-101)")
    full_name: str = Field(..., min_length=2, max_length=100, description="Full name of student")
    email: EmailStr = Field(..., description="Institutional or personal email address")
    age: int = Field(..., ge=15, le=100, description="Student age in years")
    major: str = Field(..., min_length=2, max_length=100, description="Field of study or degree program")
    gpa: float = Field(..., ge=0.0, le=4.0, description="Grade point average (0.0 to 4.0 scale)")
    enrollment_status: str = Field(default="Active", description="Current status: Active, Graduated, On Leave, Probation")
    phone: Optional[str] = Field(default=None, description="Contact phone number")

    @field_validator("enrollment_status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        valid_statuses = ["Active", "Graduated", "On Leave", "Probation"]
        v_title = v.title() if v else "Active"
        if v_title not in valid_statuses:
            raise ValueError(f"Status must be one of: {', '.join(valid_statuses)}")
        return v_title

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    student_id: Optional[str] = Field(default=None)
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    email: Optional[EmailStr] = Field(default=None)
    age: Optional[int] = Field(default=None, ge=15, le=100)
    major: Optional[str] = Field(default=None, min_length=2, max_length=100)
    gpa: Optional[float] = Field(default=None, ge=0.0, le=4.0)
    enrollment_status: Optional[str] = Field(default=None)
    phone: Optional[str] = Field(default=None)

    @field_validator("enrollment_status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        valid_statuses = ["Active", "Graduated", "On Leave", "Probation"]
        v_title = v.title()
        if v_title not in valid_statuses:
            raise ValueError(f"Status must be one of: {', '.join(valid_statuses)}")
        return v_title

class StudentResponse(StudentBase):
    id: str = Field(..., description="MongoDB Document ObjectID string")
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "656df9359e19bb42e0789abc",
                "student_id": "STU-2024-001",
                "full_name": "Sophia Martinez",
                "email": "sophia.martinez@university.edu",
                "age": 21,
                "major": "Computer Science",
                "gpa": 3.88,
                "enrollment_status": "Active",
                "phone": "+1 (555) 345-6789",
                "created_at": "2026-10-06T10:00:00",
                "updated_at": "2026-10-06T10:00:00"
            }
        }
    }
