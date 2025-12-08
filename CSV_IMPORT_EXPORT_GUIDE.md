# CSV Import/Export Guide for Student Fees

This guide explains how to use the CSV import and export features for managing student fees and invoices.

## Features

### Export (Download) CSV

The export feature allows you to download fee items or student invoices in CSV format.

#### Export Fee Items

**Available Fields:**
- Fee Name (required)
- Description
- Amount (₦) (required)
- Is Compulsory (Yes/No)
- Target Class
- Target Term
- Priority
- Allow Installments (Yes/No)

**Example CSV:**
```csv
Fee Name,Description,Amount (₦),Is Compulsory,Priority
Tuition Fee,Annual tuition,150000,Yes,1
Lab Fee,Science laboratory,25000,No,2
Library Fee,Library access,10000,Yes,3
```

#### Export Student Invoices

**Available Fields:**
- Student Name (required for import)
- Admission Number (required for import)
- Class
- Invoice Number
- Total Amount (required)
- Amount Paid
- Balance (Outstanding)
- Status (Paid/Unpaid/Partial)
- Due Date
- Term
- Created Date

**Example CSV:**
```csv
Student Name,Admission Number,Class,Invoice Number,Total Amount,Amount Paid,Balance,Status,Due Date
John Doe,ADM001,JSS 1,INV-2024-001,175000,100000,75000,Partially Paid,2024-03-15
Jane Smith,ADM002,JSS 1,INV-2024-002,175000,175000,0,Paid,2024-03-15
```

### Import (Upload) CSV

The import feature allows you to bulk create or update fee items and student invoices.

#### Importing Fee Items

**Required Fields:**
- Fee Name
- Amount

**Optional Fields:**
- Description
- Is Compulsory (Yes/No, default: Yes)
- Allow Installments (Yes/No, default: No)
- Priority (number, default: 1)

**Behavior:**
- If a fee with the same name exists, it will be updated
- If it doesn't exist, a new fee will be created

**Example CSV:**
```csv
Fee Name,Amount,Is Compulsory,Description
Tuition Fee,150000,Yes,Annual tuition for the academic year
Lab Fee,25000,No,Science laboratory usage fee
Transport Fee,30000,No,Bus transportation fee
```

#### Importing Student Invoices

**Required Fields:**
- Student Name OR Admission Number (at least one required)
- Total Amount

**Optional Fields:**
- Amount Paid (default: 0)
- Status (default: Unpaid)
- Due Date
- Invoice Number (auto-generated if not provided)

**Behavior:**
- Students are matched by Admission Number (if provided) or Name
- If an invoice with the same invoice number exists, it will be updated
- If it doesn't exist, a new invoice will be created

**Example CSV:**
```csv
Admission Number,Total Amount,Amount Paid,Status,Due Date
ADM001,175000,50000,Partially Paid,2024-06-30
ADM002,175000,0,Unpaid,2024-06-30
ADM003,160000,160000,Paid,2024-06-30
```

## Using the Feature

### Export Process

1. Navigate to **Student Finance** → **Fee Configuration** tab
2. Scroll down to the **Import / Export** section
3. Click on the **Export CSV** tab
4. Select export type (Fee Items or Student Invoices)
5. Apply filters (optional):
   - Filter by Class
   - Filter by Term
   - Filter by Status (for invoices)
6. Select which fields to include in the export
7. Click **Download CSV**

### Import Process

1. Navigate to **Student Finance** → **Fee Configuration** tab
2. Scroll down to the **Import / Export** section
3. Click on the **Import CSV** tab
4. Select import type (Fee Items or Student Invoices)
5. Click the upload area or drag and drop your CSV file
6. Review the column mapping:
   - Auto-detected mappings are pre-filled
   - Adjust mappings as needed
   - Preview the data
7. Click **Confirm & Continue**
8. If validation errors are found:
   - Review the errors
   - Choose to proceed with valid rows only OR
   - Cancel and fix the CSV file
9. Data will be imported and you'll see a success message

## Tips

### Excel Formatting
- When exporting from Excel, format numeric columns (like phone numbers, amounts) as "Text" to prevent scientific notation
- Use UTF-8 encoding when saving CSV files to preserve special characters

### Data Validation
- The system validates data before import
- You'll see detailed error messages for any invalid data
- You can proceed with valid rows only, or cancel to fix all issues

### Matching Logic
- **Fee Items**: Matched by name (case-insensitive)
- **Student Invoices**: Matched by invoice number or created new if not found
- **Students**: Matched by admission number first, then by name

### Boolean Values
- Use "Yes" or "No" for boolean fields (Is Compulsory, Allow Installments)
- Case-insensitive (yes/Yes/YES all work)

### Date Format
- Use ISO format: YYYY-MM-DD (e.g., 2024-03-15)
- Or your locale's standard date format

## Common Issues

### Issue: "Student not found"
**Solution:** Ensure the admission number or student name exactly matches an existing student in the system.

### Issue: "Amount must be a valid positive number"
**Solution:** Check that amount fields contain only numbers, no currency symbols or text.

### Issue: "Scientific notation in phone numbers"
**Solution:** In Excel, format the column as "Text" before entering data.

### Issue: "CSV file must have a header row"
**Solution:** Ensure the first row contains column headers.

## Security & Permissions

- Only users with **Accountant**, **Admin**, or **Principal** roles can access import/export features
- All imports are logged for audit purposes
- Existing records are updated, not deleted, preserving data integrity
