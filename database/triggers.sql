CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- pre gen_random_uuid()

/* 1) zaklady pri registrácii používateľa
    - firma: aktivny=false, email_overeny=false
    - nové účty: musi_zmenit_heslo=true
*/
CREATE OR REPLACE FUNCTION pouzivatel_insert_defaults() RETURNS trigger AS $$
BEGIN
  IF NEW.rola = 'firma' THEN
    NEW.aktivny := false;
    NEW.email_overeny := false;
  END IF;

  IF NEW.musi_zmenit_heslo IS NULL THEN
    NEW.musi_zmenit_heslo := true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pouzivatel_insert_defaults ON pouzivatelia;
CREATE TRIGGER trg_pouzivatel_insert_defaults
BEFORE INSERT ON pouzivatelia
FOR EACH ROW EXECUTE FUNCTION pouzivatel_insert_defaults();


/* 2) generacia aktivacneho tokenu (48h) po registracii firmy
      - backend po kliknutí nastaví aktivny=true, email_overeny=true a token označí pouzity=true
*/
CREATE OR REPLACE FUNCTION create_activation_token_on_insert() RETURNS trigger AS $$
BEGIN
  IF NEW.rola = 'firma' THEN
    INSERT INTO aktivacne_tokeny (pouzivatel_id, token, vyprsi_at)
    VALUES (NEW.id, gen_random_uuid(), now() + interval '48 hours');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_create_activation_token ON pouzivatelia;
CREATE TRIGGER trg_create_activation_token
AFTER INSERT ON pouzivatelia
FOR EACH ROW EXECUTE FUNCTION create_activation_token_on_insert();


/* 3) garant bezpečnosť: garant_id na praxi musí patriť používateľovi s rolou 'garant'
*/
CREATE OR REPLACE FUNCTION check_garant_role() RETURNS trigger AS $$
BEGIN
  IF NEW.garant_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pouzivatelia p
       WHERE p.id = NEW.garant_id AND p.rola = 'garant'
     ) THEN
    RAISE EXCEPTION 'Zadaný garant (%) nemá rolu "garant"', NEW.garant_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_praxe_check_garant ON praxe;
CREATE TRIGGER trg_praxe_check_garant
BEFORE INSERT OR UPDATE OF garant_id ON praxe
FOR EACH ROW EXECUTE FUNCTION check_garant_role();


/* 4) kontrola dátumov praxe: koniec nesmie byť pred začiatkom
*/
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'praxe_datumy_check'
  ) THEN
    ALTER TABLE praxe
      ADD CONSTRAINT praxe_datumy_check
      CHECK (datum_konca >= datum_zaciatku);
  END IF;
END$$;