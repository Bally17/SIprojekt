import pytest
from rest_framework.test import APIClient

from apps.users.models import User
from apps.companies.models import Firma
from apps.internships.models import Prax
from apps.documents.models import Dokument


def _ids_from_response(resp):
    data = resp.data
    if isinstance(data, dict) and "results" in data:
        items = data["results"]
    else:
        items = data
    if isinstance(items, dict):
        items = [items]
    ids = set()
    for item in items:
        if "id" in item:
            ids.add(item["id"])
        elif "prax_id" in item:
            ids.add(item["prax_id"])
        else:
            raise AssertionError(f"Missing id in response item: {item}")
    return ids


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def users_with_data():
    """
    Vytvorí základné dáta pre RBAC testy:
    - študent, firma, garant
    - 2 praxe (jedna patriaca firme1/študentovi, druhá firme2/inému študentovi)
    - dokumenty naviazané na praxe
    """
    garant = User.objects.create_user(
        email="garant@example.com",
        password="StrongPass123!",
        rola="garant",
    )
    student = User.objects.create_user(
        email="student1@student.ukf.sk",
        password="StrongPass123!",
        rola="student",
    )
    other_student = User.objects.create_user(
        email="student2@student.ukf.sk",
        password="StrongPass123!",
        rola="student",
    )

    firma1 = Firma.objects.create(
        nazov="Firma Jeden",
        adresa="Street 1",
        kontakt_meno="Kontakt 1",
        kontakt_email="kontakt1@example.com",
    )
    firma2 = Firma.objects.create(
        nazov="Firma Dva",
        adresa="Street 2",
        kontakt_meno="Kontakt 2",
        kontakt_email="kontakt2@example.com",
    )

    company_user = User.objects.create_user(
        email="firma@example.com",
        password="StrongPass123!",
        rola="firma",
        firma_id=firma1.id,
    )

    prax1 = Prax.objects.create(
        student=student,
        firma=firma1,
        garant=garant,
        rok=2025,
        semester="zimny",
        datum_zaciatku="2025-01-01",
        datum_konca="2025-02-01",
        stav="vytvorena",
    )
    prax2 = Prax.objects.create(
        student=other_student,
        firma=firma2,
        garant=garant,
        rok=2025,
        semester="zimny",
        datum_zaciatku="2025-03-01",
        datum_konca="2025-04-01",
        stav="vytvorena",
    )

    doc1 = Dokument.objects.create(
        prax=prax1,
        typ_dokumentu="vykaz",
        subor_url="file1.pdf",
        nahrane_pouzivatel=student,
        stav_dokumentu="nahrany",
    )
    doc2 = Dokument.objects.create(
        prax=prax2,
        typ_dokumentu="vykaz",
        subor_url="file2.pdf",
        nahrane_pouzivatel=other_student,
        stav_dokumentu="nahrany",
    )

    return {
        "garant": garant,
        "student": student,
        "other_student": other_student,
        "company_user": company_user,
        "prax1": prax1,
        "prax2": prax2,
        "doc1": doc1,
        "doc2": doc2,
        "firma1": firma1,
        "firma2": firma2,
    }


@pytest.mark.django_db
def test_student_sees_only_own_documents(client, users_with_data):
    student = users_with_data["student"]
    doc1 = users_with_data["doc1"]
    doc2 = users_with_data["doc2"]

    client.force_authenticate(user=student)
    resp = client.get("/api/documents/")
    assert resp.status_code == 200
    ids = _ids_from_response(resp)
    assert ids == {doc1.id}

    detail = client.get(f"/api/documents/{doc2.id}/")
    assert detail.status_code in (403, 404)


@pytest.mark.django_db
def test_company_sees_only_its_documents(client, users_with_data):
    company_user = users_with_data["company_user"]
    doc1 = users_with_data["doc1"]
    doc2 = users_with_data["doc2"]

    client.force_authenticate(user=company_user)
    resp = client.get("/api/documents/")
    assert resp.status_code == 200
    ids = _ids_from_response(resp)
    assert ids == {doc1.id}

    detail = client.get(f"/api/documents/{doc2.id}/")
    assert detail.status_code in (403, 404)


