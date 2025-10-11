CREATE TYPE "rola_pouzivatela" AS ENUM (
  'student',
  'garant',
  'firma',
  'externy'
);

CREATE TYPE "stav_praxe" AS ENUM (
  'vytvorena',
  'potvrdena',
  'zamietnuta',
  'schvalena',
  'obhajena',
  'neobhajena'
);

CREATE TYPE "semester_typ" AS ENUM (
  'zimny',
  'letny'
);

CREATE TYPE "typ_dokumentu" AS ENUM (
  'dohoda',
  'vykaz'
);

CREATE TYPE "stav_dokumentu" AS ENUM (
  'nahrany',
  'potvrdeny',
  'zamietnuty'
);

CREATE TABLE "pouzivatelia" (
  "id" bigserial PRIMARY KEY,
  "rola" rola_pouzivatela NOT NULL,
  "email" varchar(255) UNIQUE NOT NULL,
  "alternativny_email" varchar(255),
  "heslo_hash" text,
  "meno" varchar(100),
  "priezvisko" varchar(100),
  "telefon" varchar(30),
  "adresa" text,
  "firma_id" bigint,
  "aktivny" boolean NOT NULL DEFAULT true,
  "email_overeny" boolean NOT NULL DEFAULT false,
  "musi_zmenit_heslo" boolean NOT NULL DEFAULT true,
  "posledne_prihlasenie" timestamptz,
  "vytvorene_at" timestamptz NOT NULL DEFAULT (now()),
  "zmenene_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE "student_profil" (
  "pouzivatel_id" bigint PRIMARY KEY,
  "studijny_program" varchar(150) NOT NULL
);

CREATE TABLE "garant_profil" (
  "pouzivatel_id" bigint PRIMARY KEY,
  "titul_pred" varchar(50),
  "titul_za" varchar(50),
  "pracovisko" varchar(150),
  "organizacia" varchar(150),
  "konzultacne_hodiny" varchar(150),
  "poznamka" text
);

