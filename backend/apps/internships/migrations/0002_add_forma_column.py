from django.db import migrations


SQL = """
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'forma_praxe') THEN
        CREATE TYPE forma_praxe AS ENUM ('dohoda', 'zamestnanie');
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'praxe' AND column_name = 'forma'
    ) THEN
        ALTER TABLE praxe ADD COLUMN forma forma_praxe NOT NULL DEFAULT 'dohoda';
    END IF;
END
$$;
"""


class Migration(migrations.Migration):
    dependencies = [
        ("internships", "0001_create_forma_enum"),
    ]

    operations = [
        migrations.RunSQL(SQL, reverse_sql=""),
    ]
