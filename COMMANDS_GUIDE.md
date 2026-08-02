# ⚡ Used Car Showroom ERP - Quick Commands Cheat Sheet

### 🐍 1. Start Backend Server (`http://localhost:8000`)
```powershell
cd backend;
 .\venv\Scripts\activate
 python -m uvicorn app.main:app --reload --port 8000
```

---

### ⚛️ 2. Start Frontend App (`http://localhost:5173`)
```powershell
cd frontend;
npm run dev
```

---

### 🔹 3. Activate Virtual Environment
```powershell
cd backend; .\venv\Scripts\Activate.ps1
```

---

### 🧪 4. Run E2E Test & DB Verification
```powershell
cd backend; .\venv\Scripts\python.exe e2e_verification.py
```

---

### 🛑 5. Stop Port 8000 / Clear Busy Port (If WinError 10013 occurs)
```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess -Force
```

---

### 🔑 6. Default Live Database Credentials
- **ADMIN**: `admin@showroom.com` | `AdminPassword123!`
- **MANAGER**: `manager@showroom.com` | `ManagerPassword123!`
- **EMPLOYEE**: `staff@showroom.com` | `StaffPassword123!`
- **Swagger Docs**: `http://localhost:8000/docs`
