from django.db import migrations


SQL = """
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'typ_dokumentu') THEN
        CREATE TYPE typ_dokumentu AS ENUM ('dohoda', 'vykaz', 'zmluva', 'faktura', 'zamestnanie');
    ELSE
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'typ_dokumentu' AND e.enumlabel = 'zmluva'
        ) THEN
            ALTER TYPE typ_dokumentu ADD VALUE 'zmluva';
        END IF;
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'typ_dokumentu' AND e.enumlabel = 'faktura'
        ) THEN
            ALTER TYPE typ_dokumentu ADD VALUE 'faktura';
        END IF;
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'typ_dokumentu' AND e.enumlabel = 'zamestnanie'
        ) THEN
            ALTER TYPE typ_dokumentu ADD VALUE 'zamestnanie';
        END IF;
    END IF;
END
$$;

-- umožní viac faktúr na jednu prax
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'uniq_dokument_na_prax_a_typ') THEN
        DROP INDEX "uniq_dokument_na_prax_a_typ";
    END IF;
END
$$;
"""


class Migration(migrations.Migration):
    dependencies = [
        ("documents", "0002_add_zmluva_enum"),
    ]

    operations = [
        migrations.RunSQL(SQL, reverse_sql=""),
    ]
