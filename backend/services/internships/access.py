"""Access and filtering helpers for internships (no HTTP dependencies)."""
from django.db.models import Q

from apps.internships.models import Prax
from apps.users.models import User


def filter_internships_for_user(user, queryset):
    """Limit internships to those visible to the given user."""
    role = getattr(user, "rola", "") or ""

    if role == User.ROLE_GARANT:
        return queryset
    if role == User.ROLE_STUDENT:
        return queryset.filter(student_id=user.id)
    if role == User.ROLE_FIRMA:
        firma_id = getattr(user, "firma_id", None)
        return queryset.filter(firma_id=firma_id) if firma_id else queryset.none()
    return queryset.none()


def filter_history_for_user(user, queryset):
    """Limit history records to those visible to the given user."""
    role = getattr(user, "rola", "") or ""

    if role == User.ROLE_GARANT:
        return queryset
    if role == User.ROLE_STUDENT:
        return queryset.filter(prax__student_id=user.id)
    if role == User.ROLE_FIRMA:
        firma_id = getattr(user, "firma_id", None)
        return queryset.filter(prax__firma_id=firma_id) if firma_id else queryset.none()
    return queryset.none()


def apply_garant_filters(queryset, params):
    """Apply garant filters with validation; returns {ok, queryset|errors}."""
    rok = params.get("rok")
    semester = params.get("semester")
    stav = params.get("stav")
    student_id = params.get("student_id")
    firma_id = params.get("firma_id")
    search = params.get("search")
    student_text = params.get("student")
    firma_text = params.get("firma")
    study_program = params.get("odbor") or params.get("study_program")

    allowed_stav = {choice[0] for choice in Prax.STAV_CHOICES}
    allowed_semester = {choice[0] for choice in Prax.SEMESTER_CHOICES}

    if rok:
        try:
            rok_value = int(rok)
        except (TypeError, ValueError):
            return {"ok": False, "errors": {"rok": "Neplatný rok."}}
        queryset = queryset.filter(rok=rok_value)
    if semester:
        semester_value = str(semester).lower()
        if semester_value not in allowed_semester:
            return {"ok": False, "errors": {"semester": "Neplatný semester."}}
        queryset = queryset.filter(semester__iexact=semester_value)
    if stav:
        stav_value = str(stav).lower()
        if stav_value not in allowed_stav:
            return {"ok": False, "errors": {"stav": "Neplatný stav."}}
        queryset = queryset.filter(stav__iexact=stav_value)
    if student_id:
        try:
            student_id_value = int(student_id)
        except (TypeError, ValueError):
            return {"ok": False, "errors": {"student_id": "Neplatné ID študenta."}}
        queryset = queryset.filter(student_id=student_id_value)
    if firma_id:
        try:
            firma_id_value = int(firma_id)
        except (TypeError, ValueError):
            return {"ok": False, "errors": {"firma_id": "Neplatné ID firmy."}}
        queryset = queryset.filter(firma_id=firma_id_value)
    if student_text:
        queryset = queryset.filter(
            Q(student__email__icontains=student_text)
            | Q(student__meno__icontains=student_text)
            | Q(student__priezvisko__icontains=student_text)
        )
    if firma_text:
        queryset = queryset.filter(firma__nazov__icontains=firma_text)
    if study_program:
        queryset = queryset.filter(student__studentprofil__studijny_program__icontains=study_program)
    if search:
        queryset = queryset.filter(
            Q(student__email__icontains=search)
            | Q(student__meno__icontains=search)
            | Q(student__priezvisko__icontains=search)
            | Q(firma__nazov__icontains=search)
        )

    return {"ok": True, "queryset": queryset}


def apply_company_filters(queryset, params):
    """Apply company filters with validation; returns {ok, queryset|error}."""
    rok = params.get("rok")
    stav = params.get("stav")
    semester = params.get("semester")

    allowed_stav = {choice[0] for choice in Prax.STAV_CHOICES}
    allowed_semester = {choice[0] for choice in Prax.SEMESTER_CHOICES}

    if rok:
        try:
            rok_value = int(rok)
        except (TypeError, ValueError):
            return {"ok": False, "error": "Neplatný rok."}
        queryset = queryset.filter(rok=rok_value)
    if stav:
        stav_value = str(stav).lower()
        if stav_value not in allowed_stav:
            return {"ok": False, "error": "Neplatný stav."}
        queryset = queryset.filter(stav__iexact=stav_value)
    if semester:
        semester_value = str(semester).lower()
        if semester_value not in allowed_semester:
            return {"ok": False, "error": "Neplatný semester."}
        queryset = queryset.filter(semester__iexact=semester_value)

    return {"ok": True, "queryset": queryset}


