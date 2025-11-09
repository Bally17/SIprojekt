# apps/users/forms.py
from django import forms
from .models import User, GarantProfil
from django import forms
from django.contrib.auth.forms import AuthenticationForm

class EmailAdminLoginForm(AuthenticationForm):
    username = forms.EmailField(label="Email", widget=forms.EmailInput())

class GarantCreateForm(forms.ModelForm):
    # Heslo negenerujeme tu – bude sa vytvárať automaticky v admin.save_model
    pracovisko = forms.CharField(max_length=150, required=False, label="Pracovisko")
    organizacia = forms.CharField(max_length=150, required=False, label="Organizácia")

    class Meta:
        model = User
        fields = ["email", "meno", "priezvisko"]  # rolu nastavíme na 'garant' automaticky

    def save(self, commit=True):
        user = super().save(commit=False)
        user.rola = "garant"
        user.aktivny = True
        user.email_overeny = True
        user.musi_zmenit_heslo = False
        if commit:
            user.save()
            # GarantProfil vytvoríme v admin.save_model po nastavení hesla
        return user
