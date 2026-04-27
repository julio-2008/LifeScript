"""LifeScript backend API tests covering health and AI proxy endpoints."""
import pytest


# --- Health -----------------------------------------------------------------
class TestHealth:
    def test_health_200_key_loaded(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/health", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["ok"] is True
        assert data["key_loaded"] is True

    def test_root_200(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["ok"] is True
        assert data["service"] == "lifescript"
        assert data["model"].startswith("claude-sonnet-4-5")


# --- Initial plan -----------------------------------------------------------
class TestInitialPlan:
    @pytest.fixture(scope="class")
    def plan(self, api_client, base_url, sample_profile):
        payload = {"profile": sample_profile, "day_index": 0, "completed_missions": []}
        r = api_client.post(f"{base_url}/api/ai/initial-plan", json=payload, timeout=90)
        assert r.status_code == 200, r.text
        return r.json()

    def test_has_seven_missions(self, plan):
        assert "missions" in plan
        assert len(plan["missions"]) == 7

    def test_mission_fields_and_icons(self, plan, valid_icons, valid_areas):
        for m in plan["missions"]:
            for key in ("id", "title", "description", "area", "minutes", "icon"):
                assert key in m, f"missing key {key} in {m}"
            assert m["icon"] in valid_icons, f"Invalid icon: {m['icon']}"
            assert m["area"] in valid_areas, f"Invalid area: {m['area']}"
            assert isinstance(m["minutes"], int)
            assert 1 <= m["minutes"] <= 120

    def test_weekly_quest(self, plan):
        wq = plan["weekly_quest"]
        assert wq["title"] and wq["description"]
        assert len(wq["daily_steps"]) == 7

    def test_welcome_quote(self, plan):
        q = plan.get("welcome_quote", "")
        assert isinstance(q, str) and len(q) > 10


# --- Daily quote ------------------------------------------------------------
class TestDailyQuote:
    def test_returns_quote(self, api_client, base_url, sample_profile):
        payload = {"profile": sample_profile, "streak": 5}
        r = api_client.post(f"{base_url}/api/ai/daily-quote", json=payload, timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data["quote"], str) and len(data["quote"]) > 5
        assert "author" in data


# --- Coach chat -------------------------------------------------------------
class TestCoachChat:
    def test_single_turn(self, api_client, base_url, sample_profile):
        payload = {
            "profile": sample_profile,
            "level": "Beginner",
            "streak": 1,
            "total_xp": 50,
            "today_mission": "Outline SaaS landing page",
            "history": [],
            "message": "I feel stuck today. Help?",
        }
        r = api_client.post(f"{base_url}/api/ai/coach-chat", json=payload, timeout=90)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["reply"].strip()
        assert data["session_id"]

    def test_multi_turn_session_id_honored(self, api_client, base_url, sample_profile):
        sid = "test-session-123"
        payload = {
            "profile": sample_profile,
            "level": "Beginner",
            "streak": 2,
            "total_xp": 120,
            "history": [
                {"role": "user", "content": "My name is Aria."},
                {"role": "assistant", "content": "Got it, Aria."},
            ],
            "message": "What should I do next?",
            "session_id": sid,
        }
        r = api_client.post(f"{base_url}/api/ai/coach-chat", json=payload, timeout=90)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["session_id"] == sid
        assert data["reply"].strip()


# --- Boss battle ------------------------------------------------------------
class TestBossBattle:
    def test_three_day_battle(self, api_client, base_url, sample_profile):
        payload = {"profile": sample_profile, "cycle": 1}
        r = api_client.post(f"{base_url}/api/ai/boss-battle", json=payload, timeout=90)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["title"] and data["narrative"]
        assert len(data["days"]) == 3
        for d in data["days"]:
            assert d["title"] and d["description"]
            assert isinstance(d["minutes"], int)
            assert 10 <= d["minutes"] <= 90
        assert data["reward_badge"]


# --- Regenerate mission -----------------------------------------------------
class TestRegenerateMission:
    def test_single_mission(self, api_client, base_url, sample_profile, valid_icons, valid_areas):
        payload = {
            "profile": sample_profile,
            "previous_mission": "Write 200 words about your dream SaaS",
            "reason": "too_easy",
        }
        r = api_client.post(f"{base_url}/api/ai/regenerate-mission", json=payload, timeout=60)
        assert r.status_code == 200, r.text
        m = r.json()
        assert m["icon"] in valid_icons
        assert m["area"] in valid_areas
        assert m["title"] and m["description"]
        assert isinstance(m["minutes"], int)
