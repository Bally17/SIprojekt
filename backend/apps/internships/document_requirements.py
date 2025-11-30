from typing import Dict, List

from apps.documents.models import Dokument
from apps.internships.models import Prax

# Requirements for transitioning a practice (prax) into a specific state.
# Map target state -> list of document requirements.
REQUIRED_DOCUMENTS_BY_STATE: Dict[str, List[Dict[str, str]]] = {
    Prax.STAV_SCHVALENA: [
        {
            "typ": Dokument.TYP_ZMLUVA,
            "stav": Dokument.STAV_POTVRDENY,
            "label": "Podpísaná zmluva potvrdená firmou",
        },
    ],
    # Future states can be added here (napr. "obhajena": [{"typ": "vykaz", ...}])
}


def _state_key(value: str) -> str:
    return (value or "").lower()


def missing_required_documents(prax, target_state: str) -> List[str]:
    """
    Returns a list of human readable document labels that are missing for the
    requested target state transition.
    """
    if not prax:
        return []

    state_key = _state_key(target_state)

    # Platené zamestnanie: stačí potvrdená pracovná zmluva ALEBO 3 potvrdené faktúry.
    if (
        state_key == Prax.STAV_SCHVALENA
        and getattr(prax, "forma", Prax.FORMA_DOHODA) == Prax.FORMA_ZAMESTNANIE
    ):
        expected_state = Dokument.STAV_POTVRDENY
        has_contract = (
            Dokument.objects.filter(
                prax=prax,
                typ_dokumentu=Dokument.TYP_ZAMESTNANIE,
                stav_dokumentu=expected_state,
            )
            .exclude(subor_url__isnull=True)
            .exclude(subor_url="")
            .exists()
        )
        confirmed_invoices = (
            Dokument.objects.filter(
                prax=prax,
                typ_dokumentu=Dokument.TYP_FAKTURA,
                stav_dokumentu=expected_state,
            )
            .exclude(subor_url__isnull=True)
            .exclude(subor_url="")
            .count()
        )
        if has_contract or confirmed_invoices >= 3:
            return []
        return ["Pracovná zmluva alebo 3 po sebe idúce faktúry s IT predmetom potvrdené firmou"]

    requirements = REQUIRED_DOCUMENTS_BY_STATE.get(state_key, [])
    if not requirements:
        return []

    missing: List[str] = []
    for requirement in requirements:
        doc_type = requirement["typ"]
        expected_state = requirement.get("stav", Dokument.STAV_POTVRDENY)
        label = requirement.get("label") or doc_type

        exists = (
            Dokument.objects.filter(
                prax=prax,
                typ_dokumentu=doc_type,
                stav_dokumentu=expected_state,
            )
            .exclude(subor_url__isnull=True)
            .exclude(subor_url="")
            .exists()
        )

        if not exists:
            missing.append(label)

    return missing
