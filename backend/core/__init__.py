import os
import sys

# Pridajte apps directory do Python path
APPS_DIR = os.path.join(os.path.dirname(__file__), '..', 'apps')
sys.path.insert(0, APPS_DIR)
