"""LifeScript 2.0 backend — stateless Claude proxy with richer endpoints."""

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

app = FastAPI(title="LifeScript 2.0 API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("lifescript")

LIFE_AREAS = [
    "Career", "Finances", "Health", "Relationships",
    "Mind", "Skills", "Purpose", "Legacy",
]


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
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
    # New in 2.0 (optional for backward compat)
    proud_of_last_year: str = ""
    someday_thing: str = ""
    role_model: str = ""
    perfect_tuesday: str = ""
    one_change: str = ""


class Mission(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    area: str
    minutes: int
    icon: str


class InitialPlanRequest(BaseModel):
    profile: UserProfile
    day_index: int = 0
    completed_missions: List[str] = Field(default_factory=list)


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
    author: str = "Axiom"


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
    mode: Literal["hard", "support", "strategist", "philosopher", "silent"] = "support"
    recent_reflections: List[str] = Field(default_factory=list)
    recent_missions: List[str] = Field(default_factory=list)


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


class SideQuestRequest(BaseModel):
    profile: UserProfile
    neglected_areas: List[str]


class SideQuestResponse(BaseModel):
    missions: List[Mission]


class StealthMissionRequest(BaseModel):
    profile: UserProfile
    current_level: str


class DailyChallengeRequest(BaseModel):
    day: str  # YYYY-MM-DD (seeded for determinism — same answer for everyone that day)


class DailyChallengeResponse(BaseModel):
    title: str
    description: str
    icon: str
    participants: int


class HiddenPatternRequest(BaseModel):
    profile: UserProfile


class HiddenPatternResponse(BaseModel):
    title: str
    insight: str


class IdentityCardRequest(BaseModel):
    profile: UserProfile
    level: str
    streak: int
    total_missions: int
    top_areas: List[str]
    recent_reflections: List[str] = Field(default_factory=list)


class IdentityCardResponse(BaseModel):
    statement: str
    percent_progress: int


class WeeklyInsightRequest(BaseModel):
    profile: UserProfile
    area_scores: dict
    streak: int
    missions_last_7_days: int
    neglected_areas: List[str]


class WeeklyInsightResponse(BaseModel):
    diagnosis: str
    challenge: str
    quote: str


class ReflectionQRequest(BaseModel):
    profile: UserProfile
    mission_title: str
    area: str


class ReflectionQResponse(BaseModel):
    question: str


class RegenerateMissionRequest(BaseModel):
    profile: UserProfile
    previous_mission: str
    reason: Literal["too_easy", "too_hard", "not_interested", "rest_day"]


class ChapterMessageRequest(BaseModel):
    profile: UserProfile
    chapter: int  # 1..4


class ChapterMessageResponse(BaseModel):
    headline: str
    body: str
    cliffhanger: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _strip_json(raw: str) -> str:
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```[a-zA-Z]*\n", "", cleaned)
        cleaned = re.sub(r"```$", "", cleaned).strip()
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
    return LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id or str(uuid.uuid4()),
        system_message=system_message,
    ).with_model("anthropic", CLAUDE_MODEL)


async def _ask_for_json(system_message: str, user_text: str) -> dict:
    """JSON request with one retry on transient errors."""
    last_err: Optional[Exception] = None
    for _ in range(2):
        chat = _new_chat(system_message)
        try:
            response = await chat.send_message(UserMessage(text=user_text))
        except Exception as exc:  # noqa: BLE001
            last_err = exc
            continue
        try:
            return json.loads(_strip_json(response))
        except json.JSONDecodeError as exc:
            last_err = exc
            logger.error("Claude returned invalid JSON: %s", response)
    raise HTTPException(status_code=502, detail=f"AI request failed: {last_err}")


def _profile_summary(p: UserProfile) -> str:
    return (
        f"Name: {p.name}\nAge: {p.age}\nCountry: {p.country}\n"
        f"Biggest dream: {p.dream}\nBiggest obstacle: {p.obstacle}\n"
        f"Daily time: {p.hours_per_day} hours\nFocus area: {p.focus_area}\n"
        f"Income: {p.income}\nStyle: {p.style}\n"
        f"One-year vision: {p.one_year_vision}\n"
        f"Proud of last year: {p.proud_of_last_year}\n"
        f"Someday they keep saying: {p.someday_thing}\n"
        f"Role model: {p.role_model}\nPerfect Tuesday: {p.perfect_tuesday}\n"
        f"If one change possible: {p.one_change}\n"
    )


ICON_LIST = (
    "rocket-outline, barbell-outline, book-outline, bulb-outline, cash-outline, "
    "heart-outline, people-outline, brush-outline, leaf-outline, flame-outline, "
    "compass-outline, sparkles-outline, moon-outline, sunny-outline, pulse-outline, "
    "trophy-outline, ribbon-outline, telescope-outline, timer-outline"
)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@api_router.get("/")
async def root():
    return {"service": "lifescript", "version": "2.0", "model": CLAUDE_MODEL, "ok": True}


@api_router.get("/health")
async def health():
    return {"ok": True, "key_loaded": bool(EMERGENT_LLM_KEY)}


@api_router.post("/ai/initial-plan", response_model=InitialPlanResponse)
async def initial_plan(req: InitialPlanRequest):
    system = (
        "Você é o LifeScript, uma IA de Sistema Operacional de Vida que cria planos "
        "personalizados no estilo RPG. Calmo, direto, nunca pregador. Você apenas emite "
        "JSON válido — sem prosa, sem markdown. TODO texto dentro do JSON (titles, descriptions, "
        "welcome_quote, daily_steps) DEVE estar em português do Brasil (pt-BR)."
    )
    minutes = max(5, int(req.profile.hours_per_day * 60 / 4))
    user_msg = f"""USER PROFILE:
{_profile_summary(req.profile)}

Generate the first 7-day LifeScript plan as strict JSON:
{{
  "missions": [
    {{ "title": "...", "description": "...", "area": "Career|Finances|Health|Relationships|Mind|Skills|Purpose|Legacy", "minutes": {minutes}, "icon": "rocket-outline" }},
    ... 7 items, one per day, varied across life areas, biased toward {req.profile.focus_area}
  ],
  "weekly_quest": {{ "title": "...", "description": "A 7-day cumulative quest tied to the user's dream", "daily_steps": ["d1","d2","d3","d4","d5","d6","d7"] }},
  "welcome_quote": "One deeply personal sentence referencing their dream and obstacle without quoting them verbatim."
}}

Rules:
- Mission titles are short, punchy, ≤6 words.
- Each mission is 1-2 concrete sentences.
- Mix in Purpose and Legacy missions too — especially reference their one-year vision and what they want to leave behind.
- Icon MUST be from: {ICON_LIST}.
- JSON only."""
    data = await _ask_for_json(system, user_msg)
    try:
        missions = [Mission(**m) for m in data["missions"][:7]]
        wq = WeeklyQuest(**data["weekly_quest"])
        return InitialPlanResponse(
            missions=missions, weekly_quest=wq,
            welcome_quote=data.get("welcome_quote", ""),
        )
    except (KeyError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=502, detail=f"AI shape error: {exc}")


@api_router.post("/ai/daily-quote", response_model=DailyQuoteResponse)
async def daily_quote(req: DailyQuoteRequest):
    system = "Você escreve frases motivacionais profundamente pessoais em português do Brasil. Uma frase. Sem aspas. Apenas JSON."
    user_msg = f"""Profile:
Dream: {req.profile.dream}
Obstacle: {req.profile.obstacle}
Streak: {req.streak} days

Write ONE personalised motivational sentence for today.
Return: {{"quote": "..."}}"""
    data = await _ask_for_json(system, user_msg)
    return DailyQuoteResponse(quote=data.get("quote", "Keep going."))


MODE_STYLE = {
    "hard": "BRUTALLY HONEST mode. No comfort, only truth and action. Challenge their excuses directly.",
    "support": "SUPPORT mode. Warm, calm, but still direct. Meet them where they are.",
    "strategist": "STRATEGIST mode. Pure tactical advice. No emotion. Bullet points allowed.",
    "philosopher": "PHILOSOPHER mode. Ask deep questions that make them think. Often answer with a question.",
    "silent": "SILENT mode. Reply with at most 12 words. Let them fill the silence.",
}


@api_router.post("/ai/coach-chat", response_model=CoachChatResponse)
async def coach_chat(req: CoachChatRequest):
    session_id = req.session_id or str(uuid.uuid4())
    reflections = "\n".join(f"- {r}" for r in req.recent_reflections[-5:]) or "(none yet)"
    recent = "\n".join(f"- {m}" for m in req.recent_missions[-5:]) or "(none yet)"
    system = f"""Você é o Axiom — o coach de IA de elite do LifeScript.
Persona: direto, inteligente, às vezes com humor seco, profundamente atencioso, nunca genérico.
Nunca torcedor. Nunca terapeuta. Você se importa com ação.
Você conhece bem o usuário:
{_profile_summary(req.profile)}
Nível: {req.level}
Sequência: {req.streak} dias
XP total: {req.total_xp}
Missão de hoje: {req.today_mission or "(não definida)"}

Reflexões recentes:
{reflections}

Missões recentes:
{recent}

MODO: {MODE_STYLE[req.mode]}

Regras:
- Responda SEMPRE em português do Brasil (pt-BR).
- Responda em no máximo 2-4 frases curtas (modo silêncio: 12 palavras no máximo).
- Faça referência a itens passados específicos quando relevante — você lembra.
- Nunca diga que você é uma IA.
- Texto puro — sem JSON, sem markdown, sem bullets (exceto no modo Estrategista)."""
    chat = _new_chat(system, session_id=session_id)
    for m in req.history[-12:]:
        if m.role == "user":
            await chat.send_message(UserMessage(text=m.content))
    reply = await chat.send_message(UserMessage(text=req.message))
    return CoachChatResponse(reply=reply.strip(), session_id=session_id)


@api_router.post("/ai/boss-battle", response_model=BossBattleResponse)
async def boss_battle(req: BossBattleRequest):
    system = "Você desenha desafios 'Boss Battle' intensivos de 3 dias, em português do Brasil. Difícil mas factível. Apenas JSON."
    user_msg = f"""Profile:
{_profile_summary(req.profile)}
Boss cycle: {req.cycle}

Generate JSON:
{{
  "title": "Epic boss battle name (≤5 words)",
  "narrative": "1-2 dramatic sentences addressing the user by name",
  "days": [
    {{ "day": 1, "title": "...", "description": "...", "minutes": 30 }},
    {{ "day": 2, "title": "...", "description": "...", "minutes": 30 }},
    {{ "day": 3, "title": "...", "description": "...", "minutes": 30 }}
  ],
  "reward_badge": "Name of the rare badge"
}}
Minutes 20-60. Tie progression to {req.profile.focus_area}."""
    data = await _ask_for_json(system, user_msg)
    try:
        days = [BossDay(**d) for d in data["days"][:3]]
        return BossBattleResponse(
            title=data["title"], narrative=data["narrative"],
            days=days, reward_badge=data.get("reward_badge", "Boss Slayer"),
        )
    except (KeyError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=502, detail=f"AI shape error: {exc}")


@api_router.post("/ai/side-quests", response_model=SideQuestResponse)
async def side_quests(req: SideQuestRequest):
    system = "Você gera side quests pequenas em português do Brasil. Cada uma leva 10-15 minutos. Apenas JSON."
    neg = ", ".join(req.neglected_areas) or req.profile.focus_area
    user_msg = f"""Profile:
{_profile_summary(req.profile)}
Neglected areas: {neg}

Return: {{"missions": [
  {{"title":"...","description":"...","area":"{req.neglected_areas[0] if req.neglected_areas else req.profile.focus_area}","minutes":10,"icon":"rocket-outline"}},
  {{"title":"...","description":"...","area":"{req.neglected_areas[1] if len(req.neglected_areas) > 1 else req.profile.focus_area}","minutes":10,"icon":"sparkles-outline"}}
]}}
Icon from: {ICON_LIST}"""
    data = await _ask_for_json(system, user_msg)
    try:
        missions = [Mission(**m) for m in data.get("missions", [])[:2]]
        return SideQuestResponse(missions=missions)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"shape: {exc}")


