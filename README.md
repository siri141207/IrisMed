# IrisMed

IrisMed is an AI-powered eye health record intelligence platform that transforms eye examination reports into structured, understandable, and searchable information.

It allows users to upload eye reports, extract important clinical information, compare reports over time, ask document-specific questions, and manage their eye records from a single interface.

## Overview

Eye examination reports often contain prescriptions, examination findings, treatment instructions, and follow-up information in formats that can be difficult to understand or compare.

IrisMed addresses this by combining document processing, AI-powered extraction, and Retrieval-Augmented Generation (RAG) to make uploaded eye records easier to explore while keeping the original documents available for reference.

IrisMed is designed to explain and organize information from uploaded records. It is not intended to diagnose medical conditions or replace professional medical advice.

## Features

### Report Upload and Processing

- Upload PDF, JPG, and PNG eye examination reports
- Process uploaded documents using the backend document pipeline
- Extract structured information from reports
- Preserve access to the original document

### Eye Report Extraction

IrisMed organizes relevant information including:

- Patient and examination details
- Eye prescription
- Sphere, cylinder, and axis values
- Visual acuity
- Examination findings
- Medications and treatment
- Follow-up information
- Doctor recommendations
- Report summary

### Report Comparison

Compare two reports belonging to the same patient to identify changes over time.

The comparison can highlight changes in:

- Prescription
- Visual acuity
- Intraocular pressure
- Eye surface findings
- Examination observations
- Treatment and follow-up recommendations

### Ask IrisMed

Users can ask questions about an uploaded report using document-specific AI chat.

The RAG layer retrieves relevant sections from the uploaded document before generating an answer, helping keep responses grounded in the available report content.

Example questions:

- What changed between these examinations?
- Did the prescription change?
- What was recommended during the follow-up?
- What were the main findings in this report?

### My Eye Records

Users can:

- View uploaded reports
- Search their records
- Open individual reports
- Review extracted information
- Access original documents
- Delete records

### Multilingual Interface

The interface supports:

- English
- Telugu
- Hindi

### Accessibility

IrisMed includes accessibility-focused interface controls such as:

- Light theme
- Dark theme
- Eye Comfort theme
- High Contrast theme
- System theme
- Multiple text-size options
- High Visibility
- Comfortable Spacing
- Reduced Motion
- Persistent accessibility preferences

## Technology Stack

### Frontend

- React
- Vite
- JavaScript
- CSS

### Backend

- FastAPI
- Python
- SQLAlchemy
- SQLite

### AI

- Google Gemini API
- Gemini embeddings
- Retrieval-Augmented Generation (RAG)

### Development

- Git
- GitHub
- VS Code

## Architecture

```text
User
  |
  v
React Frontend
  |
  v
FastAPI Backend
  |
  +--------------------+
  |                    |
  v                    v
Document Processing    Database
  |
  v
Gemini AI
  |
  v
Embedding + RAG
  |
  v
Document-Specific Response
