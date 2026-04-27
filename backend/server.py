"""LifeScript backend.

A thin FastAPI proxy around Claude (Sonnet 4.5) via the
`emergentintegrations` Universal Key. The mobile client persists every piece
of user data in AsyncStorage, so the backend stays stateless: each endpoint
takes a fresh user-profile payload and returns a structured AI response.
"""

import json
import logging
import os
import re
import uuid
from pathlib import Path
from typing import List, Literal, Optional

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage
from fastapi import APIRouter, FastAPI, HTTPException
from pydantic import BaseModel, Field
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
CLAUDE_MODEL = "claude-sonnet-4-5-20250929"

app = FastAPI(title="LifeScript API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("lifescript")


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
LIFE_AREAS = ["Career", "Finances", "Health", "Relationships", "Mind", "Skills"]


class UserProfile(BaseModel):
    name: str
    age: int
    country: str
    dream: str
    obstacle: str
    hours_per_day: float
    focus_area: str
    income: Literal["Low", "Medium", "High"]
    style: Literal["Fast wins", "Deep work"]
    one_year_vision: str


class GenerateMissionRequest(BaseModel):
    profile: UserProfile
    day_index: int = 0  # 0..6 for the first week
    completed_missions: List[str] = Field(default_factory=list)


class Mission(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    area: str
    minutes: int
    icon: str  # ionicons name (best guess)


class WeeklyQuest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    daily_steps: List[str]


class InitialPlanResponse(BaseModel):
    missions: List[Mission]
    weekly_quest: WeeklyQuest
    welcome_quote: str


class DailyQuoteRequest(BaseModel):
    profile: UserProfile
    streak: int = 0


class DailyQuoteResponse(BaseModel):
    quote: str
    author: str = "LifeScript"


class CoachMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class CoachChatRequest(BaseModel):
    profile: UserProfile
    level: str
    streak: int
    total_xp: int
    today_mission: Optional[str] = None
    history: List[CoachMessage] = Field(default_factory=list)
    message: str
    session_id: Optional[str] = None


class CoachChatResponse(BaseModel):
    reply: str
    session_id: str


class BossBattleRequest(BaseModel):
    profile: UserProfile
    cycle: int = 1


class BossDay(BaseModel):
    day: int
    title: str
    description: str
    minutes: int


class BossBattleResponse(BaseModel):
    title: str
    narrative: str
    days: List[BossDay]
    reward_badge: str


class RegenerateMissionRequest(BaseModel):
    profile: UserProfile
    previous_mission: str
    reason: Literal["too_easy", "too_hard", "not_interested", "rest_day"]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _strip_json(raw: str) -> str:
    """Extract the first JSON blob from a Claude response."""
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```[a-zA-Z]*\n", "", cleaned)
        cleaned = re.sub(r"```$", "", cleaned).strip()
    # Sometimes the model wraps prose around JSON; pull out the first {...}
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if match:
        return match.group(0)
    return cleaned


def _new_chat(system_message: str, session_id: Optional[str] = None) -> LlmChat:
    if not EMERGENT_LLM_KEY:
        raise HTTPException(
            status_code=500,
            detail="EMERGENT_LLM_KEY is not configured on the server.",
        )
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id or str(uuid.uuid4()),
        system_message=system_message,
    ).with_model("anthropic", CLAUDE_MODEL)
    return chat


async def _ask_for_json(system_message: str, user_text: str) -> dict:
    """Single-shot JSON request with one retry on transient errors."""
    last_err: Optional[Exception] = None
    for attempt in range(2):
        chat = _new_chat(system_message)
        try:
            response = await chat.send_message(UserMessage(text=user_text))
        except Exception as exc:  # noqa: BLE001 — surface only on final attempt
            last_err = exc
            continue
        try:
            return json.loads(_strip_json(response))
        except json.JSONDecodeError as exc:
            last_err = exc
            logger.error("Claude returned invalid JSON (attempt %s): %s", attempt + 1, response)
            # retry once more for malformed JSON
    raise HTTPException(
        status_code=502,
        detail=f"AI request failed: {last_err}",
    )


def _profile_summary(profile: UserProfile) -> str:
    return (
        f"Name: {profile.name}\n"
        f"Age: {profile.age}\n"
        f"Country: {profile.country}\n"
        f"Biggest dream: {profile.dream}\n"
        f"Biggest obstacle: {profile.obstacle}\n"
        f"Daily time available: {profile.hours_per_day} hours\n"
        f"Focus area: {profile.focus_area}\n"
        f"Income level: {profile.income}\n"
        f"Style preference: {profile.style}\n"
        f"One-year vision: {profile.one_year_vision}\n"
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@api_router.get("/")
async def root():
    return {"service": "lifescript", "model": CLAUDE_MODEL, "ok": True}


@api_router.get("/health")
async def health():
    return {"ok": True, "key_loaded": bool(EMERGENT_LLM_KEY)}


@api_router.post("/ai/initial-plan", response_model=InitialPlanResponse)
async def initial_plan(req: GenerateMissionRequest):
    system = (
        "You are LifeScript, an elite life-coach AI that designs personalized "
        "RPG-style life plans. You speak with calm authority — direct, "
        "supportive, never preachy. You write in the user's first language "
        "if it is implied by their profile country (otherwise English). "
        "You always respond with valid JSON only — no prose, no markdown."
    )
    minutes_target = max(5, int(req.profile.hours_per_day * 60 / 4))
    user_msg = f"""USER PROFILE:
{_profile_summary(req.profile)}

Generate the user's first 7-day LifeScript plan as a single JSON object with this exact shape:
{{
  "missions": [
    {{ "title": "...", "description": "...", "area": "Career|Finances|Health|Relationships|Mind|Skills", "minutes": 10, "icon": "rocket-outline" }},
    ... 7 items, one per day, varied across life areas, but biased toward {req.profile.focus_area}
  ],
  "weekly_quest": {{
    "title": "...",
    "description": "A 7-day cumulative quest tied to the user's dream",
    "daily_steps": ["day 1 step", "day 2 step", "day 3 step", "day 4 step", "day 5 step", "day 6 step", "day 7 step"]
  }},
  "welcome_quote": "A single sentence, deeply personal motivational quote that references the user's dream and obstacle without quoting them verbatim."
}}

Rules:
- Each mission must take roughly {minutes_target} minutes (between 5 and 20).
- Mission titles are short, punchy, action-oriented (max 6 words).
- Descriptions are 1-2 sentences, concrete, doable today.
- "icon" must be a valid Ionicons icon name from this list: rocket-outline, barbell-outline, book-outline, bulb-outline, cash-outline, heart-outline, people-outline, brush-outline, leaf-outline, flame-outline, compass-outline, sparkles-outline.
- The weekly_quest builds momentum toward the user's one-year vision.
- The welcome_quote is intimate and specific — never generic.
Return JSON only."""
    data = await _ask_for_json(system, user_msg)
    try:
        missions = [Mission(**m) for m in data["missions"][:7]]
        wq = WeeklyQuest(**data["weekly_quest"])
        return InitialPlanResponse(
            missions=missions,
            weekly_quest=wq,
            welcome_quote=data.get("welcome_quote", ""),
        )
    except (KeyError, TypeError, ValueError) as exc:
        logger.error("Bad initial plan shape: %s", data)
        raise HTTPException(status_code=502, detail=f"AI shape error: {exc}")


@api_router.post("/ai/daily-quote", response_model=DailyQuoteResponse)
async def daily_quote(req: DailyQuoteRequest):
    system = (
        "You write deeply personal motivational quotes — never generic, "
        "always specific to the user. One sentence. No quotation marks. "
        "Respond with JSON only."
    )
    user_msg = f"""User profile:
Dream: {req.profile.dream}
Obstacle: {req.profile.obstacle}
Streak: {req.streak} days

Write ONE personalised motivational sentence for today.
Return JSON: {{"quote": "..."}}"""
    data = await _ask_for_json(system, user_msg)
    return DailyQuoteResponse(quote=data.get("quote", "Keep going."))


@api_router.post("/ai/coach-chat", response_model=CoachChatResponse)
async def coach_chat(req: CoachChatRequest):
    session_id = req.session_id or str(uuid.uuid4())
    system = f"""You are LifeScript Coach — a supportive but direct life coach.
You are NOT a therapist and NOT a cheerleader. Be concrete, brief, and warm.
You know the user well:
{_profile_summary(req.profile)}
Current level: {req.level}
Current streak: {req.streak} days
Total XP: {req.total_xp}
Today's mission: {req.today_mission or "(not set)"}

Rules:
- Reply in 2-4 short sentences max.
- If they ask for emergency motivation, deliver fierce belief.
- If they ask why a mission matters, tie it to their dream.
- If they sound exhausted, suggest a rest day (don't break their streak).
- If they celebrate a win, validate it and raise the bar.
- Never say you are an AI.
Reply in plain text — no JSON, no markdown."""
    chat = _new_chat(system, session_id=session_id)
    # Replay the prior conversation so the model has context
    for msg in req.history[-12:]:
        if msg.role == "user":
            await chat.send_message(UserMessage(text=msg.content))
    reply = await chat.send_message(UserMessage(text=req.message))
    return CoachChatResponse(reply=reply.strip(), session_id=session_id)


@api_router.post("/ai/boss-battle", response_model=BossBattleResponse)
async def boss_battle(req: BossBattleRequest):
    system = (
        "You design 3-day intensive 'Boss Battle' challenges for a gamified "
        "life-coaching app. Each day must be hard but doable. Respond JSON only."
    )
    user_msg = f"""User profile:
{_profile_summary(req.profile)}
Boss cycle #: {req.cycle}

Generate a JSON object:
{{
  "title": "Epic boss battle name (max 5 words)",
  "narrative": "1-2 dramatic sentences setting the stakes, addressing the user by name",
  "days": [
    {{ "day": 1, "title": "...", "description": "...", "minutes": 30 }},
    {{ "day": 2, "title": "...", "description": "...", "minutes": 30 }},
    {{ "day": 3, "title": "...", "description": "...", "minutes": 30 }}
  ],
  "reward_badge": "Name of the rare badge unlocked on victory"
}}
Each day's minutes between 20-60. Tie progression to {req.profile.focus_area}."""
    data = await _ask_for_json(system, user_msg)
    try:
        days = [BossDay(**d) for d in data["days"][:3]]
        return BossBattleResponse(
            title=data["title"],
            narrative=data["narrative"],
            days=days,
            reward_badge=data.get("reward_badge", "Boss Slayer"),
        )
    except (KeyError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=502, detail=f"AI shape error: {exc}")


@api_router.post("/ai/regenerate-mission", response_model=Mission)
async def regenerate_mission(req: RegenerateMissionRequest):
    system = (
        "You generate replacement micro-missions for a gamified life-coach app. "
        "Respond with JSON only."
    )
    user_msg = f"""User profile:
{_profile_summary(req.profile)}
Previous mission they want replaced: "{req.previous_mission}"
Reason: {req.reason}

Generate ONE new mission as JSON:
{{
  "title": "...",
  "description": "...",
  "area": "Career|Finances|Health|Relationships|Mind|Skills",
  "minutes": 10,
  "icon": "rocket-outline"
}}
icon must be one of: rocket-outline, barbell-outline, book-outline, bulb-outline, cash-outline, heart-outline, people-outline, brush-outline, leaf-outline, flame-outline, compass-outline, sparkles-outline."""
    data = await _ask_for_json(system, user_msg)
    try:
        return Mission(**data)
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=502, detail=f"AI shape error: {exc}")


# ---------------------------------------------------------------------------
# App wiring
# ---------------------------------------------------------------------------
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
