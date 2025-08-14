# Rent Roll Parser Feature

## Overview

The Rent Roll Parser is a standalone feature that allows users to upload their rent roll files and receive processed Excel output with extracted tenant information. This feature is separate from the tenant onboarding process and provides a quick way to parse and organize rent roll data.

## Features

- **File Upload**: Support for Excel (.xlsx, .xls), CSV (.csv), and PDF (.pdf) files
- **AI Processing**: Automated extraction of tenant information, property details, and financial data
- **Progress Tracking**: Real-time progress updates during file processing
- **Excel Output**: Download processed data in Excel format
- **Error Handling**: Comprehensive error handling and user feedback

## How to Use

1. **Access the Feature**: Click the "Rent Roll Parser" button on the dashboard
2. **Upload File**: Drag and drop or click to upload your rent roll file
3. **Process**: Click "Process Rent Roll" to start the AI processing
4. **Download**: Once processing is complete, download the Excel output

## File Requirements

- **Supported Formats**: Excel (.xlsx, .xls), CSV (.csv), PDF (.pdf)
- **Maximum Size**: 10MB
- **Content**: Should contain tenant information, property details, and financial data

## API Endpoints

### POST /api/rent-roll-parser
Uploads and processes rent roll files.

**Request**: FormData with file
**Response**: Processing results with metadata

### POST /api/rent-roll-parser/download
Generates and serves Excel file downloads.

**Request**: JSON with fileId
**Response**: Excel file blob

## Technical Implementation

### Components
- `RentRollParserPage`: Main page component
- `RentRollUpload`: Reused upload component from tenant onboarding

### Database
- Files are stored in Supabase storage bucket "rent-rolls"
- Metadata is saved to `uploaded_files` table with `document_type: "rent_roll_parser"`

### Processing
- Files are uploaded to Supabase storage
- AI processing extracts tenant and property information
- Results are stored in file metadata
- Excel output is generated on-demand

## Future Enhancements

- Integration with actual AI processing services
- Support for more file formats
- Batch processing capabilities
- Custom Excel templates
- Data validation and cleaning features