@api_router.post("/ai/stealth-mission", response_model=Mission)
async def stealth_mission(req: StealthMissionRequest):
    system = "Você gera 'stealth missions' surpresa em português do Brasil. Ousadas, incomuns, 10-20 min. Apenas JSON."
    user_msg = f"""Profile:
{_profile_summary(req.profile)}
Current level: {req.current_level}

Return one JSON Mission:
{{"title":"...","description":"A surprising, slightly bold action. Explain in 1-2 sentences.","area":"Career|Finances|Health|Relationships|Mind|Skills|Purpose|Legacy","minutes":15,"icon":"sparkles-outline"}}
Icon from: {ICON_LIST}"""
    data = await _ask_for_json(system, user_msg)
    return Mission(**data)


_DAILY_CHALLENGE_SEED = {}


@api_router.post("/ai/daily-challenge", response_model=DailyChallengeResponse)
async def daily_challenge(req: DailyChallengeRequest):
    if req.day in _DAILY_CHALLENGE_SEED:
        return _DAILY_CHALLENGE_SEED[req.day]
    system = "Você escreve um desafio diário universal, em português do Brasil, que todos os usuários LifeScript enfrentam hoje. Apenas JSON."
    user_msg = f"""Today is {req.day}.

Write ONE universal daily challenge — short, actionable, 10 min. Return:
{{"title":"...","description":"1 sentence.","icon":"flame-outline"}}
Icon from: {ICON_LIST}"""
    data = await _ask_for_json(system, user_msg)
    # Deterministic fake participant count, feels real (6k-60k).
    seed_n = sum(ord(c) for c in req.day)
    participants = 6000 + (seed_n * 137) % 54000
    resp = DailyChallengeResponse(
        title=data["title"], description=data["description"],
        icon=data.get("icon", "flame-outline"), participants=participants,
    )
    _DAILY_CHALLENGE_SEED[req.day] = resp
    return resp


