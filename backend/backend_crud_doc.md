🎯 COMPLETE CRUD ENDPOINTS
👥 USERS - Kompletné CRUD
http
GET    /api/users/           # Zoznam všetkých používateľov
POST   /api/users/           # Vytvorenie nového používateľa  
GET    /api/users/{id}/      # Detail konkrétneho používateľa
PUT    /api/users/{id}/      # Kompletná aktualizácia
PATCH  /api/users/{id}/      # Čiastočná aktualizácia
DELETE /api/users/{id}/      # Odstránenie používateľa
🏢 COMPANIES - Kompletné CRUD
http
GET    /api/companies/       # Zoznam všetkých firiem
POST   /api/companies/       # Vytvorenie novej firmy
GET    /api/companies/{id}/  # Detail konkrétnej firmy  
PUT    /api/companies/{id}/  # Kompletná aktualizácia
PATCH  /api/companies/{id}/  # Čiastočná aktualizácia
DELETE /api/companies/{id}/  # Odstránenie firmy
🎓 INTERNSHIPS - Kompletné CRUD
http
GET    /api/internships/        # Zoznam všetkých praxí
POST   /api/internships/        # Vytvorenie novej praxe
GET    /api/internships/{id}/   # Detail konkrétnej praxe
PUT    /api/internships/{id}/   # Kompletná aktualizácia  
PATCH  /api/internships/{id}/   # Čiastočná aktualizácia
DELETE /api/internships/{id}/   # Odstránenie praxe
📄 DOCUMENTS - Kompletné CRUD
http
GET    /api/documents/        # Zoznam všetkých dokumentov
POST   /api/documents/        # Vytvorenie nového dokumentu
GET    /api/documents/{id}/   # Detail konkrétneho dokumentu
PUT    /api/documents/{id}/   # Kompletná aktualizácia
PATCH  /api/documents/{id}/   # Čiastočná aktualizácia  
DELETE /api/documents/{id}/   # Odstránenie dokumentu
🔄 React CRUD Príklady - Kompletné
CREATE - Vytvorenie záznamu
javascript
// Vytvorenie novej firmy
const createCompany = async (companyData) => {
  const response = await fetch('http://localhost:8000/api/companies/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    },
    body: JSON.stringify(companyData)
  });
  return await response.json();
};

// Použitie
const newCompany = {
  nazov: "Nová Firma s.r.o.",
  adresa: "Hlavná 123, Bratislava", 
  kontakt_email: "info@novafirma.sk",
  kontakt_telefon: "+421900111222"
};

createCompany(newCompany)
  .then(company => console.log('Vytvorená firma:', company));
READ - Čítanie záznamov
javascript
// Získanie zoznamu firiem
const fetchCompanies = async () => {
  const response = await fetch('http://localhost:8000/api/companies/');
  return await response.json();
};

// Získanie detailu firmy
const fetchCompany = async (companyId) => {
  const response = await fetch(`http://localhost:8000/api/companies/${companyId}/`);
  return await response.json();
};
UPDATE - Aktualizácia záznamu
javascript
// Kompletná aktualizácia (PUT)
const updateCompany = async (companyId, companyData) => {
  const response = await fetch(`http://localhost:8000/api/companies/${companyId}/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    },
    body: JSON.stringify(companyData)
  });
  return await response.json();
};

// Čiastočná aktualizácia (PATCH)
const patchCompany = async (companyId, updates) => {
  const response = await fetch(`http://localhost:8000/api/companies/${companyId}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    },
    body: JSON.stringify(updates)
  });
  return await response.json();
};

// Použitie - zmena iba názvu
patchCompany(1, { nazov: "Nový názov firmy" })
  .then(updatedCompany => console.log('Aktualizovaná firma:', updatedCompany));
DELETE - Odstránenie záznamu
javascript
const deleteCompany = async (companyId) => {
  const response = await fetch(`http://localhost:8000/api/companies/${companyId}/`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    }
  });
  return response.ok; // vráti true ak bolo úspešné
};

// Použitie
deleteCompany(1)
  .then(success => {
    if (success) console.log('Firma úspešne odstránená');
    else console.log('Chyba pri odstraňovaní');
  });
🏗️ Kompletný React Komponent s CRUD
javascript
import React, { useState, useEffect } from 'react';

