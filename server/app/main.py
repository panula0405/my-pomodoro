from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from datetime import date, datetime
import os
from typing import Literal
from pydantic import BaseModel, Field
from openai import OpenAI
from dotenv import load_dotenv
from app.database import (
    create_task,
    delete_task,
    initialize_database,
    read_settings,
    read_tasks,
    write_settings,
    update_task_status
)

app = FastAPI(title="Pomodoro API")
initialize_database()
load_dotenv()

AI_BASE_URL = os.getenv(
    "AI_BASE_URL",
    "http://127.0.0.1:1234/v1",
)
AI_API_KEY = os.getenv("AI_API_KEY", "lm-studio")
AI_MODEL = os.getenv("AI_MODEL", "google/gemma-4-e4b")
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:5174",
    ).split(",")
    if origin.strip()
]

openai_client = OpenAI(
    base_url=AI_BASE_URL,
    api_key=AI_API_KEY,
)

class PomodoroSettings(BaseModel):
    timer_minutes: float = Field(gt=0, le=120)
    short_break_minutes: float = Field(gt=0, le=60)
    long_break_minutes: float = Field(gt=0, le=120)
    batch_size: int = Field(ge=1, le=10)

class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=500)
    priority: Literal["low", "medium", "high"]
    estimated_pomodoros: int = Field(ge=1, le=20)
    position: int = Field(ge=1)
    planned_date: date
class TaskResponse(BaseModel):
    id: int
    title: str
    description: str
    priority: Literal["low", "medium", "high"]
    estimated_pomodoros: int
    position: int
    status: Literal["todo", "in_progress", "done"]
    planned_date: date
    created_at: datetime
class TaskStatusUpdate(BaseModel):
    status: Literal["todo", "in_progress", "done"]

class PlannerRequest(BaseModel):
    message: str = Field(min_length=3, max_length=1000)
    planned_date: date
class PlannerResponse(BaseModel):
    summary: str
    tasks: list[TaskResponse]

class PlannedTask(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    description: str = Field(max_length=500)
    priority: Literal["low", "medium", "high"]
    estimated_pomodoros: int = Field(ge=1, le=20)

class GeneratedPlan(BaseModel):
    summary: str = Field(min_length=1, max_length=300)
    tasks: list[PlannedTask] = Field(
        min_length=1,
        max_length=10,
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PLANNER_INSTRUCTIONS = """
You are a practical daily planning assistant.

Turn the user's description into a concise, actionable
Pomodoro plan.

Rules:
- Break large goals into clear tasks.
- Keep small goals as one task.
- Each task must be independently actionable.
- Estimate between 1 and 20 Pomodoros per task.
- Use high, medium, or low priority.
- Order urgent or blocking work first.
- Do not invent deadlines or personal facts.
- Use the same language as the user.
- Keep descriptions brief and concrete.
"""

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "message": "Pomodoro API is running",
    }

@app.get("/api/settings", response_model=PomodoroSettings)
def get_settings():
    return read_settings()

@app.put("/api/settings", response_model=PomodoroSettings)
def update_settings(new_settings: PomodoroSettings):
    write_settings(
        timer_minutes=new_settings.timer_minutes,
        short_break_minutes=new_settings.short_break_minutes,
        long_break_minutes=new_settings.long_break_minutes,
        batch_size=new_settings.batch_size,
    )
    return read_settings()

@app.post(
    "/api/tasks",
    response_model=TaskResponse,
    status_code=201,
)
def add_task(new_task: TaskCreate):
    return create_task(
        title=new_task.title,
        description=new_task.description,
        priority=new_task.priority,
        estimated_pomodoros=new_task.estimated_pomodoros,
        position=new_task.position,
        planned_date=new_task.planned_date.isoformat(),
    )

@app.get(
    "/api/tasks",
    response_model=list[TaskResponse],
)
def get_tasks(planned_date: date):
    return read_tasks(planned_date.isoformat())

@app.patch(
    "/api/tasks/{task_id}",
    response_model=TaskResponse,
)
def change_task_status(
    task_id: int,
    update: TaskStatusUpdate,
):
    task = update_task_status(task_id, update.status)

    if task is None:
        raise HTTPException(
            status_code=404,
            detail="Task not found",
        )

    return task

@app.delete(
    "/api/tasks/{task_id}",
    status_code=204,
)
def remove_task(task_id: int):
    was_deleted = delete_task(task_id)

    if not was_deleted:
        raise HTTPException(
            status_code=404,
            detail="Task not found",
        )

    return Response(status_code=204)

@app.post(
    "/api/planner",
    response_model=PlannerResponse,
    status_code=201,
)
def create_plan(request: PlannerRequest):
    planned_date = request.planned_date.isoformat()

    existing_tasks = read_tasks(planned_date)

    if existing_tasks:
        next_position = max(
            task["position"] for task in existing_tasks
        ) + 1
    else:
        next_position = 1

    settings = read_settings()

    response = openai_client.chat.completions.create(
        model=AI_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    PLANNER_INSTRUCTIONS
                    + "\nReturn only valid JSON matching this schema:\n"
                    + str(GeneratedPlan.model_json_schema())
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Focus session length: "
                    f"{settings['timer_minutes']} minutes.\n"
                    f"Plan date: {planned_date}.\n"
                    f"User request: {request.message}"
                ),
            },
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "generated_plan",
                "strict": True,
                "schema": GeneratedPlan.model_json_schema(),
            },
        },
        temperature=0,
    )

    generated_plan = GeneratedPlan.model_validate_json(
        response.choices[0].message.content
    )

    if generated_plan is None:
        raise HTTPException(
            status_code=502,
            detail="The planner did not return a valid plan.",
        )

    saved_tasks = []

    for position, planned_task in enumerate(
        generated_plan.tasks,
        start=next_position,
    ):
        saved_task = create_task(
            title=planned_task.title,
            description=planned_task.description,
            priority=planned_task.priority,
            estimated_pomodoros=(
                planned_task.estimated_pomodoros
            ),
            position=position,
            planned_date=planned_date,
        )

        saved_tasks.append(saved_task)

    return {
        "summary": generated_plan.summary,
        "tasks": saved_tasks,
    }