@api_router.post("/ai/hidden-pattern", response_model=HiddenPatternResponse)
async def hidden_pattern(req: HiddenPatternRequest):
    system = (
        "Você descobre UM padrão psicológico profundamente pessoal nas respostas de onboarding "
        "do usuário. Caloroso, preciso, como um terapeuta brilhante. Responda em português "
        "do Brasil. Apenas JSON."
    )
    user_msg = f"""Profile:
{_profile_summary(req.profile)}

Find ONE hidden pattern across their answers — something they likely haven't named themselves. Return:
{{"title":"A 2-4 word pattern name","insight":"2-3 sentences naming the pattern, how it shows up in their answers, and one gentle truth about it. Second-person. Never preachy."}}"""
    data = await _ask_for_json(system, user_msg)
    return HiddenPatternResponse(title=data["title"], insight=data["insight"])


@api_router.post("/ai/identity-card", response_model=IdentityCardResponse)
async def identity_card(req: IdentityCardRequest):
    system = "Você gera o 'Cartão de Identidade' do usuário — um resumo de quem ele está se tornando. Responda em português do Brasil. Apenas JSON."
    refl = "\n".join(f"- {r}" for r in req.recent_reflections[-5:]) or "(no reflections yet)"
    user_msg = f"""Profile:
{_profile_summary(req.profile)}
Level: {req.level} · Streak: {req.streak} · Total missions: {req.total_missions}
Top active areas: {", ".join(req.top_areas) or "(starting)"}
Recent reflections:
{refl}

Return:
{{"statement":"Based on the data, a 2-3 sentence statement starting with 'You are becoming someone who…' — specific, warm, insightful.","percent_progress":<0-100 integer representing how close they are to the life described on day 1>}}"""
    data = await _ask_for_json(system, user_msg)
    return IdentityCardResponse(
        statement=data["statement"],
        percent_progress=int(data.get("percent_progress", 10)),
    )