function CompaniesCRUD() {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [formData, setFormData] = useState({
    nazov: '',
    adresa: '',
    kontakt_email: '',
    kontakt_telefon: ''
  });

  // READ - Načítanie zoznamu
  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const data = await fetch('http://localhost:8000/api/companies/').then(r => r.json());
      setCompanies(data);
    } catch (error) {
      console.error('Chyba pri načítaní firiem:', error);
    }
  };

  // CREATE - Vytvorenie novej firmy
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const newCompany = await fetch('http://localhost:8000/api/companies/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(formData)
      }).then(r => r.json());
      
      setCompanies([...companies, newCompany]);
      setFormData({ nazov: '', adresa: '', kontakt_email: '', kontakt_telefon: '' });
      alert('Firma vytvorená úspešne!');
    } catch (error) {
      alert('Chyba pri vytváraní firmy');
    }
  };

  // UPDATE - Aktualizácia firmy
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updatedCompany = await fetch(`http://localhost:8000/api/companies/${selectedCompany.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(formData)
      }).then(r => r.json());
      
      setCompanies(companies.map(c => c.id === selectedCompany.id ? updatedCompany : c));
      setSelectedCompany(null);
      setFormData({ nazov: '', adresa: '', kontakt_email: '', kontakt_telefon: '' });
      alert('Firma aktualizovaná úspešne!');
    } catch (error) {
      alert('Chyba pri aktualizácii firmy');
    }
  };

  // DELETE - Odstránenie firmy
  const handleDelete = async (companyId) => {
    if (window.confirm('Naozaj chcete odstrániť túto firmu?')) {
      try {
        await fetch(`http://localhost:8000/api/companies/${companyId}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        
        setCompanies(companies.filter(c => c.id !== companyId));
        alert('Firma odstránená úspešne!');
      } catch (error) {
        alert('Chyba pri odstraňovaní firmy');
      }
    }
  };

  // Naplnenie formulára pre editáciu
  const handleEdit = (company) => {
    setSelectedCompany(company);
    setFormData({
      nazov: company.nazov,
      adresa: company.adresa,
      kontakt_email: company.kontakt_email,
      kontakt_telefon: company.kontakt_telefon
    });
  };

  return (
    <div>
      <h2>CRUD Operations - Companies</h2>
      
      {/* CREATE/UPDATE Form */}
      <form onSubmit={selectedCompany ? handleUpdate : handleCreate}>
        <input
          type="text"
          placeholder="Názov firmy"
          value={formData.nazov}
          onChange={(e) => setFormData({...formData, nazov: e.target.value})}
          required
        />
        <input
          type="text"
          placeholder="Adresa"
          value={formData.adresa}
          onChange={(e) => setFormData({...formData, adresa: e.target.value})}
        />
        <input
          type="email"
          placeholder="Kontakt email"
          value={formData.kontakt_email}
          onChange={(e) => setFormData({...formData, kontakt_email: e.target.value})}
        />
        <input
          type="tel"
          placeholder="Kontakt telefón"
          value={formData.kontakt_telefon}
          onChange={(e) => setFormData({...formData, kontakt_telefon: e.target.value})}
        />
        <button type="submit">
          {selectedCompany ? 'Aktualizovať firmu' : 'Vytvoriť firmu'}
        </button>
        {selectedCompany && (
          <button type="button" onClick={() => {
            setSelectedCompany(null);
            setFormData({ nazov: '', adresa: '', kontakt_email: '', kontakt_telefon: '' });
          }}>
            Zrušiť editáciu
          </button>
        )}
      </form>

      {/* READ - Zoznam firiem */}
      <div className="companies-list">
        <h3>Zoznam firiem</h3>
        {companies.map(company => (
          <div key={company.id} className="company-item">
            <h4>{company.nazov}</h4>
            <p>{company.adresa}</p>
            <p>{company.kontakt_email} | {company.kontakt_telefon}</p>
            <button onClick={() => handleEdit(company)}>Editovať</button>
            <button onClick={() => handleDelete(company.id)}>Odstrániť</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CompaniesCRUD;
📊 CRUD Operations Summary
Operácia	HTTP Method	Endpoint	Popis
Create	POST	/api/{model}/	Vytvorenie nového záznamu
Read	GET	/api/{model}/	Zoznam všetkých záznamov
Read	GET	/api/{model}/{id}/	Detail konkrétneho záznamu
Update	PUT	/api/{model}/{id}/	Kompletná aktualizácia
Update	PATCH	/api/{model}/{id}/	Čiastočná aktualizácia
Delete	DELETE	/api/{model}/{id}/	Odstránenie záznamu
Áno, všetky CRUD endpointy sú kompletne zdokumentované a pripravené na použitie! 🚀


