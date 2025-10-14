📚 Django REST API Dokumentácia - Kompletný Guide
🌐 Základné Informácie
Base URL: http://localhost:8000

Dokumentácia: http://localhost:8000/api/docs/

Formát: JSON

Autentifikácia: JWT Token / OAuth 2.0

🔐 Autentifikačné Endpointy
1. Normálne Prihlásenie
http
POST /api/auth/login/
Popis: Prihlásenie s emailom a heslom

Request Body:

json
{
  "email": "test@example.com",
  "password": "testpass123"
}
React Príklad:

javascript
const loginUser = async (email, password) => {
  try {
    const response = await fetch('http://localhost:8000/api/auth/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) throw new Error('Login failed');
    
    const data = await response.json();
    localStorage.setItem('access_token', data.tokens.access);
    localStorage.setItem('refresh_token', data.tokens.refresh);
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Použitie
loginUser('student@example.com', 'password123')
  .then(userData => console.log('Prihlásený:', userData));
2. Profil Používateľa
http
GET /api/auth/profile/
Popis: Získanie profilu prihláseného používateľa

React Príklad:

javascript
const getProfile = async () => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('http://localhost:8000/api/auth/profile/', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) throw new Error('Failed to fetch profile');
  return await response.json();
};
3. Obnovenie Tokenu
http
POST /api/auth/token/refresh/
Popis: Obnovenie access tokenu pomocou refresh tokenu

React Príklad:

javascript
const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token');
  
  const response = await fetch('http://localhost:8000/api/auth/token/refresh/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh: refreshToken }),
  });
  
  if (response.ok) {
    const data = await response.json();
    localStorage.setItem('access_token', data.access);
    return data.access;
  } else {
    // Redirect to login
    window.location.href = '/login';
  }
};
4. OAuth - GitHub
http
POST /api/auth/github/
React Príklad:

javascript
const githubLogin = async (githubAccessToken) => {
  const response = await fetch('http://localhost:8000/api/auth/github/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ access_token: githubAccessToken }),
  });
  return await response.json();
};
5. OAuth - Google
http
POST /api/auth/google/
React Príklad:

javascript
const googleLogin = async (googleAccessToken) => {
  const response = await fetch('http://localhost:8000/api/auth/google/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ access_token: googleAccessToken }),
  });
  return await response.json();
};
👥 Users Endpointy
1. Zoznam Používateľov
http
GET /api/users/
React Príklad:

javascript
const fetchUsers = async () => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('http://localhost:8000/api/users/', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) throw new Error('Failed to fetch users');
  return await response.json();
};

// Použitie v React komponente
function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersData = await fetchUsers();
        setUsers(usersData);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUsers();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <h2>Používatelia</h2>
      {users.map(user => (
        <div key={user.id}>
          {user.meno} {user.priezvisko} - {user.email}
        </div>
      ))}
    </div>
  );
}
2. Vytvorenie Používateľa
http
POST /api/users/
Request Body:

json
{
  "rola": "student",
  "email": "novy@student.com",
  "heslo_hash": "hashed_password",
  "meno": "Peter",
  "priezvisko": "Novák",
  "aktivny": true,
  "email_overeny": false,
  "musi_zmenit_heslo": true
}
React Príklad:

javascript
const createUser = async (userData) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('http://localhost:8000/api/users/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  
  if (!response.ok) throw new Error('Failed to create user');
  return await response.json();
};

// Použitie v formulári
function CreateUserForm() {
  const [formData, setFormData] = useState({
    meno: '',
    priezvisko: '',
    email: '',
    rola: 'student'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createUser(formData);
      alert('Používateľ vytvorený úspešne!');
      setFormData({ meno: '', priezvisko: '', email: '', rola: 'student' });
    } catch (error) {
      alert('Chyba pri vytváraní používateľa');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Meno"
        value={formData.meno}
        onChange={(e) => setFormData({...formData, meno: e.target.value})}
      />
      <input
        type="text"
        placeholder="Priezvisko"
        value={formData.priezvisko}
        onChange={(e) => setFormData({...formData, priezvisko: e.target.value})}
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
      />
      <select
        value={formData.rola}
        onChange={(e) => setFormData({...formData, rola: e.target.value})}
      >
        <option value="student">Študent</option>
        <option value="garant">Garant</option>
        <option value="firma">Firma</option>
      </select>
      <button type="submit">Vytvoriť používateľa</button>
    </form>
  );
}
3. Detail Používateľa
http
GET /api/users/{id}/
React Príklad:

javascript
const fetchUser = async (userId) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`http://localhost:8000/api/users/${userId}/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return await response.json();
};
4. Aktualizácia Používateľa
http
PUT /api/users/{id}/
PATCH /api/users/{id}/
React Príklad:

javascript
const updateUser = async (userId, userData) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`http://localhost:8000/api/users/${userId}/`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  
  return await response.json();
};
5. Odstránenie Používateľa
http
DELETE /api/users/{id}/
React Príklad:

javascript
const deleteUser = async (userId) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`http://localhost:8000/api/users/${userId}/`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return response.ok;
};
🏢 Companies Endpointy
1. Zoznam Firiem
http
GET /api/companies/
React Príklad:

javascript
const fetchCompanies = async () => {
  const response = await fetch('http://localhost:8000/api/companies/');
  return await response.json();
};

