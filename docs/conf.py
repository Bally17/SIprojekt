"""Sphinx configuration for SIprojekt documentation."""
from __future__ import annotations

import os
import sys

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
sys.path.insert(0, BACKEND_DIR)
sys.path.insert(0, ROOT_DIR)

project = "SIprojekt Backend Documentation"
author = "SIprojekt Team"
release = "0.1"

extensions = [
    "sphinx.ext.autodoc",
    "sphinx.ext.autosummary",
    "sphinx.ext.napoleon",
]

autosummary_generate = True
autodoc_default_options = {"members": True, "undoc-members": True}

autodoc_mock_imports = [
    "django",
    "django.conf",
    "django.conf.settings",
    "django.core",
    "django.core.cache",
    "django.core.exceptions",
    "django.db",
    "django.db.models",
    "django.http",
    "django.utils",
    "django.contrib",
    "django.contrib.auth",
    "django.contrib.auth.hashers",
    "rest_framework",
    "rest_framework.permissions",
    "rest_framework.serializers",
    "rest_framework.viewsets",
    "drf_yasg",
    "drf_yasg.utils",
    "dotenv",
    "boto3",
    "botocore",
    "reportlab",
    "PyPDF2",
    "requests",
]

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

templates_path = ["_templates"]
exclude_patterns: list[str] = ["_build"]

html_theme = "alabaster"
html_static_path = ["_static"]
