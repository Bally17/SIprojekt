from .company_review import CompanyReviewMixin
from .document_base import DocumentBaseViewSet
from .garant_review import GarantReviewMixin
from .pdf_generation import PdfGenerationMixin
from .upload_download import DocumentUploadDownloadMixin


class DocumentViewSet(
    DocumentUploadDownloadMixin,
    CompanyReviewMixin,
    GarantReviewMixin,
    PdfGenerationMixin,
    DocumentBaseViewSet,
):
    """
    Dokumenty a ich workflow (upload, schválenie, zamietnutie, stiahnutie, generovanie dohody).
    """

    pass
