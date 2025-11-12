## Internships API – Garant Access

All endpoints below require JWT authentication (`Authorization: Bearer <token>`) and are limited to users with the `garant` role unless noted otherwise. Responses are JSON. Unless stated, timestamps use ISO 8601 strings and dates use `YYYY-MM-DD`.

### Summary

| Method | Path | Description | Permissions | Response |
| --- | --- | --- | --- | --- |
| `GET` | `/api/internships/garant/internships/` | Paginated list of all internships | Garant | `200 OK` → `InternshipSerializer` list |
| `GET` | `/api/internships/garant/internships/{id}/` | Detail of a single internship | Garant | `200 OK` → `InternshipSerializer` |
| `PATCH` | `/api/internships/garant/internships/{id}/` | Partial update of company, student, dates, or status | Garant | `200 OK` → updated `InternshipSerializer` |

`InternshipSerializer` returns the complete `Prax` record plus denormalized fields:

```json
{
  "id": 15,
  "student": 42,
  "firma": 3,
  "garant": 7,
  "rok": 2024,
  "semester": "letny",
  "datum_zaciatku": "2024-06-01",
  "datum_konca": "2024-08-31",
  "stav": "vytvorena",
  "...": "... other model fields ...",
  "documents": [ { /* DocumentSerializer */ } ],
  "student_full_name": "Ján Mrkva",
  "student_email": "jan.mrkva@student.ukf.sk",
  "company_name": "Acme s.r.o.",
  "study_program": "Aplikovaná informatika"
}
```

---

### `GET /api/internships/garant/internships/`

Returns a paginated collection (`count`, `next`, `previous`, `results`). Each item uses `InternshipSerializer` (see above). The list is ordered by `-vytvorene_at`.

**Query parameters**

| Name | Type | Description |
| --- | --- | --- |
| `rok` | integer | Filter by academic year |
| `semester` | string (`zimny`/`letny`) | Filter by semester |
| `stav` | string | Exact match on status field |
| `student_id` | integer | Filter by student foreign key |
| `firma_id` | integer | Filter by company |
| `search` | string | Case-insensitive search in student name/email or company name |

**Responses**

* `200 OK` – list payload
* `401 Unauthorized` – missing/invalid token
* `403 Forbidden` – authenticated user is not `garant`

---

### `GET /api/internships/garant/internships/{id}/`

Returns detail for the selected `Prax` record via `InternshipSerializer`.

**Responses**

* `200 OK` – internship detail
* `401 Unauthorized`
* `403 Forbidden`
* `404 Not Found` – no internship with given `id`

---

### `PATCH /api/internships/garant/internships/{id}/`

Allows garant to change company, student, dates, or status of an internship. Body is validated by `GarantInternshipUpdateSerializer`. Provide only fields to change.

**Request body**

```json
{
  "firma_id": 3,                // optional, FK to Firma
  "student_id": 42,             // optional, FK to User with role student
  "datum_zaciatku": "2024-06-01",
  "datum_konca": "2024-08-31",
  "stav": "schvalena",
  "status_note": "Konzultácia 7.5." // optional note, only when changing stav
}
```

Validation rules:

* At least one updatable field must be provided.
* `status_note` is allowed only if `stav` is present.
* `datum_konca` cannot be earlier than `datum_zaciatku`.

On success, the response mirrors `GET` detail. Status history entries and notification side effects are handled by model signals (if `stav` changes the `_status_change_note` is saved).

**Responses**

* `200 OK` – updated internship in `InternshipSerializer` format
* `400 Bad Request` – validation errors (missing fields, invalid note/date etc.)
* `401 Unauthorized`
* `403 Forbidden`
* `404 Not Found`
