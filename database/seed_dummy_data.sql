-- Vymaž staré testovacie dáta (opatrne!)
TRUNCATE TABLE dokumenty, historia_stavov_praxe, notifikacie, praxe, student_profil, garant_profil, pouzivatelia, firmy RESTART IDENTITY CASCADE;

----------------------------------------------------
-- 🏢 FIRMY
----------------------------------------------------
INSERT INTO firmy (nazov, adresa, kontakt_meno, kontakt_email, kontakt_telefon)
VALUES 
('TechCorp s.r.o.', 'Nitra, Trieda A. Hlinku 10', 'Erik H.', 'info@techcorp.sk', '+421900123456'),
('CyberGuard s.r.o.', 'Bratislava, Dúbravská cesta 21', 'Lucia Kováčová', 'kontakt@cyberguard.sk', '+421944111222'),
('AI Labs Slovakia', 'Košice, Watsonova 15', 'Peter Horváth', 'peter@ailabs.sk', '+421905789654');

----------------------------------------------------
-- 👨‍🎓 ŠTUDENTI
----------------------------------------------------
INSERT INTO pouzivatelia (rola, email, meno, priezvisko, telefon, adresa, aktivny, email_overeny)
VALUES
('student', 'student1@student.ukf.sk', 'Peter', 'Novák', '+421900000111', 'Nitrianska 1, Nitra', true, true),
('student', 'student2@student.ukf.sk', 'Marek', 'Hruška', '+421900000222', 'Zoborská 5, Nitra', true, true),
('student', 'student3@student.ukf.sk', 'Simona', 'Bieliková', '+421900000333', 'Kmeťova 10, Nitra', true, true),
('student', 'student4@student.ukf.sk', 'Adam', 'Horvát', '+421900000444', 'Chrenovská 2, Nitra', true, true);

----------------------------------------------------
-- 🎓 GARANT
----------------------------------------------------
INSERT INTO pouzivatelia (rola, email, meno, priezvisko, telefon, adresa, aktivny, email_overeny)
VALUES 
('garant', 'garant@ukf.sk', 'Doc. Mária', 'Hudecová', '+421903555666', 'UKF Nitra, Trieda A. Hlinku 1', true, true);

-- garant id = 5
INSERT INTO garant_profil (pouzivatel_id, titul_pred, titul_za, pracovisko, organizacia, konzultacne_hodiny, poznamka)
VALUES (5, 'Doc.', 'PhD.', 'Fakulta prírodných vied a informatiky', 'UKF Nitra', 'Streda 10:00-12:00', 'Konzultácie po dohode.');

----------------------------------------------------
-- 📚 PROFILY ŠTUDENTOV
----------------------------------------------------
INSERT INTO student_profil (pouzivatel_id, studijny_program)
VALUES
(1, 'Aplikovaná informatika'),
(2, 'Informatika'),
(3, 'Kybernetika a robotika'),
(4, 'Aplikovaná informatika');

----------------------------------------------------
-- 💼 PRAXE
----------------------------------------------------
INSERT INTO praxe (student_id, firma_id, garant_id, rok, semester, datum_zaciatku, datum_konca, stav)
VALUES
(1, 1, 5, 2025, 'zimny', '2025-01-10', '2025-03-31', 'schvalena'),
(2, 1, 5, 2025, 'letny', '2025-04-01', '2025-06-30', 'potvrdena'),
(3, 2, 5, 2025, 'zimny', '2025-02-01', '2025-04-30', 'vytvorena'),
(4, 3, 5, 2025, 'letny', '2025-05-15', '2025-07-31', 'schvalena');

----------------------------------------------------
-- 📄 DOKUMENTY
----------------------------------------------------
INSERT INTO dokumenty (prax_id, typ_dokumentu, subor_url, nahrane_pouzivatel_id, stav_dokumentu)
VALUES
(1, 'dohoda', '/media/dohody/peter_novak.pdf', 1, 'potvrdeny'),
(1, 'vykaz', '/media/vykazy/peter_novak.pdf', 1, 'nahrany'),
(2, 'dohoda', '/media/dohody/marek_hruska.pdf', 2, 'nahrany'),
(3, 'vykaz', '/media/vykazy/simona_bielikova.pdf', 3, 'zamietnuty'),
(4, 'dohoda', '/media/dohody/adam_horvat.pdf', 4, 'potvrdeny');

----------------------------------------------------
-- 📬 NOTIFIKÁCIE (len pre ukážku)
----------------------------------------------------
INSERT INTO notifikacie (prax_id, prijemca_id, prijemca_email, predmet, sablona_kluc, stav)
VALUES
(1, 1, 'student1@student.ukf.sk', 'Prax schválená', 'prax_schvalena', 'odoslana'),
(2, 2, 'student2@student.ukf.sk', 'Prax potvrdená', 'prax_potvrdena', 'odoslana');

