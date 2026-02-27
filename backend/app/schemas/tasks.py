from datetime import date
from uuid import UUID

from pydantic import BaseModel


class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    task_type: str = "chore"
    assigned_to: UUID | None = None
    day_window: str | None = None
    time_of_day: str | None = None
    duration_minutes: int | None = None
    week_start: date | None = None


class TaskPatch(BaseModel):
    title: str | None = None
    description: str | None = None
    state: str | None = None
    assigned_to: UUID | None = None
    day_window: str | None = None
    time_of_day: str | None = None
    duration_minutes: int | None = None
    week_start: date | None = None
