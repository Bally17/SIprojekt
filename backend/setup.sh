#!/bin/bash

# Vytvorenie virtuálneho prostredia
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows

# Inštalácia Django a závislostí
pip install --upgrade pip
pip install django djangorestframework djangorestframework-simplejwt
pip install django-cors-headers python-dotenv psycopg2-binary
pip install pillow python-magic pdfkit django-filter
pip install celery redis django-celery-results

# Vytvorenie Django projektu
django-admin startproject core .
