from fastapi import APIRouter, HTTPException

from app.database import get_supabase
from app.dependencies import CurrentUser
from app.schemas.profiles import ProfileUpsert

router = APIRouter(prefix="/me", tags=["profiles"])


@router.get("/profile")
def get_profile(user: CurrentUser):
    db = get_supabase()
    result = db.table("profiles").select("*").eq("id", str(user["sub"])).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return result.data[0]


@router.put("/profile")
def upsert_profile(body: ProfileUpsert, user: CurrentUser):
    db = get_supabase()
    payload = {"id": str(user["sub"]), "display_name": body.display_name, "color": body.color}
    result = db.table("profiles").upsert(payload, on_conflict="id").execute()
    return result.data[0]


@router.get("/households")
def list_my_households(user: CurrentUser):
    db = get_supabase()
    rows = (
        db.table("household_members")
        .select("household_id, role, households(id, name)")
        .eq("user_id", str(user["sub"]))
        .execute()
    )
    return [
        {
            "household_id": r["household_id"],
            "household_name": (r.get("households") or {}).get("name"),
            "role": r["role"],
        }
        for r in rows.data
    ]