def apply_external_filters(queryset, params):
    """Apply external filters with validation; returns {ok, queryset|error}."""
    stav = params.get("stav")
    rok = params.get("rok")
    semester = params.get("semester")
    search = params.get("search")

    allowed_stav = {choice[0] for choice in Prax.STAV_CHOICES}
    allowed_semester = {choice[0] for choice in Prax.SEMESTER_CHOICES}

    if stav:
        stav_value = str(stav).lower()
        if stav_value not in allowed_stav:
            return {"ok": False, "error": "Neplatný stav."}
        queryset = queryset.filter(stav__iexact=stav_value)

    if rok:
        try:
            queryset = queryset.filter(rok=int(rok))
        except (TypeError, ValueError):
            return {"ok": False, "error": "rok musí byť číslo"}

    if semester:
        semester_value = str(semester).lower()
        if semester_value not in allowed_semester:
            return {"ok": False, "error": "Neplatný semester."}
        queryset = queryset.filter(semester__iexact=semester_value)

    if search:
        queryset = queryset.filter(
            Q(firma__nazov__icontains=search)
            | Q(student__email__icontains=search)
            | Q(student__meno__icontains=search)
            | Q(student__priezvisko__icontains=search)
        )

    return {"ok": True, "queryset": queryset}


def build_garant_export_rows(queryset):
    """Return CSV rows for garant export."""
    rows = []
    for prax in queryset:
        student = getattr(prax, "student", None)
        firma = getattr(prax, "firma", None)
        garant = getattr(prax, "garant", None)
        study_program = ""
        if student and hasattr(student, "studentprofil"):
            study_program = student.studentprofil.studijny_program or ""

        full_name = ""
        if student:
            full_name = f"{student.meno or ''} {student.priezvisko or ''}".strip()
            if not full_name:
                full_name = student.email or ""

        rows.append(
            [
                prax.id,
                prax.rok,
                prax.semester,
                prax.stav,
                full_name,
                getattr(student, "email", "") or "",
                study_program,
                getattr(firma, "nazov", "") or "",
                getattr(garant, "email", "") or "",
                getattr(prax, "datum_zaciatku", "") or "",
                getattr(prax, "datum_konca", "") or "",
                getattr(prax, "vytvorene_at", "") or "",
                getattr(prax, "zmenene_at", "") or "",
            ]
        )
    return rows


def get_student_internships(user):
    """Return student internships or an error/message payload."""
    if getattr(user, "rola", None) != User.ROLE_STUDENT:
        return {
            "ok": False,
            "status": 403,
            "data": {"error": "Len študent môže pristupovať k tomuto endpointu."},
        }

    praxe = Prax.objects.filter(student=user).select_related("firma", "garant").order_by("-vytvorene_at")
    if not praxe.exists():
        return {"ok": True, "status": 200, "empty": True, "data": {"message": "Študent zatiaľ nemá žiadne praxe."}}

    return {"ok": True, "status": 200, "queryset": praxe}


def get_company_internships(user, params, pending: bool = False):
    """Return company internships with optional pending-only filter."""
    if getattr(user, "rola", None) != User.ROLE_FIRMA:
        return {
            "ok": False,
            "status": 403,
            "data": {"error": "Prístup povolený len pre firemných používateľov."},
        }

    if not getattr(user, "firma_id", None):
        return {
            "ok": False,
            "status": 400,
            "data": {"error": "Firma nemá priradené ID (firma_id)."},
        }

    internships = (
        Prax.objects.filter(firma_id=user.firma_id)
        .select_related("student", "garant")
        .order_by("-vytvorene_at")
    )
    if pending:
        internships = internships.filter(stav__iexact=Prax.STAV_VYTVORENA)

    result = apply_company_filters(internships, params)
    if not result["ok"]:
        return {"ok": False, "status": 400, "data": {"error": result["error"]}}

    return {"ok": True, "status": 200, "queryset": result["queryset"]}


def get_external_internships(user, params):
    """Return internships for external integrators/garants with filters."""
    if getattr(user, "rola", None) not in (User.ROLE_EXTERNY, User.ROLE_GARANT):
        return {
            "ok": False,
            "status": 403,
            "data": {"error": "Prístup povolený len pre externých integrátorov."},
        }

    qs = (
        Prax.objects.select_related("student", "student__studentprofil", "firma", "garant")
        .all()
        .order_by("-vytvorene_at")
    )

    result = apply_external_filters(qs, params)
    if not result["ok"]:
        return {"ok": False, "status": 400, "data": {"error": result["error"]}}

    return {"ok": True, "status": 200, "queryset": result["queryset"]}
