from uuid import UUID

from fastapi import APIRouter, HTTPException, Query

from app.database import get_supabase
from app.dependencies import CurrentUser
from app.schemas.shopping import ShoppingItemPatch

router = APIRouter(tags=["shopping"])

CATEGORY_ORDER = ["produce", "meat", "dairy", "grains", "pantry", "other"]


@router.get("/households/{household_id}/shopping-list")
def get_shopping_list(
    household_id: UUID,
    user: CurrentUser,
    week_start: str = Query(..., description="ISO date (YYYY-MM-DD)"),
):
    db = get_supabase()
    result = (
        db.table("shopping_list_items")
        .select("*")
        .eq("household_id", str(household_id))
        .eq("week_start", week_start)
        .execute()
    )
    return result.data


@router.post("/households/{household_id}/shopping-list/sync")
def sync_shopping_list(
    household_id: UUID,
    user: CurrentUser,
    week_start: str = Query(..., description="ISO date (YYYY-MM-DD)"),
):
    db = get_supabase()

    # 1. Fetch accepted meal tasks for that household/week
    tasks_result = (
        db.table("tasks")
        .select("ingredients")
        .eq("household_id", str(household_id))
        .eq("week_start", week_start)
        .eq("task_type", "meal")
        .eq("state", "accepted")
        .execute()
    )

    # 2. Flatten + deduplicate ingredients: group by (name.lower(), unit), sum quantities
    aggregated: dict[tuple[str, str | None], dict] = {}
    for task in tasks_result.data:
        ingredients = task.get("ingredients") or []
        if isinstance(ingredients, str):
            import json
            ingredients = json.loads(ingredients)
        for ing in ingredients:
            key = (ing["name"].lower(), ing.get("unit"))
            if key in aggregated:
                existing_qty = aggregated[key]["quantity"]
                new_qty = ing.get("quantity")
                if existing_qty is not None and new_qty is not None:
                    aggregated[key]["quantity"] = existing_qty + new_qty
                elif new_qty is not None:
                    aggregated[key]["quantity"] = new_qty
            else:
                aggregated[key] = {
                    "name": ing["name"],
                    "quantity": ing.get("quantity"),
                    "unit": ing.get("unit"),
                    "category": ing.get("category", "other"),
                }

    # 3. Fetch checked items to preserve them
    checked_result = (
        db.table("shopping_list_items")
        .select("name")
        .eq("household_id", str(household_id))
        .eq("week_start", week_start)
        .eq("checked", True)
        .execute()
    )
    checked_names = {row["name"].lower() for row in checked_result.data}

    # 4. Delete unchecked items
    db.table("shopping_list_items").delete().eq(
        "household_id", str(household_id)
    ).eq("week_start", week_start).eq("checked", False).execute()

    # 5. Insert new items, skipping names already in checked items
    new_items = [
        {
            "household_id": str(household_id),
            "week_start": week_start,
            "name": item["name"],
            "quantity": item["quantity"],
            "unit": item["unit"],
            "category": item["category"],
            "checked": False,
        }
        for item in aggregated.values()
        if item["name"].lower() not in checked_names
    ]
    if new_items:
        db.table("shopping_list_items").insert(new_items).execute()

    # Return all items for that household/week
    result = (
        db.table("shopping_list_items")
        .select("*")
        .eq("household_id", str(household_id))
        .eq("week_start", week_start)
        .execute()
    )
    return result.data


@router.patch("/shopping-list-items/{item_id}")
def patch_shopping_item(item_id: UUID, body: ShoppingItemPatch, user: CurrentUser):
    db = get_supabase()
    result = (
        db.table("shopping_list_items")
        .update({"checked": body.checked})
        .eq("id", str(item_id))
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Item not found")
    return result.data[0]
