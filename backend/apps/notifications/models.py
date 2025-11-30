from django.db import models

class Notifikacie(models.Model):
    STAV_NOVE = "nove"
    STAV_ODOSLANE = "odoslane"
    STAV_ZLYHALO = "zlyhalo"

    prax = models.ForeignKey('internships.Prax', on_delete=models.CASCADE, null=True, blank=True)
    prijemca = models.ForeignKey('users.User', on_delete=models.CASCADE, null=True, blank=True)
    prijemca_email = models.CharField(max_length=255, blank=True)
    predmet = models.CharField(max_length=255)
    sablona_kluc = models.CharField(max_length=100)
    payload_json = models.JSONField(blank=True, null=True)
    stav = models.CharField(
        max_length=20,
        blank=True,
        default=STAV_NOVE,  # možné hodnoty: nove, odoslane, zlyhalo
    )
    odoslane_at = models.DateTimeField(null=True, blank=True)
    vytvorene_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifikacie'

    def __str__(self):
        return f"{self.predmet} [{self.stav}]"
