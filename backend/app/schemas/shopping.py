from pydantic import BaseModel


class ShoppingItemPatch(BaseModel):
    checked: bool
