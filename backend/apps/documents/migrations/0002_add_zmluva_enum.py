from django.db import migrations


SQL = """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'typ_dokumentu' AND e.enumlabel = 'zmluva'
    ) THEN
        ALTER TYPE typ_dokumentu ADD VALUE 'zmluva';
    END IF;
END
$$;
"""


class Migration(migrations.Migration):
    dependencies = []

    operations = [
        migrations.RunSQL(SQL, reverse_sql=""),
    ]
