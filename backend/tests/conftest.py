"""Shared fixtures for LifeScript backend tests."""
import os
import pytest
import requests
from dotenv import load_dotenv
from pathlib import Path

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
    }


VALID_ICONS = {
    "rocket-outline",
    "barbell-outline",
    "book-outline",
    "bulb-outline",
    "cash-outline",
    "heart-outline",
    "people-outline",
    "brush-outline",
    "leaf-outline",
    "flame-outline",
    "compass-outline",
    "sparkles-outline",
}

VALID_AREAS = {"Career", "Finances", "Health", "Relationships", "Mind", "Skills"}


@pytest.fixture(scope="session")
def valid_icons():
    return VALID_ICONS


@pytest.fixture(scope="session")
def valid_areas():
    return VALID_AREAS
