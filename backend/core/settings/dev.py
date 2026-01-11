"""Development settings overrides for Django."""
import os

from dotenv import load_dotenv

load_dotenv()
os.environ.setdefault('DJANGO_ENV', 'development')

from .base import *  # noqa: F401,F403
