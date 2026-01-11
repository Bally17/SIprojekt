"""Viewset composition for document workflows."""
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
    """Document workflow endpoints (upload, review, download, PDF generation)."""

    pass