// Použitie s loading stavom a error handlingom
function CompaniesList() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const companiesData = await fetchCompanies();
        setCompanies(companiesData);
      } catch (err) {
        setError('Nepodarilo sa načítať firmy');
      } finally {
        setLoading(false);
      }
    };

    loadCompanies();
  }, []);

  if (loading) return <div>Načítavam firmy...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div>
      <h2>Firmy</h2>
      <div className="companies-grid">
        {companies.map(company => (
          <div key={company.id} className="company-card">
            <h3>{company.nazov}</h3>
            <p>{company.adresa}</p>
            <p>Kontakt: {company.kontakt_email}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
2. Vytvorenie Firmy
http
POST /api/companies/
Request Body:

json
{
  "nazov": "Nová Firma s.r.o.",
  "adresa": "Hlavná 123, Bratislava",
  "kontakt_meno": "Peter Novák",
  "kontakt_email": "peter@novafirma.sk",
  "kontakt_telefon": "+421900111222"
}
React Príklad:

javascript
const createCompany = async (companyData) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('http://localhost:8000/api/companies/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(companyData),
  });
  
  if (!response.ok) throw new Error('Failed to create company');
  return await response.json();
};
🎓 Internships Endpointy
1. Zoznam Praxí
http
GET /api/internships/
React Príklad:

javascript
const fetchInternships = async () => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('http://localhost:8000/api/internships/', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return await response.json();
};
2. Vytvorenie Praxe
http
POST /api/internships/
Request Body:

json
{
  "student_id": 1,
  "firma_id": 1,
  "garant_id": 2,
  "rok": 2024,
  "semester": "zimny",
  "datum_zaciatku": "2024-09-01",
  "datum_konca": "2024-12-20",
  "stav": "vytvorena"
}
React Príklad:

javascript
const createInternship = async (internshipData) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('http://localhost:8000/api/internships/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(internshipData),
  });
  
  return await response.json();
};
📄 Documents Endpointy
1. Zoznam Dokumentov
http
GET /api/documents/
React Príklad:

javascript
const fetchDocuments = async () => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('http://localhost:8000/api/documents/', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return await response.json();
};
2. Vytvorenie Dokumentu
http
POST /api/documents/
Request Body:

json
{
  "prax_id": 1,
  "typ_dokumentu": "dohoda",
  "subor_url": "/documents/dohoda.pdf",
  "nahrane_pouzivatel_id": 1,
  "stav_dokumentu": "nahrany"
}
🔧 Utility Funkcie pre React
HTTP Client s Error Handlingom
javascript
class ApiClient {
  constructor(baseURL = 'http://localhost:8000') {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const token = localStorage.getItem('access_token');
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        // Token expired, try to refresh
        const newToken = await refreshToken();
        if (newToken) {
          config.headers.Authorization = `Bearer ${newToken}`;
          const retryResponse = await fetch(url, config);
          return await this.handleResponse(retryResponse);
        }
      }
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    // For 204 No Content responses
    if (response.status === 204) {
      return null;
    }
    
    return await response.json();
  }

  // CRUD operations
  get(endpoint) {
    return this.request(endpoint);
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Použitie
apiClient.get('/api/companies/')
  .then(companies => console.log(companies))
  .catch(error => console.error('Error:', error));
React Hook pre API Calls
javascript
import { useState, useEffect } from 'react';
import { apiClient } from './apiClient';

export const useApi = (endpoint, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiClient.get(endpoint);
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint]);

  return { data, loading, error };
};

// Použitie v komponente
function CompaniesComponent() {
  const { data: companies, loading, error } = useApi('/api/companies/');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {companies.map(company => (
        <div key={company.id}>{company.nazov}</div>
      ))}
    </div>
  );
}
🎯 Response Štruktúry
Úspešné Prihlásenie
json
{
  "user": {
    "id": 1,
    "email": "test@example.com",
    "meno": "Janko",
    "priezvisko": "Hrasko",
    "rola": "student",
    "aktivny": true
  },
  "tokens": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}
Chybové Response
json
{
  "error": "Invalid credentials",
  "code": "AUTH_ERROR",
  "details": "Email or password is incorrect"
}
📋 Testovacie Údaje
Používatelia:
javascript
const testUsers = [
  {
    email: "student@example.com",
    password: "password123",
    rola: "student"
  },
  {
    email: "garant@example.com", 
    password: "password123",
    rola: "garant"
  },
  {
    email: "firma@example.com",
    password: "password123",
    rola: "firma"
  }
];
🚀 Quick Start Pre React
1. Inštalácia závislostí
bash
npm install axios
2. Základná konfigurácia
javascript
// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor pre pridanie tokenu
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor pre error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle token refresh
    }
    return Promise.reject(error);
  }
);

export default api;
3. Použitie v komponente
javascript
import React, { useState, useEffect } from 'react';
import api from './services/api';

function App() {
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await api.get('/api/companies/');
        setCompanies(response.data);
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    };

    fetchCompanies();
  }, []);

  return (
    <div>
      <h1>Companies</h1>
      {companies.map(company => (
        <div key={company.id}>{company.nazov}</div>
      ))}
    </div>
  );
}

export default App;
Táto dokumentácia poskytuje kompletný prehľad všetkých endpointov s praktickými React príkladmi pre rýchly začiatok vývoja frontend aplikácie! 🚀


