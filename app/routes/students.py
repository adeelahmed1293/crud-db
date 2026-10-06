from fastapi import APIRouter, Query, status
from typing import Optional, List, Dict, Any

from app.schemas.student import StudentCreate, StudentUpdate, StudentResponse
from app.services.student_service import StudentService

router = APIRouter(prefix="/api/students", tags=["Students"])

@router.get("", response_model=List[StudentResponse])
async def get_all_students(
    search: Optional[str] = Query(None, description="Search by name, email, roll number, or major"),
    status: Optional[str] = Query(None, description="Filter by status (Active, Graduated, On Leave, Probation)"),
    sort_by: Optional[str] = Query("created_at", description="Field to sort by"),
    order: Optional[int] = Query(-1, description="1 for ascending, -1 for descending")
):
    """Retrieve all students with optional search, filter, and sorting"""
    return await StudentService.get_all(
        search=search,
        status_filter=status,
        sort_by=sort_by or "created_at",
        order=order if order is not None else -1
    )

@router.get("/stats", response_model=Dict[str, Any])
async def get_student_statistics():
    """Retrieve aggregated dashboard metrics"""
    return await StudentService.get_stats()

@router.get("/{id}", response_model=StudentResponse)
async def get_student_by_id(id: str):
    """Retrieve a single student by MongoDB ID"""
    return await StudentService.get_by_id(id)

@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(student: StudentCreate):
    """Create a new student record"""
    return await StudentService.create(student)

@router.put("/{id}", response_model=StudentResponse)
async def update_student(id: str, student_update: StudentUpdate):
    """Update an existing student record"""
    return await StudentService.update(id, student_update)

@router.delete("/{id}")
async def delete_student(id: str):
    """Delete a student record by ID"""
    return await StudentService.delete(id)

@router.post("/seed")
async def seed_students(force: bool = Query(False, description="Force re-seed or append")):
    """Seed dummy students into database"""
    return await StudentService.seed(force=force)
