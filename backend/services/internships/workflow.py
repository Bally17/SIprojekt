"""Internship workflow operations (no HTTP dependencies)."""
from django.db import IntegrityError, transaction

from apps.companies.models import Firma
from apps.documents.models import Dokument
from apps.internships.models import HistoriaStavovPraxe, Prax
from apps.users.models import User
from services.documents.generation import generate_dohoda_pdf
from services.internships.assignment import pick_garant


def create_internship(user: User, data: dict) -> dict:
    """Create a new internship for a student."""
    if user.rola != User.ROLE_STUDENT:
        return {"ok": False, "status": 403, "data": {"error": "Len študent môže vytvoriť prax."}}

    firma_id = data["firma_id"]
    rok = data["rok"]
    semester = data["semester"]
    datum_zaciatku = data["datum_zaciatku"]
    datum_konca = data["datum_konca"]
    forma = data.get("forma", Prax.FORMA_DOHODA)

    firma = Firma.objects.get(id=firma_id)

    with transaction.atomic():
        garant = pick_garant()

        prax = Prax.objects.create(
            student_id=user.id,
            firma_id=firma.id,
            garant=garant,
            rok=rok,
            semester=semester,
            datum_zaciatku=datum_zaciatku,
            datum_konca=datum_konca,
            forma=forma,
            stav=Prax.STAV_VYTVORENA,
        )

        HistoriaStavovPraxe.objects.create(
            prax_id=prax.id,
            stary_stav=None,
            novy_stav=Prax.STAV_VYTVORENA,
            zmenil_id=user.id,
            poznamka="Prax bola vytvorená študentom.",
        )

        if forma == Prax.FORMA_ZAMESTNANIE:
            Dokument.objects.get_or_create(
                prax=prax,
                typ_dokumentu=Dokument.TYP_ZAMESTNANIE,
                defaults={
                    "nahrane_pouzivatel": user,
                    "subor_url": "",
                    "stav_dokumentu": Dokument.STAV_NAHRANY,
                },
            )
            try:
                for _ in range(3):
                    Dokument.objects.create(
                        prax=prax,
                        typ_dokumentu=Dokument.TYP_FAKTURA,
                        nahrane_pouzivatel=user,
                        subor_url="",
                        stav_dokumentu=Dokument.STAV_NAHRANY,
                    )
            except IntegrityError:
                Dokument.objects.get_or_create(
                    prax=prax,
                    typ_dokumentu=Dokument.TYP_FAKTURA,
                    defaults={
                        "nahrane_pouzivatel": user,
                        "subor_url": "",
                        "stav_dokumentu": Dokument.STAV_NAHRANY,
                    },
                )
        else:
            document, _ = Dokument.objects.get_or_create(
                prax=prax,
                typ_dokumentu=Dokument.TYP_DOHODA,
                defaults={
                    "nahrane_pouzivatel": user,
                    "subor_url": "",
                },
            )

            pdf_buffer, relative_path = generate_dohoda_pdf(prax)
            document.subor_url = relative_path
            document.stav_dokumentu = Dokument.STAV_POTVRDENY
            document.save(update_fields=["subor_url", "stav_dokumentu"])
            pdf_buffer.seek(0)

            Dokument.objects.get_or_create(
                prax=prax,
                typ_dokumentu=Dokument.TYP_ZMLUVA,
                defaults={
                    "nahrane_pouzivatel": user,
                    "subor_url": "",
                    "stav_dokumentu": Dokument.STAV_NAHRANY,
                },
            )
        Dokument.objects.get_or_create(
            prax=prax,
            typ_dokumentu=Dokument.TYP_VYKAZ,
            defaults={
                "nahrane_pouzivatel": user,
                "subor_url": "",
                "stav_dokumentu": Dokument.STAV_NAHRANY,
            },
        )

    return {"ok": True, "status": 201, "prax": prax}


