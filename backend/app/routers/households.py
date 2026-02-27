from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.database import get_supabase
from app.dependencies import CurrentUser
from app.schemas.households import HouseholdCreate, MemberAdd

router = APIRouter(prefix="/households", tags=["households"])


@router.post("", status_code=status.HTTP_201_CREATED)
def create_household(body: HouseholdCreate, user: CurrentUser):
    db = get_supabase()
    result = db.table("households").insert({"name": body.name}).execute()
    household = result.data[0]

    # Auto-add creator as admin
    db.table("household_members").insert(
        {
            "household_id": household["id"],
            "user_id": str(user["sub"]),
            "role": "admin",
        }
    ).execute()

    return household


@router.get("/{household_id}")
def get_household(household_id: UUID, user: CurrentUser):
    db = get_supabase()
    result = db.table("households").select("*").eq("id", str(household_id)).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Household not found")

    members = (
        db.table("household_members")
        .select("*")
        .eq("household_id", str(household_id))
        .execute()
    )
    household = result.data[0]
    household["members"] = members.data
    return household


@router.post("/{household_id}/members", status_code=status.HTTP_201_CREATED)
def add_member(household_id: UUID, body: MemberAdd, user: CurrentUser):
    db = get_supabase()
    result = (
        db.table("household_members")
        .insert(
            {
                "household_id": str(household_id),
                "user_id": str(body.user_id),
                "role": body.role,
                "color": body.color,
            }
        )
        .execute()
    )
    return result.data[0]
