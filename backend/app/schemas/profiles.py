from pydantic import BaseModel


class ProfileUpsert(BaseModel):
    display_name: str
    color: str
