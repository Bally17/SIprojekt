# Databázová štruktúra appky
Tento priečinok obsahuje SQL skripty pre PostgreSQL:
- `schema_postgres.sql` – vytvára všetky tabuľky, enumy a indexy
- `triggers.sql` – obsahuje základné triggery a pravidlá(kontroly vložených udajov a pod.)

Vytvorenie db v bashi alebo cez adminer potom klikačka:
psql -U postgres -c "CREATE DATABASE praxy_db;"

Na import použite Adminer alebo psql v bashi:
psql -U postgres -d praxy_db -f database/schema_postgres.sql
psql -U postgres -d praxy_db -f database/triggers.sql
