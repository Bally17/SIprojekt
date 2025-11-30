from django.db import migrations


SQL = """
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'forma_praxe') THEN
        CREATE TYPE forma_praxe AS ENUM ('dohoda', 'zamestnanie');
    END IF;
END
$$;
"""


class Migration(migrations.Migration):
    initial = True
    dependencies = []

    operations = [
        migrations.RunSQL(SQL, reverse_sql=""),
    ]
