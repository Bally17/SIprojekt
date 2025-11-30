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

    requirements = REQUIRED_DOCUMENTS_BY_STATE.get(_state_key(target_state), [])
    if not requirements:
        return []

    missing: List[str] = []
    for requirement in requirements:
        doc_type = requirement["typ"]
        expected_state = requirement.get("stav", Dokument.STAV_POTVRDENY)
        label = requirement.get("label") or doc_type

        exists = Dokument.objects.filter(
            prax=prax,
            typ_dokumentu=doc_type,
            stav_dokumentu=expected_state,
        ).exists()

        if not exists:
            missing.append(label)

    return missing
