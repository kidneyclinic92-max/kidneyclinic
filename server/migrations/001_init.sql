-- Schema for clinic_local

CREATE TABLE IF NOT EXISTS doctors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  specialization TEXT NOT NULL,
  bio TEXT NOT NULL,
  photoUrl TEXT,
  interviewUrl TEXT
);

CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  summary TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  text TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  author TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS home (
  id INTEGER PRIMARY KEY,
  features_title TEXT,
  features_subtitle TEXT,
  showcase_title TEXT,
  showcase_subtitle TEXT
);

-- Seed empty single row for home
INSERT INTO home (id, features_title, features_subtitle, showcase_title, showcase_subtitle)
VALUES (1, NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;




