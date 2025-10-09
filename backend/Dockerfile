# Použi oficiálny Python image
FROM python:3.13-slim

# Nastav pracovný adresár v kontajneri
WORKDIR /app

# Skopíruj requirements, ak ich máš
COPY requirements.txt ./

# Nainštaluj závislosti (vrátane Django)
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Skopíruj celý projekt do kontajnera
COPY . .

# Otvor port 8000 (Django default)
EXPOSE 8000

# Spusti Django server
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