CREATE TABLE "firmy" (
  "id" bigserial PRIMARY KEY,
  "nazov" varchar(255) UNIQUE NOT NULL,
  "adresa" text,
  "kontakt_meno" varchar(150),
  "kontakt_email" varchar(255),
  "kontakt_telefon" varchar(30),
  "vytvorene_at" timestamptz NOT NULL DEFAULT (now()),
  "zmenene_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE "praxe" (
  "id" bigserial PRIMARY KEY,
  "student_id" bigint NOT NULL,
  "firma_id" bigint NOT NULL,
  "garant_id" bigint,
  "rok" int NOT NULL,
  "semester" semester_typ NOT NULL,
  "datum_zaciatku" date NOT NULL,
  "datum_konca" date NOT NULL,
  "stav" stav_praxe NOT NULL DEFAULT 'vytvorena',
  "vytvorene_at" timestamptz NOT NULL DEFAULT (now()),
  "zmenene_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE "dokumenty" (
  "id" bigserial PRIMARY KEY,
  "prax_id" bigint NOT NULL,
  "typ_dokumentu" typ_dokumentu NOT NULL,
  "subor_url" text NOT NULL,
  "nahrane_pouzivatel_id" bigint NOT NULL,
  "stav_dokumentu" stav_dokumentu NOT NULL DEFAULT 'nahrany',
  "skontroloval_id" bigint,
  "skontrolovane_at" timestamptz,
  "vytvorene_at" timestamptz NOT NULL DEFAULT (now()),
  "zmenene_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE "historia_stavov_praxe" (
  "id" bigserial PRIMARY KEY,
  "prax_id" bigint NOT NULL,
  "stary_stav" stav_praxe,
  "novy_stav" stav_praxe NOT NULL,
  "zmenil_id" bigint,
  "poznamka" text,
  "zmena_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE "notifikacie" (
  "id" bigserial PRIMARY KEY,
  "prax_id" bigint,
  "prijemca_id" bigint,
  "prijemca_email" varchar(255),
  "predmet" varchar(255),
  "sablona_kluc" varchar(100),
  "payload_json" jsonb,
  "stav" varchar(20),
  "odoslane_at" timestamptz,
  "vytvorene_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE "aktivacne_tokeny" (
  "id" bigserial PRIMARY KEY,
  "pouzivatel_id" bigint NOT NULL,
  "token" uuid UNIQUE NOT NULL,
  "vyprsi_at" timestamptz NOT NULL,
  "pouzity" boolean NOT NULL DEFAULT false,
  "vytvorene_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE "reset_hesla_tokeny" (
  "id" bigserial PRIMARY KEY,
  "pouzivatel_id" bigint NOT NULL,
  "token" uuid UNIQUE NOT NULL,
  "vyprsi_at" timestamptz NOT NULL,
  "pouzity" boolean NOT NULL DEFAULT false,
  "vytvorene_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE INDEX "idx_pouzivatelia_rola_email" ON "pouzivatelia" ("rola", "email");

CREATE INDEX "idx_pouzivatelia_meno_priezvisko" ON "pouzivatelia" ("priezvisko", "meno");

CREATE INDEX "idx_pouzivatelia_firma" ON "pouzivatelia" ("firma_id");

CREATE INDEX "idx_student_profil_program" ON "student_profil" ("studijny_program");

CREATE INDEX "idx_garant_profil_pracovisko" ON "garant_profil" ("pracovisko");

CREATE INDEX "idx_firmy_nazov" ON "firmy" ("nazov");

CREATE INDEX "idx_praxe_filtre" ON "praxe" ("rok", "firma_id", "student_id", "semester", "stav");

CREATE INDEX "idx_praxe_garant" ON "praxe" ("garant_id");

CREATE UNIQUE INDEX "uniq_dokument_na_prax_a_typ" ON "dokumenty" ("prax_id", "typ_dokumentu");

CREATE INDEX "idx_historia_prax_zmena" ON "historia_stavov_praxe" ("prax_id", "zmena_at");

CREATE INDEX "idx_notifikacie_prax" ON "notifikacie" ("prax_id");

CREATE INDEX "idx_notifikacie_stav" ON "notifikacie" ("stav");

CREATE INDEX "idx_aktivacne_tokeny_user" ON "aktivacne_tokeny" ("pouzivatel_id", "pouzity", "vyprsi_at");

CREATE INDEX "idx_reset_tokeny_user" ON "reset_hesla_tokeny" ("pouzivatel_id", "pouzity", "vyprsi_at");

ALTER TABLE "student_profil" ADD FOREIGN KEY ("pouzivatel_id") REFERENCES "pouzivatelia" ("id");

ALTER TABLE "garant_profil" ADD FOREIGN KEY ("pouzivatel_id") REFERENCES "pouzivatelia" ("id");

ALTER TABLE "praxe" ADD FOREIGN KEY ("student_id") REFERENCES "pouzivatelia" ("id");

ALTER TABLE "praxe" ADD FOREIGN KEY ("firma_id") REFERENCES "firmy" ("id");

ALTER TABLE "praxe" ADD FOREIGN KEY ("garant_id") REFERENCES "pouzivatelia" ("id");

ALTER TABLE "dokumenty" ADD FOREIGN KEY ("prax_id") REFERENCES "praxe" ("id");

ALTER TABLE "dokumenty" ADD FOREIGN KEY ("nahrane_pouzivatel_id") REFERENCES "pouzivatelia" ("id");

ALTER TABLE "dokumenty" ADD FOREIGN KEY ("skontroloval_id") REFERENCES "pouzivatelia" ("id");

ALTER TABLE "historia_stavov_praxe" ADD FOREIGN KEY ("prax_id") REFERENCES "praxe" ("id");

ALTER TABLE "historia_stavov_praxe" ADD FOREIGN KEY ("zmenil_id") REFERENCES "pouzivatelia" ("id");

ALTER TABLE "notifikacie" ADD FOREIGN KEY ("prax_id") REFERENCES "praxe" ("id");

ALTER TABLE "notifikacie" ADD FOREIGN KEY ("prijemca_id") REFERENCES "pouzivatelia" ("id");

ALTER TABLE "aktivacne_tokeny" ADD FOREIGN KEY ("pouzivatel_id") REFERENCES "pouzivatelia" ("id");

ALTER TABLE "reset_hesla_tokeny" ADD FOREIGN KEY ("pouzivatel_id") REFERENCES "pouzivatelia" ("id");
