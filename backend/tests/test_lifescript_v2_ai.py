"""LifeScript 2.0 — tests for the NEW v2 AI endpoints."""
import pytest


# --- Hidden pattern (Day 3 reveal) ----------------------------------------
class TestHiddenPattern:
    def test_returns_title_and_insight(self, api_client, base_url, sample_profile):
        r = api_client.post(
            f"{base_url}/api/ai/hidden-pattern",
            json={"profile": sample_profile}, timeout=90,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data["title"], str) and 2 <= len(data["title"]) <= 60
        assert isinstance(data["insight"], str) and len(data["insight"]) > 30


# --- Identity card --------------------------------------------------------
class TestIdentityCard:
    def test_returns_statement_and_progress(self, api_client, base_url, sample_profile):
        r = api_client.post(
            f"{base_url}/api/ai/identity-card",
            json={
                "profile": sample_profile, "level": "Apprentice",
                "streak": 5, "total_missions": 12,
                "top_areas": ["Career", "Mind"],
                "recent_reflections": [
                    "Felt focused after deep work",
                    "I shipped my landing draft today",
                ],
            }, timeout=90,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data["statement"], str) and len(data["statement"]) > 20
        assert isinstance(data["percent_progress"], int)
        assert 0 <= data["percent_progress"] <= 100


# --- Weekly insight -------------------------------------------------------
class TestWeeklyInsight:
    def test_returns_diagnosis_challenge_quote(self, api_client, base_url, sample_profile):
        r = api_client.post(
            f"{base_url}/api/ai/weekly-insight",
            json={
                "profile": sample_profile,
                "area_scores": {
                    "Career": 0.8, "Finances": 0.2, "Health": 0.4,
                    "Relationships": 0.5, "Mind": 0.7, "Skills": 0.6,
                    "Purpose": 0.3, "Legacy": 0.1,
                },
                "streak": 5, "missions_last_7_days": 6,
                "neglected_areas": ["Finances", "Legacy"],
            }, timeout=90,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        for k in ("diagnosis", "challenge", "quote"):
            assert isinstance(data[k], str) and len(data[k]) > 0
        assert len(data["diagnosis"]) > 20


# --- Reflection question --------------------------------------------------
class TestReflectionQuestion:
    def test_returns_short_question(self, api_client, base_url, sample_profile):
        r = api_client.post(
            f"{base_url}/api/ai/reflection-question",
            json={
                "profile": sample_profile,
                "mission_title": "Outline SaaS landing page",
                "area": "Career",
            }, timeout=60,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data["question"], str)
        assert "?" in data["question"]
        assert 5 <= len(data["question"]) <= 400


# --- Daily challenge ------------------------------------------------------
class TestDailyChallenge:
    def test_first_call_creates_challenge(self, api_client, base_url, valid_icons):
        r = api_client.post(
            f"{base_url}/api/ai/daily-challenge",
            json={"day": "2026-01-15"}, timeout=60,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["title"] and data["description"]
        assert data["icon"] in valid_icons
        assert isinstance(data["participants"], int)
        assert 6000 <= data["participants"] <= 60000

    def test_deterministic_same_day(self, api_client, base_url):
        first = api_client.post(
            f"{base_url}/api/ai/daily-challenge",
            json={"day": "2026-02-22"}, timeout=60,
        )
        assert first.status_code == 200
        a = first.json()
        second = api_client.post(
            f"{base_url}/api/ai/daily-challenge",
            json={"day": "2026-02-22"}, timeout=60,
        )
        assert second.status_code == 200
        b = second.json()
        # Title/desc/participants must match (cached/seeded)
        assert a["title"] == b["title"]
        assert a["description"] == b["description"]
        assert a["participants"] == b["participants"]


# --- Side quests ----------------------------------------------------------
class TestSideQuests:
    def test_returns_two_missions(self, api_client, base_url, sample_profile, valid_icons, valid_areas):
        r = api_client.post(
            f"{base_url}/api/ai/side-quests",
            json={
                "profile": sample_profile,
                "neglected_areas": ["Health", "Relationships"],
            }, timeout=90,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert "missions" in data and len(data["missions"]) == 2
        for m in data["missions"]:
            assert m["title"] and m["description"]
            assert m["area"] in valid_areas
            assert m["icon"] in valid_icons
            assert isinstance(m["minutes"], int) and 1 <= m["minutes"] <= 60


# --- Stealth mission ------------------------------------------------------
class TestStealthMission:
    def test_returns_single_mission(self, api_client, base_url, sample_profile, valid_icons, valid_areas):
        r = api_client.post(
            f"{base_url}/api/ai/stealth-mission",
            json={"profile": sample_profile, "current_level": "Apprentice"},
            timeout=60,
        )
        assert r.status_code == 200, r.text
        m = r.json()
        assert m["title"] and m["description"]
        assert m["area"] in valid_areas
        assert m["icon"] in valid_icons
        assert isinstance(m["minutes"], int)


# --- Chapter message (1..4) ----------------------------------------------
class TestChapterMessage:
    @pytest.mark.parametrize("chapter", [1, 2, 3, 4])
    def test_chapter_returns_required_fields(self, api_client, base_url, sample_profile, chapter):
        r = api_client.post(
            f"{base_url}/api/ai/chapter-message",
            json={"profile": sample_profile, "chapter": chapter},
            timeout=60,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        for k in ("headline", "body", "cliffhanger"):
            assert isinstance(data[k], str) and len(data[k]) > 0
        assert len(data["headline"].split()) <= 12  # cinematic, short
