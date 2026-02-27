from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import households, tasks

app = FastAPI(title="HomeSync API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(households.router)
app.include_router(tasks.router)


@app.get("/health")
def health():
    return {"status": "ok"}