@api_router.post("/ai/weekly-insight", response_model=WeeklyInsightResponse)
async def weekly_insight(req: WeeklyInsightRequest):
    system = "Você é o Axiom. Você entrega um insight semanal em português do Brasil. Direto, específico, acionável. Apenas JSON."
    areas_str = ", ".join(f"{k}={v:.2f}" for k, v in req.area_scores.items())
    user_msg = f"""Profile:
{_profile_summary(req.profile)}
Area scores (0..1): {areas_str}
Streak: {req.streak}
Missions completed last 7 days: {req.missions_last_7_days}
Neglected areas: {", ".join(req.neglected_areas) or "none"}

Return:
{{"diagnosis":"2-3 sentences naming the pattern you see.","challenge":"A 1-sentence concrete challenge for next 7 days.","quote":"One sentence quote for the user this week."}}"""
    data = await _ask_for_json(system, user_msg)
    return WeeklyInsightResponse(
        diagnosis=data["diagnosis"], challenge=data["challenge"],
        quote=data.get("quote", ""),
    )


@api_router.post("/ai/reflection-question", response_model=ReflectionQResponse)
async def reflection_question(req: ReflectionQRequest):
    system = "Você escreve UMA pergunta curta de reflexão após alguém completar uma missão. Em português do Brasil. Apenas JSON."
    user_msg = f"""Profile:
{_profile_summary(req.profile)}
They just finished: "{req.mission_title}" (area: {req.area})

Write ONE open-ended reflection question — 1 sentence, short, meaningful, varied each time.
Return: {{"question":"..."}}"""
    data = await _ask_for_json(system, user_msg)
    return ReflectionQResponse(question=data.get("question", "What surprised you today?"))


