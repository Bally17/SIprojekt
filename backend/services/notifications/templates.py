"""Notification message templates."""


def name_of_user(user) -> str:
    """Return display name for the user if available."""
    if not user:
        return ""
    meno = getattr(user, "meno", "") or ""
    priezvisko = getattr(user, "priezvisko", "") or ""
    return f"{meno} {priezvisko}".strip()


def _greeting_for_person(name: str) -> str:
    """Return a polite greeting line for the given name."""
    return f"Dobrý deň{(' ' + name) if name else ''},"


def document_uploaded_company_subject() -> str:
    return "Nový dokument na schválenie"


def document_uploaded_company_body(*, firma_name: str, student_name: str, document_type: str) -> str:
    return (
        f"{_greeting_for_person(firma_name)}\n\n"
        f"Študent {student_name} nahrál nový dokument typu **{document_type}**.\n"
        f"Prosíme o jeho skontrolovanie.\n\n"
        f"S pozdravom\nSystém odborných praxí"
    )


def document_uploaded_garant_subject() -> str:
    return "Študent nahrál nový dokument"


def document_uploaded_garant_body(*, garant_name: str, student_name: str, document_type: str) -> str:
    return (
        f"{_greeting_for_person(garant_name)}\n\n"
        f"Študent {student_name} nahrál nový dokument typu **{document_type}**.\n"
        f"Môžete ho skontrolovať po schválení firmou.\n\n"
        f"S pozdravom\nSystém odborných praxí"
    )


def document_approved_by_company_subject() -> str:
    return "Dokument bol schválený firmou"


def document_approved_by_company_body(*, student_name: str, document_type: str) -> str:
    return (
        f"{_greeting_for_person(student_name)}\n\n"
        f"Firma schválila Váš dokument typu **{document_type}**.\n\n"
        f"S pozdravom\nSystém odborných praxí"
    )


def document_approved_by_company_garant_body(
    *, garant_name: str, student_name: str, document_type: str
) -> str:
    return (
        f"{_greeting_for_person(garant_name)}\n\n"
        f"Firma schválila dokument študenta **{student_name}** typu **{document_type}**.\n\n"
        f"S pozdravom\nSystém odborných praxí"
    )


def document_rejected_by_company_subject() -> str:
    return "Dokument bol zamietnutý firmou"


def document_rejected_by_company_body(
    *, student_name: str, document_type: str, reason: str | None
) -> str:
    return (
        f"{_greeting_for_person(student_name)}\n\n"
        f"Firma zamietla Váš dokument typu **{document_type}**.\n"
        f"Dôvod zamietnutia: {reason}\n\n"
        f"Prosíme o opätovné nahratie opraveného dokumentu.\n\n"
        f"S pozdravom\nSystém odborných praxí"
    )


def document_soft_rejected_by_company_subject() -> str:
    return "Pripomienky k dokumentu (firma)"


def document_soft_rejected_by_company_body(
    *, student_name: str, document_type: str, reason: str
) -> str:
    return (
        f"{_greeting_for_person(student_name)}\n\n"
        f"Firma má pripomienky k Vášmu dokumentu typu **{document_type}**.\n"
        f"Dôvod: {reason}\n\n"
        f"Prosíme o úpravu a opätovné nahratie dokumentu.\n\n"
        f"S pozdravom\nSystém odborných praxí"
    )


def document_approved_by_garant_subject() -> str:
    return "Dokument bol schválený garantom"


def document_approved_by_garant_student_body(*, student_name: str, document_type: str) -> str:
    return (
        f"{_greeting_for_person(student_name)}\n\n"
        f"Váš dokument typu **{document_type}** bol schválený garantom.\n\n"
        f"S pozdravom\nSystém odborných praxí"
    )


def document_approved_by_garant_company_body(
    *, firma_name: str, student_name: str, document_type: str
) -> str:
    return (
        f"{_greeting_for_person(firma_name)}\n\n"
        f"Dokument študenta **{student_name}** typu **{document_type}** bol schválený garantom.\n\n"
        f"S pozdravom\nSystém odborných praxí"
    )


