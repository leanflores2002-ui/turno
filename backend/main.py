"""Compatibility module to run the app without installing the package.

Preferred during development:
  cd backend && PYTHONPATH=src uvicorn app.main:app --reload

This file injects `src` into sys.path so that running
  uvicorn backend.main:app --reload
also works.
"""
from __future__ import annotations

import os
import sys

CURRENT_DIR = os.path.dirname(__file__)
SRC_PATH = os.path.join(CURRENT_DIR, "src")
if SRC_PATH not in sys.path:
    sys.path.insert(0, SRC_PATH)

from app.main import app  # noqa: E402