@api_router.post("/ai/regenerate-mission", response_model=Mission)
async def regenerate_mission(req: RegenerateMissionRequest):
    system = "Você gera uma missão substituta em português do Brasil. Apenas JSON."
    user_msg = f"""Profile:
{_profile_summary(req.profile)}
Previous: "{req.previous_mission}"
Reason: {req.reason}

Return: {{"title":"...","description":"...","area":"Career|Finances|Health|Relationships|Mind|Skills|Purpose|Legacy","minutes":10,"icon":"rocket-outline"}}
Icon from: {ICON_LIST}"""
    data = await _ask_for_json(system, user_msg)
    return Mission(**data)


@api_router.post("/ai/chapter-message", response_model=ChapterMessageResponse)
async def chapter_message(req: ChapterMessageRequest):
    system = "Você escreve copy cinematográfica de fim de capítulo do LifeScript, em português do Brasil. Apenas JSON."
    stakes = {
        1: "Chapter 1 ending. Tomorrow's first 'real' challenge arrives. Dramatic but warm.",
        2: "Chapter 2 ending. Hint that the AI has uncovered a hidden pattern that will be revealed in Chapter 3.",
        3: "Chapter 3 ending. The free episodes end here — user has emotional investment. Tease Chapter 4 like a show finale.",
        4: "Chapter 4 ongoing — user is pro or being nudged to go pro. Make them feel powerful.",
    }[req.chapter]
    user_msg = f"""User: {req.profile.name}. Dream: {req.profile.dream}. Obstacle: {req.profile.obstacle}.
Chapter: {req.chapter}. Stakes: {stakes}

Return:
{{"headline":"Short cinematic headline (≤6 words)","body":"2-3 sentences addressed to them by name.","cliffhanger":"A single sentence that leaves them wanting more."}}"""
    data = await _ask_for_json(system, user_msg)
    return ChapterMessageResponse(
        headline=data["headline"], body=data["body"], cliffhanger=data["cliffhanger"],
    )


# ---------------------------------------------------------------------------
app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True, allow_origins=["*"],
    allow_methods=["*"], allow_headers=["*"],
)
