# Eunoia – Full-Stack Journal & Gallery Web Application

Eunoia is a full-stack web application that allows users to create accounts, manage personal profiles, and create journal entries with optional images and location data. The application includes secure authentication, dynamic server-side rendering, and AI-powered image generation. This project demonstrates full-stack development principles including authentication, relational database design, middleware architecture, and RESTful API implementation.

Built with Node.js, Express, PostgreSQL, and EJS.

---

## Tech Stack

### Backend
- Node.js
- Express.js
- PostgreSQL
- JWT Authentication
- RESTful API design

### Frontend
- EJS templating
- HTML5
- CSS3
- JavaScript

### External Services
- OpenAI API (AI image generation)

---

## Core Features

### Secure Authentication
- User signup and login
- Password hashing
- JWT-based authentication
- Protected API routes

### Profile Management
- Editable bio
- Theme preference support (light/dark)
- Profile image upload
- Account deletion with cascade delete for entries

### Journal Entry System
- Create, edit, delete entries
- Optional image, date, and location fields
- Relational database design
- Gallery-style display

### AI Image Generation
- Generate images from text prompts using OpenAI
- Integrated into the user workflow

---

## Application Architecture

- Modular route structure
- Separated database model files
- Authentication middleware
- Environment-based configuration
- RESTful API endpoints

The project follows separation of concerns between routing, database logic, middleware, and views.

---

## Database Design

### Users Table
- Unique username and email
- Hashed password storage
- Profile metadata (bio, theme, image)
- Timestamp tracking

### Entries Table
- Foreign key relationship to users
- Title and body content
- Optional image, location, and date fields
- Cascade delete on user removal

**Relationship:**  
One user → Many entries

---

## Running the Project Locally

### Prerequisites
- Node.js (v14+)
- PostgreSQL

---

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/eunoia-webapp.git
cd eunoia-webapp
npm install
```

### 2. Create a PostgreSQL Database

Create a new database:

```bash
createdb eunoia_db
```

### 3. Set Up Environment Variables
Create a `.env` file in the root directory with the following content:

```env
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/eunoia_db
JWT_SECRET=your_jwt_secret_key
OPENAI_API_KEY=your_openai_api_key
``` 

### 4. Start the Server

```bash
npm start
```
The application will be running at `http://localhost:3000`.
---

# API Overview

## Authentication

- `POST /signup`
- `POST /login`

---

## Entries (Protected Routes)

- `GET /api/entries`
- `POST /api/entries`
- `PUT /api/entries/:id`
- `DELETE /api/entries/:id`

---

## Account

- `DELETE /api/account`

---

## AI Image Generation

- `POST /api/generate`

All protected routes require a valid JWT token.

---

# Design Decisions

- JWT used for stateless authentication  
- PostgreSQL chosen for relational integrity  
- Modular backend structure for maintainability  
- Environment variables for secure configuration  
- Server-side rendering using EJS for simplicity and clarity  

---

# Known Limitations

- Requires local PostgreSQL setup  
- AI features depend on external API availability  
- File uploads stored locally  
- No email verification or password reset functionality  
- Designed primarily for local development  

---

# Future Improvements

- Deploy to cloud platform (Render / Railway / AWS)  
- Cloud storage for images (S3 / Cloudinary)  
- Email verification & password reset  
- Search and pagination  
- UI/UX refinements  

---

## What I Learned

- Designing relational database schemas
- Implementing secure authentication using JWT
- Structuring scalable Express applications
- Managing environment variables securely
- Integrating third-party APIs into a full-stack workflow

---

# Author

**Ayra Babar**  
Computer Science Student  
Full-Stack Developer