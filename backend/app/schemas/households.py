from uuid import UUID

from pydantic import BaseModel


class HouseholdCreate(BaseModel):
    name: str


class MemberAdd(BaseModel):
    user_id: UUID
    role: str = "member"
    color: str | None = None
