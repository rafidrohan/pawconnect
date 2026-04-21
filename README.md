# 🐾 Lost & Found Pet Tracking & Recovery Platform

## 📌 Overview
The Lost & Found Pet Tracking & Recovery Platform is a MySQL-based relational database system designed to manage lost and found pet cases in a centralized and structured manner.

The system enables:
- Structured case registration
- Automated matching between lost and found pets
- Case lifecycle tracking
- Data-driven recovery insights

It replaces scattered social media reporting with an organized and efficient solution.

---

## ❗ Problem Statement
Current lost-and-found pet reporting relies on fragmented platforms such as social media, leading to:

- Scattered and unstructured data
- Duplicate or inconsistent reports
- Manual and inefficient matching
- Delayed recovery

This system addresses these challenges through centralized data management and automated matching.

---

## 🚀 Core Features

### 1. Lost Pet Reporting
Users can register a lost pet by providing:
- Pet details (species, breed, color, age)
- Last seen location
- Date & time
- Description
- Optional reward

---

### 2. Found Pet Reporting
Users can report found pets including:
- Discovery location
- Condition of the pet
- Date & time
- Description and photos

---

### 3. Pet Profile Management
Each pet is stored as a structured profile containing:
- Species (dog, cat, etc.)
- Breed, color
- Gender, age
- Distinguishing marks
- Multiple images

This improves identification accuracy and matching quality.

---

### 4. Automated Match Detection
The system automatically suggests potential matches between lost and found reports.

Matching process:
1. Filter by **same species**
2. Compare:
   - Breed
   - Color
   - Location proximity
3. Generate a **match score**

This reduces manual effort and improves recovery speed.

---

### 5. Case Lifecycle Management
Each case progresses through defined stages:
- REPORTED
- UNDER_REVIEW
- MATCH_FOUND
- RECOVERED
- CLOSED

This ensures structured tracking and monitoring.

---

### 6. Location-Based Search
Users can search and filter cases by:
- City
- Area

This allows quick identification of nearby reports.

---

### 7. Image Management
The system supports image uploads for:
- Pet profiles
- Case reports

This enables visual comparison of pets.

---

### 8. Notification System
Users receive updates regarding:
- Match suggestions
- Case status changes

---

### 9. Match Review & Confirmation
Users or admins can:
- Review suggested matches
- Confirm or reject matches

This ensures accurate recovery decisions.

---

### 10. Recovery Analytics
The system provides insights such as:
- Recovery success rate
- Most commonly lost species/breeds
- High-risk locations
- Time-based trends

---

## 🧠 System Design Highlights
- Relational database (MySQL)
- Normalized schema with multiple entities
- Use of ENUMs for controlled values
- Indexing for efficient queries
- Support for automated matching logic

---

## 🎯 Goal
To improve pet recovery efficiency by providing a structured, automated, and centralized system for managing lost and found cases.