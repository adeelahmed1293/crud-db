from bson import ObjectId
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import HTTPException, status

from app.database import get_student_collection
from app.schemas.student import StudentCreate, StudentUpdate
from app.seed_data import DUMMY_STUDENTS
from app.logger import logger

class StudentService:
    @staticmethod
    def _get_collection():
        collection = get_student_collection()
        if collection is None:
            logger.error("[DB ERROR] MongoDB connection is not active! Please check your MONGODB_URL in .env")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="MongoDB is not connected. Please verify your connection string in the '.env' file or via UI."
            )
        return collection

    @staticmethod
    def _doc_to_dict(doc: Dict[str, Any]) -> Dict[str, Any]:
        """Format MongoDB raw BSON document into API response dictionary"""
        return {
            "id": str(doc["_id"]),
            "student_id": doc.get("student_id", ""),
            "full_name": doc.get("full_name", ""),
            "email": doc.get("email", ""),
            "age": doc.get("age", 0),
            "major": doc.get("major", ""),
            "gpa": float(doc.get("gpa", 0.0)),
            "enrollment_status": doc.get("enrollment_status", "Active"),
            "phone": doc.get("phone", ""),
            "created_at": doc.get("created_at", datetime.utcnow().isoformat()),
            "updated_at": doc.get("updated_at", datetime.utcnow().isoformat())
        }

    @classmethod
    async def get_all(
        cls,
        search: Optional[str] = None,
        status_filter: Optional[str] = None,
        sort_by: str = "created_at",
        order: int = -1
    ) -> List[Dict[str, Any]]:
        collection = cls._get_collection()
        query: Dict[str, Any] = {}

        # Search across multiple student fields
        if search and search.strip():
            term = search.strip()
            query["$or"] = [
                {"full_name": {"$regex": term, "$options": "i"}},
                {"email": {"$regex": term, "$options": "i"}},
                {"student_id": {"$regex": term, "$options": "i"}},
                {"major": {"$regex": term, "$options": "i"}}
            ]

        # Status filter
        if status_filter and status_filter.strip() and status_filter.lower() != "all":
            query["enrollment_status"] = status_filter.strip()

        sort_field = sort_by if sort_by in ["full_name", "gpa", "age", "student_id", "created_at"] else "created_at"
        sort_dir = 1 if order == 1 else -1

        cursor = collection.find(query).sort(sort_field, sort_dir)
        students = [cls._doc_to_dict(doc) async for doc in cursor]

        logger.info(f"[READ] Fetched {len(students)} students (Query: '{search or ''}', Status: '{status_filter or 'All'}')")
        return students

    @classmethod
    async def get_by_id(cls, student_id: str) -> Dict[str, Any]:
        collection = cls._get_collection()
        if not ObjectId.is_valid(student_id):
            logger.warning(f"[READ WARNING] Invalid ObjectId format: '{student_id}'")
            raise HTTPException(status_code=400, detail="Invalid student ID format.")

        doc = await collection.find_one({"_id": ObjectId(student_id)})
        if not doc:
            logger.warning(f"[READ WARNING] Student ID '{student_id}' not found.")
            raise HTTPException(status_code=404, detail="Student not found.")

        logger.info(f"[READ] Retrieved student: {doc.get('full_name')} (ID: {student_id})")
        return cls._doc_to_dict(doc)

    @classmethod
    async def create(cls, student_data: StudentCreate) -> Dict[str, Any]:
        collection = cls._get_collection()

        # Check uniqueness of student_id and email
        existing = await collection.find_one({
            "$or": [
                {"student_id": student_data.student_id},
                {"email": student_data.email}
            ]
        })
        if existing:
            msg = f"A student with Student ID '{student_data.student_id}' or Email '{student_data.email}' already exists."
            logger.warning(f"[CREATE CONFLICT] {msg}")
            raise HTTPException(status_code=409, detail=msg)

        doc_data = student_data.model_dump()
        now_iso = datetime.utcnow().isoformat()
        doc_data["created_at"] = now_iso
        doc_data["updated_at"] = now_iso

        result = await collection.insert_one(doc_data)
        new_doc = await collection.find_one({"_id": result.inserted_id})

        logger.success(f"[CREATE SUCCESS] Created student '{student_data.full_name}' ({student_data.student_id}) - ID: {result.inserted_id}")
        return cls._doc_to_dict(new_doc)

    @classmethod
    async def update(cls, student_id: str, update_data: StudentUpdate) -> Dict[str, Any]:
        collection = cls._get_collection()
        if not ObjectId.is_valid(student_id):
            logger.warning(f"[UPDATE WARNING] Invalid ObjectId format: '{student_id}'")
            raise HTTPException(status_code=400, detail="Invalid student ID format.")

        fields_to_update = {k: v for k, v in update_data.model_dump().items() if v is not None}
        if not fields_to_update:
            raise HTTPException(status_code=400, detail="No fields provided for update.")

        fields_to_update["updated_at"] = datetime.utcnow().isoformat()

        # Check unique constraint if student_id or email changed
        if "student_id" in fields_to_update or "email" in fields_to_update:
            conflict_query: Dict[str, Any] = {"_id": {"$ne": ObjectId(student_id)}, "$or": []}
            if "student_id" in fields_to_update:
                conflict_query["$or"].append({"student_id": fields_to_update["student_id"]})
            if "email" in fields_to_update:
                conflict_query["$or"].append({"email": fields_to_update["email"]})

            conflict = await collection.find_one(conflict_query)
            if conflict:
                logger.warning(f"[UPDATE CONFLICT] Student ID or Email already in use by another student.")
                raise HTTPException(status_code=409, detail="Student ID or Email is already in use by another student.")

        updated_doc = await collection.find_one_and_update(
            {"_id": ObjectId(student_id)},
            {"$set": fields_to_update},
            return_document=True
        )
        if not updated_doc:
            logger.warning(f"[UPDATE WARNING] Student ID '{student_id}' not found.")
            raise HTTPException(status_code=404, detail="Student not found.")

        logger.success(f"[UPDATE SUCCESS] Updated student '{updated_doc.get('full_name')}' (ID: {student_id})")
        return cls._doc_to_dict(updated_doc)

    @classmethod
    async def delete(cls, student_id: str) -> Dict[str, str]:
        collection = cls._get_collection()
        if not ObjectId.is_valid(student_id):
            logger.warning(f"[DELETE WARNING] Invalid ObjectId format: '{student_id}'")
            raise HTTPException(status_code=400, detail="Invalid student ID format.")

        doc = await collection.find_one({"_id": ObjectId(student_id)})
        if not doc:
            logger.warning(f"[DELETE WARNING] Student ID '{student_id}' not found.")
            raise HTTPException(status_code=404, detail="Student not found.")

        await collection.delete_one({"_id": ObjectId(student_id)})
        logger.warning(f"[DELETE SUCCESS] Deleted student '{doc.get('full_name')}' (ID: {student_id})")
        return {
            "message": f"Student '{doc.get('full_name')}' deleted successfully.",
            "id": student_id
        }

    @classmethod
    async def seed(cls, force: bool = False) -> Dict[str, Any]:
        collection = cls._get_collection()
        count = await collection.count_documents({})
        if count > 0 and not force:
            logger.info(f"[SEED INFO] Database already has {count} students.")
            return {
                "message": f"Database already contains {count} students. Seed not duplicated.",
                "seeded_count": 0,
                "total_count": count
            }

        records_to_insert = []
        for item in DUMMY_STUDENTS:
            exists = await collection.find_one({"student_id": item["student_id"]})
            if not exists:
                rec = item.copy()
                now_iso = datetime.utcnow().isoformat()
                rec["created_at"] = now_iso
                rec["updated_at"] = now_iso
                records_to_insert.append(rec)

        if records_to_insert:
            result = await collection.insert_many(records_to_insert)
            seeded_count = len(result.inserted_ids)
            total = await collection.count_documents({})
            logger.success(f"[SEED SUCCESS] Seeded {seeded_count} dummy students into MongoDB. Total: {total}")
            return {
                "message": f"Successfully seeded {seeded_count} dummy student records.",
                "seeded_count": seeded_count,
                "total_count": total
            }

        total = await collection.count_documents({})
        return {
            "message": "All dummy records are already in the database.",
            "seeded_count": 0,
            "total_count": total
        }

    @classmethod
    async def get_stats(cls) -> Dict[str, Any]:
        collection = cls._get_collection()
        total = await collection.count_documents({})
        active = await collection.count_documents({"enrollment_status": "Active"})
        graduated = await collection.count_documents({"enrollment_status": "Graduated"})
        on_leave = await collection.count_documents({"enrollment_status": "On Leave"})
        probation = await collection.count_documents({"enrollment_status": "Probation"})

        avg_cursor = collection.aggregate([{"$group": {"_id": None, "avg_gpa": {"$avg": "$gpa"}}}])
        avg_list = await avg_cursor.to_list(length=1)
        avg_gpa = round(avg_list[0]["avg_gpa"], 2) if avg_list and avg_list[0].get("avg_gpa") else 0.0

        logger.info(f"[STATS] Total: {total}, Active: {active}, Graduated: {graduated}, Avg GPA: {avg_gpa}")
        return {
            "total": total,
            "active": active,
            "graduated": graduated,
            "on_leave": on_leave,
            "probation": probation,
            "avg_gpa": avg_gpa
        }
