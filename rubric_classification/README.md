# REGAI Assignment Grading System

The REGAI Assignment Grading System is a web application that allows instructors to manage and grade assignments for their students. It has a Django backend and a React.js frontend.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
3. [Running the Application](#running-the-application)
  - [Running the Backend](#running-the-backend)
  - [Running the Frontend](#running-the-frontend)
4. [Project Structure](#project-structure)
5. [Deployment](#deployment)
6. [Contributing](#contributing)
7. [License](#license)

## Prerequisites

To run this application locally, you'll need the following software installed on your system:

- Python 3.9 or higher
- Node.js 14 or higher
- npm 6 or higher
- Django

## Installation

### Backend Setup

1. Clone the repository:

  ```bash
  git clone https://github.com/your-username/REGAI-Assignment-Grading.git
  cd REGAI-Assignment-Grading
```
2. Create and activate a virtual environment:
```bash
 python -m venv venv
source venv/bin/activate
```
3. Install the backend dependencies
```bash
pip install -r requirements.txt 
```
4. Apply the database migrations
```bash
cd rubric_classification
python manage.py migrate
```
### Frontend Setup
1. Navigate to the frontend directory: 
```bash
cd rubric_classification/regai-frontend
```
2. Install frontend dependencies: 
```bash
npm install
```
## Running the application
### Running the backend 
1. In the rubric_classification directory, start the Django development server
```bash
python manage.py runserver 
```
The backend will be available at http://localhost:8000.
### Running the frontend
1. In the rubric_classification/regai-frontend directory, start the React development server:
```bash
npm start 
```
The frontend will be available at http://localhost:3000.
## Project Structure
The project has the following structure: 
REGAI-Assignment-Grading/
├── requirements.txt

├── .idea/

├── rubric_classification/

│   ├── core/

│   ├── regai/

│   │   ├── admin.py

│   │   ├── apps.py

│   │   ├── models.py

│   │   ├── serializers.py

│   │   ├── tests.py

│   │   ├── urls.py

│   │   ├── views.py

│   │   ├── grading/

│   │   ├── migrations/

│   │   ├── rubric_manager/

│   │   └── templates/

│   ├── db.sqlite3

│   ├── manage.py

│   └── regai-frontend/

│       ├── package.json

│       ├── package-lock.json

│       ├── public/

│       └── src/

│           ├── components/

│           ├── contexts/

│           ├── utils/

│           ├── App.js

│           ├── index.js

│           └── ...

└── submissions/

## Deployment
To deploy the application, you can follow a standard deployment process for Django and React.js applications. This may involve setting up a production server, configuring web servers like Nginx, and managing the deployment process with tools like Docker or Kubernetes.
## Contributing
If you would like to contribute to this project, please follow the standard GitHub workflow:

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request