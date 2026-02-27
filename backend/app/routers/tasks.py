from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.database import get_supabase
from app.dependencies import CurrentUser
from app.schemas.tasks import TaskCreate, TaskPatch

router = APIRouter(tags=["tasks"])


@router.get("/households/{household_id}/tasks")
def list_tasks(
    household_id: UUID,
    user: CurrentUser,
    week_start: str | None = Query(default=None, description="ISO date (YYYY-MM-DD)"),
):
    db = get_supabase()
    query = db.table("tasks").select("*").eq("household_id", str(household_id))
    if week_start:
        query = query.eq("week_start", week_start)
    result = query.execute()
    return result.data


@router.post("/households/{household_id}/tasks", status_code=status.HTTP_201_CREATED)
def create_task(household_id: UUID, body: TaskCreate, user: CurrentUser):
    db = get_supabase()
    payload = body.model_dump(exclude_none=True)
    payload["household_id"] = str(household_id)
    payload["proposed_by"] = str(user["sub"])
    if "assigned_to" in payload:
        payload["assigned_to"] = str(payload["assigned_to"])
    if "week_start" in payload:
        payload["week_start"] = payload["week_start"].isoformat()

    result = db.table("tasks").insert(payload).execute()
    return result.data[0]


@router.patch("/tasks/{task_id}")
def patch_task(task_id: UUID, body: TaskPatch, user: CurrentUser):
    db = get_supabase()
    payload = body.model_dump(exclude_unset=True)
    if not payload:
        raise HTTPException(status_code=400, detail="No fields to update")
    if "assigned_to" in payload and payload["assigned_to"] is not None:
        payload["assigned_to"] = str(payload["assigned_to"])
    if "week_start" in payload and payload["week_start"] is not None:
        payload["week_start"] = payload["week_start"].isoformat()

    result = db.table("tasks").update(payload).eq("id", str(task_id)).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Task not found")
    return result.data[0]
