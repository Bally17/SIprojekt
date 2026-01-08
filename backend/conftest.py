import psycopg2
from psycopg2 import sql
import pytest
from django.conf import settings
from django.test.utils import setup_databases, teardown_databases


@pytest.fixture(scope="session")
def django_db_setup(django_db_blocker):
    db = settings.DATABASES["default"]
    test_name = db.get("TEST", {}).get("NAME")
    template_name = db.get("NAME")
    if not test_name or not template_name:
        raise RuntimeError("Missing database settings for test setup.")

    with django_db_blocker.unblock():
        conn = psycopg2.connect(
            dbname="postgres",
            user=db.get("USER"),
            password=db.get("PASSWORD"),
            host=db.get("HOST"),
            port=db.get("PORT"),
        )
        conn.autocommit = True
        with conn.cursor() as cur:
            cur.execute(
                "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = %s",
                (test_name,),
            )
            cur.execute(f'DROP DATABASE IF EXISTS "{test_name}"')
            cur.execute(f'CREATE DATABASE "{test_name}" TEMPLATE "{template_name}"')
        conn.close()

        db_cfg = setup_databases(verbosity=1, interactive=False, keepdb=True)

        clean_conn = psycopg2.connect(
            dbname=test_name,
            user=db.get("USER"),
            password=db.get("PASSWORD"),
            host=db.get("HOST"),
            port=db.get("PORT"),
        )
        clean_conn.autocommit = True
        with clean_conn.cursor() as cur:
            cur.execute(
                "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
            )
            tables = [row[0] for row in cur.fetchall() if row[0] != "django_migrations"]
            if tables:
                truncate_sql = sql.SQL("TRUNCATE {} RESTART IDENTITY CASCADE").format(
                    sql.SQL(", ").join(sql.Identifier(t) for t in tables)
                )
                cur.execute(truncate_sql)
        clean_conn.close()
        yield
        teardown_databases(db_cfg, verbosity=1)