def document_soft_rejected_by_garant_subject() -> str:
    return "Pripomienky k dokumentu (garant)"


def document_soft_rejected_by_garant_body(
    *, student_name: str, document_type: str, reason: str
) -> str:
    return (
        f"{_greeting_for_person(student_name)}\n\n"
        f"Garant má pripomienky k Vášmu dokumentu typu **{document_type}**.\n"
        f"Dôvod: {reason}\n\n"
        f"Prosíme o úpravu a opätovné nahratie dokumentu.\n\n"
        f"S pozdravom\nSystém odborných praxí"
    )


def document_rejected_by_garant_subject() -> str:
    return "Dokument bol zamietnutý garantom"


def document_rejected_by_garant_student_body(
    *, student_name: str, document_type: str, reason: str
) -> str:
    return (
        f"{_greeting_for_person(student_name)}\n\n"
        f"Garant zamietol Váš dokument typu **{document_type}**.\n"
        f"Dôvod: {reason}\n\n"
        f"Je potrebné vypracovať nový dokument a znovu nahrať.\n\n"
        f"S pozdravom\nSystém odborných praxí"
    )


def document_rejected_by_garant_company_body(
    *, firma_name: str, student_name: str, document_type: str
) -> str:
    return (
        f"{_greeting_for_person(firma_name)}\n\n"
        f"Garant zamietol dokument študenta **{student_name}** typu **{document_type}**.\n\n"
        f"S pozdravom\nSystém odborných praxí"
    )


def get_notification_template(stav, prax):
    """Return (subject, template_key, text) for a given internship state."""
    firma_nazov = getattr(prax.firma, "nazov", "firma")
    student_meno = getattr(prax.student, "meno", "študent")

    templates = {
        "nova": {
            "predmet": "Nová žiadosť o odbornú prax",
            "sablona_kluc": "prax_nova",
            "text": (
                f"Dobrý deň,\n\n"
                f"študent {student_meno} podal žiadosť o odbornú prax vo firme {firma_nazov}.\n"
                f"Prosíme o jej posúdenie a potvrdenie.\n\n"
                f"S pozdravom\n"
                f"Tím Študentských praxí"
            ),
        },
        "potvrdena_firmou": {
            "predmet": "Odborná prax bola potvrdená firmou",
            "sablona_kluc": "prax_potvrdena_firmou",
            "text": (
                f"Dobrý deň,\n\n"
                f"firma {firma_nazov} potvrdila Vašu žiadosť o odbornú prax.\n"
                f"Prax čaká na schválenie garantom.\n\n"
                f"S pozdravom\n"
                f"Tím Študentských praxí"
            ),
        },
        "zamietnuta_firmou": {
            "predmet": "Odborná prax bola zamietnutá firmou",
            "sablona_kluc": "prax_zamietnuta_firmou",
            "text": (
                f"Dobrý deň,\n\n"
                f"žiadame Vás o informáciu, že odborná prax bola zamietnutá firmou {firma_nazov}.\n"
                f"Pre viac informácií sa prosím prihláste do systému.\n\n"
                f"S pozdravom\n"
                f"Tím Študentských praxí"
            ),
        },
        "schvalena_garantom": {
            "predmet": "Odborná prax bola schválená garantom",
            "sablona_kluc": "prax_schvalena_garantom",
            "text": (
                f"Dobrý deň,\n\n"
                f"garant schválil Vašu odbornú prax vo firme {firma_nazov}.\n"
                f"Prax je teraz aktívna.\n\n"
                f"S pozdravom\n"
                f"Tím Študentských praxí"
            ),
        },
        "ukoncena": {
            "predmet": "Odborná prax bola ukončená",
            "sablona_kluc": "prax_ukoncena",
            "text": (
                f"Dobrý deň,\n\n"
                f"Vaša odborná prax vo firme {firma_nazov} bola úspešne ukončená.\n"
                f"Ďakujeme za spoluprácu.\n\n"
                f"S pozdravom\n"
                f"Tím Študentských praxí"
            ),
        },
    }

    return templates.get(stav, None)