@pytest.mark.django_db
def test_garant_sees_all_documents(client, users_with_data):
    garant = users_with_data["garant"]
    doc1 = users_with_data["doc1"]
    doc2 = users_with_data["doc2"]

    client.force_authenticate(user=garant)
    resp = client.get("/api/documents/")
    assert resp.status_code == 200
    ids = _ids_from_response(resp)
    assert ids == {doc1.id, doc2.id}


@pytest.mark.django_db
def test_internships_filtered_by_role(client, users_with_data):
    student = users_with_data["student"]
    company_user = users_with_data["company_user"]
    garant = users_with_data["garant"]
    prax1 = users_with_data["prax1"]
    prax2 = users_with_data["prax2"]

    client.force_authenticate(user=student)
    resp_student = client.get("/api/internships/internships/")
    assert resp_student.status_code == 200
    ids_student = _ids_from_response(resp_student)
    assert ids_student == {prax1.id}

    client.force_authenticate(user=company_user)
    resp_company = client.get("/api/internships/internships/")
    assert resp_company.status_code == 200
    ids_company = _ids_from_response(resp_company)
    assert ids_company == {prax1.id}

    client.force_authenticate(user=garant)
    resp_garant = client.get("/api/internships/internships/")
    assert resp_garant.status_code == 200
    ids_garant = _ids_from_response(resp_garant)
    assert ids_garant == {prax1.id, prax2.id}


@pytest.mark.django_db
def test_company_mutations_blocked_for_non_garant(client, users_with_data):
    student = users_with_data["student"]
    company_user = users_with_data["company_user"]

    payload = {"nazov": "Nova Firma"}

    client.force_authenticate(user=student)
    resp_student = client.post("/api/companies/", payload, format="json")
    assert resp_student.status_code in (403, 405)

    client.force_authenticate(user=company_user)
    resp_company = client.post("/api/companies/", payload, format="json")
    assert resp_company.status_code in (403, 405)


@pytest.mark.django_db
def test_external_mark_defended_allows_externy(client):
    externy = User.objects.create_user(
        email="externy@example.com", password="StrongPass123!", rola="externy"
    )
    garant = User.objects.create_user(
        email="garant2@example.com", password="StrongPass123!", rola="garant"
    )
    student = User.objects.create_user(
        email="student_ext@student.ukf.sk", password="StrongPass123!", rola="student"
    )
    firma = Firma.objects.create(
        nazov="Extern Firma", adresa="Street", kontakt_meno="Meno", kontakt_email="k@example.com"
    )
    prax = Prax.objects.create(
        student=student,
        firma=firma,
        garant=garant,
        rok=2025,
        semester="zimny",
        datum_zaciatku="2025-05-01",
        datum_konca="2025-06-01",
        stav="schvalena",
    )

    client.force_authenticate(user=externy)
    resp = client.post(
        "/api/internships/external/defense/",
        {"prax_id": prax.id, "note": "obhajene"},
        format="json",
    )

    assert resp.status_code == 200
    assert resp.data["stav"] == "obhajena"


@pytest.mark.django_db
def test_external_mark_defended_rejects_invalid_role(client):
    student = User.objects.create_user(
        email="student_ext2@student.ukf.sk", password="StrongPass123!", rola="student"
    )
    garant = User.objects.create_user(
        email="garant3@example.com", password="StrongPass123!", rola="garant"
    )
    firma = Firma.objects.create(
        nazov="Extern Firma 2", adresa="Street 2", kontakt_meno="Meno2", kontakt_email="k2@example.com"
    )
    prax = Prax.objects.create(
        student=student,
        firma=firma,
        garant=garant,
        rok=2025,
        semester="zimny",
        datum_zaciatku="2025-07-01",
        datum_konca="2025-08-01",
        stav="schvalena",
    )

    client.force_authenticate(user=student)
    resp = client.post(
        "/api/internships/external/defense/",
        {"prax_id": prax.id},
        format="json",
    )

    assert resp.status_code == 403