def company_confirm_internship(user: User, prax_id: int) -> dict:
    """Confirm an internship as a company (status to potvrdena)."""
    if user.rola != User.ROLE_FIRMA:
        return {"ok": False, "status": 403, "data": {"error": "Len firma môže potvrdiť prax."}}

    if not user.firma_id:
        return {"ok": False, "status": 400, "data": {"error": "Firma nemá priradené ID (firma_id)."}}

    try:
        prax = Prax.objects.get(id=prax_id, firma_id=user.firma_id)
    except Prax.DoesNotExist:
        return {"ok": False, "status": 404, "data": {"error": "Prax neexistuje alebo nepatrí tejto firme."}}

    if prax.stav.lower() != Prax.STAV_VYTVORENA:
        return {"ok": False, "status": 400, "data": {"error": "Prax už nie je v stave 'vytvorena'."}}

    with transaction.atomic():
        prax.stav = Prax.STAV_POTVRDENA
        prax.save()

        HistoriaStavovPraxe.objects.create(
            prax=prax,
            stary_stav=Prax.STAV_VYTVORENA,
            novy_stav=Prax.STAV_POTVRDENA,
            zmenil_id=user.id,
            poznamka="Prax bola potvrdená firmou.",
        )

    return {"ok": True, "status": 200, "prax": prax}


def company_reject_internship(user: User, prax_id: int) -> dict:
    """Reject an internship as a company (status to zamietnuta)."""
    if user.rola != User.ROLE_FIRMA:
        return {"ok": False, "status": 403, "data": {"error": "Len firma môže zamietnuť prax."}}

    if not user.firma_id:
        return {"ok": False, "status": 400, "data": {"error": "Firma nemá priradené ID (firma_id)."}}

    try:
        prax = Prax.objects.get(id=prax_id, firma_id=user.firma_id)
    except Prax.DoesNotExist:
        return {"ok": False, "status": 404, "data": {"error": "Prax neexistuje alebo nepatrí tejto firme."}}

    if prax.stav.lower() != Prax.STAV_VYTVORENA:
        return {"ok": False, "status": 400, "data": {"error": "Prax už nie je v stave 'vytvorena'."}}

    with transaction.atomic():
        prax.stav = Prax.STAV_ZAMIETNUTA
        prax.save()

        HistoriaStavovPraxe.objects.create(
            prax=prax,
            stary_stav=Prax.STAV_VYTVORENA,
            novy_stav=Prax.STAV_ZAMIETNUTA,
            zmenil_id=user.id,
            poznamka="Prax bola zamietnutá firmou.",
        )

    return {"ok": True, "status": 200, "prax": prax}


def external_mark_defended(user: User, data: dict) -> dict:
    """Mark an internship as defended for external integrations."""
    if user.rola not in (User.ROLE_EXTERNY, User.ROLE_GARANT):
        return {
            "ok": False,
            "status": 403,
            "data": {"error": "Prístup povolený len pre externých integrátorov."},
        }

    prax_id = data["prax_id"]
    reference = data.get("external_reference")
    note = data.get("note")

    try:
        with transaction.atomic():
            prax = Prax.objects.select_for_update().get(id=prax_id)

            if (prax.stav or "").lower() != Prax.STAV_SCHVALENA:
                return {
                    "ok": False,
                    "status": 400,
                    "data": {"error": "Prax je možné obhájiť len zo stavu 'schvalena'."},
                }

            custom_note = note or "Externý systém označil prax ako obhájenú."
            if reference:
                custom_note = f"{custom_note} Referencia: {reference}"

            prax._changed_by = user
            prax._status_change_note = custom_note
            prax.stav = Prax.STAV_OBHAJENA
            prax.save()

    except Prax.DoesNotExist:
        return {"ok": False, "status": 404, "data": {"error": "Prax so zadaným ID neexistuje."}}

    return {"ok": True, "status": 200, "prax": prax}
