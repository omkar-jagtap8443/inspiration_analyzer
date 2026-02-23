# Inspiration_Analyzer

A full-stack web application built with **React (Vite)** on the frontend and **Python** on the backend.
Upload your Role Models Video and yours to get AI feedback on how you can talk like your RoleModel.
You can paste the URL Link or search in Youtube section for Role Model's Video but download it and then upload on the web.
For your video you can can upload it or record yourself directly.

## 📂 Project Structure
├── backend/ # Python backend (API server)

├── public/ # Public assets for frontend

├── src/ # Frontend source code (React)

├── .env # Environment variables (not uploaded)

├── .env-example # Sample environment variables file

├── package.json # Node dependencies and scripts

├── requirements.txt # Python dependencies

├── vite.config.js # Vite configuration

└── README.md # Project documentation

## ⚙️ Setup Instructions

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Siddhimore123/Inspiration_Analyzer.git
cd Inspiration_Analyzer

2️⃣ Backend Setup (Python)
Create and activate a virtual environment:
python -m venv venv
# On Windows
venv\Scripts\activate
# On Mac/Linux
source venv/bin/activate

python -m venv .\backend\venv310     
backend\venv310\Scripts\Activate.ps1 

python -m pip install --upgrade pip        

Install dependencies:
pip install -r requirements.txt

Run the backend server:
python backend/analysis.py

3️⃣ Frontend Setup (React + Vite)(in other terminal keep the previous one running)
Install Node dependencies:
npm install

Run the frontend:
npm run dev

The app will start at:
http://localhost:5173/


