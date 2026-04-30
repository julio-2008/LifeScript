"""Shared fixtures for LifeScript 2.0 backend tests."""
import os
from pathlib import Path

import pytest
import requests
from dotenv import load_dotenv

# Load frontend .env to get the public backend URL
load_dotenv(Path(__file__).resolve().parents[2] / "frontend" / ".env")

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/")


@pytest.fixture(scope="session")
def base_url():
    assert BASE_URL, "EXPO_PUBLIC_BACKEND_URL must be set in frontend/.env"
    return BASE_URL


@pytest.fixture(scope="session")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def sample_profile():
    """15-question LifeScript 2.0 profile."""
    return {
        "name": "Aria",
        "age": 28,
        "country": "India",
        "dream": "Launch a profitable SaaS that helps creators earn a living",
        "obstacle": "I procrastinate and doubt my ideas before shipping",
        "hours_per_day": 2.0,
        "focus_area": "Career",
        "income": "Medium",
        "style": "Fast wins",
        "one_year_vision": "Earn $5k MRR and quit my day job",
        "proud_of_last_year": "Shipped my first paid product to 30 users",
        "someday_thing": "Write a book about creator economics",
        "role_model": "Naval Ravikant",
        "perfect_tuesday": "Deep work morning, gym, evening with family",
        "one_change": "Stop second-guessing every idea before launch",
    }


VALID_ICONS = {
    "rocket-outline", "barbell-outline", "book-outline", "bulb-outline",
    "cash-outline", "heart-outline", "people-outline", "brush-outline",
    "leaf-outline", "flame-outline", "compass-outline", "sparkles-outline",
    "moon-outline", "sunny-outline", "pulse-outline", "trophy-outline",
    "ribbon-outline", "telescope-outline", "timer-outline",
}

VALID_AREAS = {
    "Career", "Finances", "Health", "Relationships",
    "Mind", "Skills", "Purpose", "Legacy",
}


@pytest.fixture(scope="session")
def valid_icons():
    return VALID_ICONS


@pytest.fixture(scope="session")
def valid_areas():
    return VALID_AREAS
