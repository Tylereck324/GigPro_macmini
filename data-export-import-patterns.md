# Data Export and Import Patterns

## Introduction

Data portability is crucial for user trust and data sovereignty. For GigPro, providing robust export and import functionality allows gig workers to back up their income and expense data, transfer it between devices, and maintain control over their information. This document covers best practices for implementing data export/import features in React applications, particularly for IndexedDB-backed applications.

## Why Data Export/Import Matters

### User Benefits

- **Backup Protection**: Guard against data loss from browser cache clearing
- **Data Portability**: Move data between browsers or devices
- **Privacy Control**: Users own and control their data
- **Archival**: Save historical data for tax purposes
- **Migration**: Facilitate upgrades or platform changes

### Developer Benefits

- **User Trust**: Demonstrates commitment to user data ownership
- **Testing**: Seed test data or replicate issues
- **Development**: Share datasets between team members
- **Recovery**: Help users recover from data corruption

## Export Strategies

### JSON Export (Recommended)

JSON is the most versatile format for structured data:

**Advantages:**
- Preserves data types (objects, arrays, nested structures)
- Human-readable and editable
- Easy to parse and validate
- Supports complex schemas
- Native JavaScript support

**Disadvantages:**
- Larger file size than CSV
- Not easily opened in spreadsheet applications

### CSV Export (Complementary)

CSV is ideal for flat, tabular data:

**Advantages:**
- Opens in Excel, Google Sheets, etc.
- Smaller file size
- Universal support
- Easy for users to view and edit

**Disadvantages:**
- Flat structure only (no nested objects)
- Data type ambiguity
- Requires separate files for multiple tables

### Recommendation for GigPro

- **Primary**: JSON for complete database backup/restore
- **Secondary**: CSV for income and expense reports (user analysis)

## FileSaver.js - The Standard Solution

FileSaver.js is an HTML5 saveAs() implementation, perfect for web apps that generate files on the client-side.

### Installation

```bash
npm install file-saver
npm install --save-dev @types/file-saver  # TypeScript types
```

### Basic Usage

```typescript
import { saveAs } from 'file-saver'

// Save text file
const text = 'Hello, World!'
const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
saveAs(blob, 'hello.txt')

// Save JSON
const data = { name: 'GigPro', version: '1.0' }
const json = JSON.stringify(data, null, 2)
const jsonBlob = new Blob([json], { type: 'application/json;charset=utf-8' })
saveAs(jsonBlob, 'data.json')

// Save CSV
const csv = 'Name,Email\nJohn,john@example.com'
const csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
saveAs(csvBlob, 'data.csv')
```

### Important Considerations

1. **User Interaction Required**: saveAs must be run within a user interaction event (onClick, onTouchDown). setTimeout will prevent saveAs from triggering.

2. **Unicode Support**: Pass `{ autoBom: true }` to automatically provide Unicode text encoding hints:

```typescript
const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
saveAs(blob, 'data.txt', { autoBom: true })
```

3. **Production Ready**: FileSaver is recommended for production given the many ways manually downloading files can fail across browsers.

## Exporting IndexedDB Data

### Complete Database Export

Export all tables with metadata:

```typescript
import { saveAs } from 'file-saver'
import { db } from '@/lib/db'

export async function exportDatabase() {
  try {
    // Gather all data from all tables
    const exportData = {
      version: db.verno,
      exportDate: new Date().toISOString(),
      appVersion: '1.0.0',
      tables: {
        income_entries: await db.income_entries.toArray(),
        daily_data: await db.daily_data.toArray(),
        fixed_expenses: await db.fixed_expenses.toArray(),
        variable_expenses: await db.variable_expenses.toArray(),
        payment_plans: await db.payment_plans.toArray(),
        payment_plan_payments: await db.payment_plan_payments.toArray(),
        settings: await db.settings.toArray(),
      },
    }

    // Convert to JSON with formatting
    const json = JSON.stringify(exportData, null, 2)

    // Create blob
    const blob = new Blob([json], {
      type: 'application/json;charset=utf-8',
    })

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `gigpro-backup-${timestamp}.json`

    // Trigger download
    saveAs(blob, filename)

    return { success: true, filename }
  } catch (error) {
    console.error('Export failed:', error)
    return { success: false, error }
  }
}
```

### Selective Export (Single Table)

```typescript
export async function exportIncomeEntries(
  startDate?: Date,
  endDate?: Date
) {
  try {
    let query = db.income_entries

    // Optional date filtering
    if (startDate && endDate) {
      query = query.where('date').between(startDate, endDate, true, true)
    }

    const entries = await query.toArray()

    const exportData = {
      exportDate: new Date().toISOString(),
      table: 'income_entries',
      count: entries.length,
      dateRange: startDate && endDate ? { startDate, endDate } : null,
      data: entries,
    }

    const json = JSON.stringify(exportData, null, 2)
    const blob = new Blob([json], {
      type: 'application/json;charset=utf-8',
    })

    const filename = `gigpro-income-${new Date().toISOString().split('T')[0]}.json`
    saveAs(blob, filename)

    return { success: true, count: entries.length }
  } catch (error) {
    console.error('Export failed:', error)
    return { success: false, error }
  }
}
```

### CSV Export for Reports

```typescript
export async function exportIncomeToCSV(
  startDate: Date,
  endDate: Date
) {
  try {
    const entries = await db.income_entries
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray()

    // Define CSV headers
    const headers = ['Date', 'Platform', 'Start Time', 'End Time', 'Amount', 'Notes']

    // Convert entries to CSV rows
    const rows = entries.map(entry => [
      entry.date.toISOString().split('T')[0],
      entry.platform,
      entry.startTime?.toISOString() || '',
      entry.endTime?.toISOString() || '',
      entry.amount.toFixed(2),
      `"${entry.notes || ''}"`, // Wrap in quotes to handle commas
    ])

    // Combine headers and rows
    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n')

    // Create blob
    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8',
    })

    const filename = `gigpro-income-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.csv`
    saveAs(blob, filename, { autoBom: true }) // autoBom for Excel compatibility

    return { success: true, count: entries.length }
  } catch (error) {
    console.error('CSV export failed:', error)
    return { success: false, error }
  }
}
```

### Export with Data Serialization

Handle special types (Dates, undefined):

```typescript
function serializeForExport(obj: any): any {
  if (obj instanceof Date) {
    return { __type: 'Date', value: obj.toISOString() }
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeForExport)
  }

  if (obj !== null && typeof obj === 'object') {
    const serialized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeForExport(value)
    }
    return serialized
  }

  return obj
}

export async function exportDatabaseWithSerialization() {
  const data = {
    version: db.verno,
    exportDate: new Date().toISOString(),
    tables: {
      income_entries: await db.income_entries.toArray(),
    },
  }

  // Serialize special types
  const serialized = serializeForExport(data)

  const json = JSON.stringify(serialized, null, 2)
  const blob = new Blob([json], {
    type: 'application/json;charset=utf-8',
  })

  saveAs(blob, `gigpro-backup-${Date.now()}.json`)
}
```

## Importing Data

### File Upload Component

```typescript
'use client'

import { useRef, useState } from 'react'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  accept?: string
  label?: string
}

export function FileUpload({
  onFileSelect,
  accept = '.json',
  label = 'Choose file',
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string>('')

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFileName(file.name)
      onFileSelect(file)
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={() => inputRef.current?.click()}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        {label}
      </button>
      {fileName && (
        <span className="ml-3 text-sm text-gray-600">
          {fileName}
        </span>
      )}
    </div>
  )
}
```

### Drag and Drop Upload

```typescript
'use client'

import { useState, DragEvent } from 'react'

interface DragDropUploadProps {
  onFileSelect: (file: File) => void
  accept?: string
}

export function DragDropUpload({
  onFileSelect,
  accept = '.json',
}: DragDropUploadProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const file = files[0]

    if (file && file.name.endsWith(accept.replace('.', ''))) {
      onFileSelect(file)
    } else {
      alert(`Please upload a ${accept} file`)
    }
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 bg-gray-50'
      }`}
    >
      <p className="text-gray-600">
        Drag and drop your backup file here, or click to browse
      </p>
    </div>
  )
}
```

### Reading JSON Files

```typescript
export async function readJSONFile(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const data = JSON.parse(text)
        resolve(data)
      } catch (error) {
        reject(new Error('Invalid JSON file'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsText(file)
  })
}

// Usage
const handleFileSelect = async (file: File) => {
  try {
    const data = await readJSONFile(file)
    console.log('Parsed data:', data)
  } catch (error) {
    console.error('Error reading file:', error)
  }
}
```

### Importing to IndexedDB

```typescript
import { z } from 'zod'
import { db } from '@/lib/db'

// Define schema for validation
const importSchema = z.object({
  version: z.number(),
  exportDate: z.string(),
  tables: z.object({
    income_entries: z.array(z.any()).optional(),
    daily_data: z.array(z.any()).optional(),
    fixed_expenses: z.array(z.any()).optional(),
    variable_expenses: z.array(z.any()).optional(),
    payment_plans: z.array(z.any()).optional(),
    payment_plan_payments: z.array(z.any()).optional(),
    settings: z.array(z.any()).optional(),
  }),
})

export async function importDatabase(file: File, mode: 'merge' | 'replace' = 'merge') {
  try {
    // Read file
    const data = await readJSONFile(file)

    // Validate structure
    const validatedData = importSchema.parse(data)

    // Optional: Check version compatibility
    if (validatedData.version > db.verno) {
      throw new Error(
        `Backup is from a newer version (${validatedData.version}). Current version: ${db.verno}`
      )
    }

    // Import in transaction
    await db.transaction('rw', db.tables, async () => {
      // Clear existing data if replace mode
      if (mode === 'replace') {
        await Promise.all(db.tables.map(table => table.clear()))
      }

      // Import each table
      const { tables } = validatedData

      if (tables.income_entries) {
        await db.income_entries.bulkPut(deserializeData(tables.income_entries))
      }

      if (tables.daily_data) {
        await db.daily_data.bulkPut(deserializeData(tables.daily_data))
      }

      if (tables.fixed_expenses) {
        await db.fixed_expenses.bulkPut(deserializeData(tables.fixed_expenses))
      }

      if (tables.variable_expenses) {
        await db.variable_expenses.bulkPut(deserializeData(tables.variable_expenses))
      }

      if (tables.payment_plans) {
        await db.payment_plans.bulkPut(deserializeData(tables.payment_plans))
      }

      if (tables.payment_plan_payments) {
        await db.payment_plan_payments.bulkPut(deserializeData(tables.payment_plan_payments))
      }

      if (tables.settings) {
        await db.settings.bulkPut(deserializeData(tables.settings))
      }
    })

    return { success: true, message: 'Data imported successfully' }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid backup file format',
        details: error.errors,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Import failed',
    }
  }
}

// Deserialize special types (Dates)
function deserializeData(data: any[]): any[] {
  return data.map(deserializeObject)
}

function deserializeObject(obj: any): any {
  if (obj && obj.__type === 'Date') {
    return new Date(obj.value)
  }

  if (Array.isArray(obj)) {
    return obj.map(deserializeObject)
  }

  if (obj !== null && typeof obj === 'object') {
    const deserialized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      deserialized[key] = deserializeObject(value)
    }
    return deserialized
  }

  return obj
}
```

### Import with Progress Tracking

```typescript
export async function importDatabaseWithProgress(
  file: File,
  onProgress: (progress: number, message: string) => void
) {
  try {
    onProgress(10, 'Reading file...')
    const data = await readJSONFile(file)

    onProgress(20, 'Validating data...')
    const validatedData = importSchema.parse(data)

    onProgress(30, 'Starting import...')

    await db.transaction('rw', db.tables, async () => {
      const tables = Object.entries(validatedData.tables)
      const totalTables = tables.length

      for (let i = 0; i < totalTables; i++) {
        const [tableName, tableData] = tables[i]
        const progress = 30 + ((i + 1) / totalTables) * 60

        onProgress(progress, `Importing ${tableName}...`)

        if (tableData && Array.isArray(tableData)) {
          await (db as any)[tableName].bulkPut(deserializeData(tableData))
        }
      }
    })

    onProgress(100, 'Import complete!')

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Import failed',
    }
  }
}

// Usage component
export function ImportWithProgress() {
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')

  const handleImport = async (file: File) => {
    const result = await importDatabaseWithProgress(
      file,
      (progress, message) => {
        setProgress(progress)
        setMessage(message)
      }
    )

    if (result.success) {
      alert('Import successful!')
    } else {
      alert(`Import failed: ${result.error}`)
    }
  }

  return (
    <div>
      <FileUpload onFileSelect={handleImport} />
      {progress > 0 && (
        <div className="mt-4">
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">{message}</p>
        </div>
      )}
    </div>
  )
}
```

## CSV Import

### Using react-papaparse

React-papaparse provides drag-and-drop CSV upload with parsing:

```bash
npm install react-papaparse
```

```typescript
import { CSVReader } from 'react-papaparse'

export function CSVImport() {
  const handleOnDrop = (data: any[]) => {
    console.log('Parsed data:', data)
    // Process CSV rows
    data.forEach(row => {
      const { Date, Platform, Amount } = row.data
      // Add to IndexedDB
    })
  }

  const handleOnError = (error: Error) => {
    console.error('CSV parse error:', error)
  }

  return (
    <CSVReader
      onDrop={handleOnDrop}
      onError={handleOnError}
      config={{
        header: true, // First row as headers
        dynamicTyping: true, // Auto-convert numbers
      }}
    >
      <span>Drop CSV file here or click to upload</span>
    </CSVReader>
  )
}
```

### Manual CSV Parsing

```typescript
export function parseCSV(csvText: string): any[] {
  const lines = csvText.split('\n')
  const headers = lines[0].split(',').map(h => h.trim())

  const rows = lines.slice(1).map(line => {
    const values = line.split(',')
    const row: any = {}

    headers.forEach((header, index) => {
      let value = values[index]?.trim()

      // Remove quotes
      if (value?.startsWith('"') && value?.endsWith('"')) {
        value = value.slice(1, -1)
      }

      // Try to parse as number
      const num = Number(value)
      if (!isNaN(num) && value !== '') {
        row[header] = num
      } else {
        row[header] = value || null
      }
    })

    return row
  })

  return rows.filter(row => Object.values(row).some(v => v !== null))
}

// Read and parse CSV file
export async function readCSVFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const data = parseCSV(text)
        resolve(data)
      } catch (error) {
        reject(new Error('Failed to parse CSV'))
      }
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
```

## Complete Export/Import Component

```typescript
'use client'

import { useState } from 'react'
import { saveAs } from 'file-saver'
import { db } from '@/lib/db'
import { DragDropUpload } from './DragDropUpload'
import { exportDatabase, importDatabase } from '@/lib/export-import'

export function DataManagement() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge')

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportDatabase()
      if (result.success) {
        alert(`Backup created: ${result.filename}`)
      }
    } catch (error) {
      alert('Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async (file: File) => {
    if (
      importMode === 'replace' &&
      !confirm('This will replace all existing data. Continue?')
    ) {
      return
    }

    setIsImporting(true)
    try {
      const result = await importDatabase(file, importMode)
      if (result.success) {
        alert('Import successful!')
        window.location.reload() // Refresh to show new data
      } else {
        alert(`Import failed: ${result.error}`)
      }
    } catch (error) {
      alert('Import failed')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      {/* Export Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Export Data</h2>
        <p className="text-gray-600 mb-4">
          Download a complete backup of your GigPro data as JSON.
        </p>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {isExporting ? 'Exporting...' : 'Export Database'}
        </button>
      </section>

      {/* Import Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Import Data</h2>
        <p className="text-gray-600 mb-4">
          Restore data from a GigPro backup file.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Import Mode</label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="merge"
                checked={importMode === 'merge'}
                onChange={(e) => setImportMode(e.target.value as 'merge')}
                className="mr-2"
              />
              <span>Merge (keep existing data, add imported data)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="replace"
                checked={importMode === 'replace'}
                onChange={(e) => setImportMode(e.target.value as 'replace')}
                className="mr-2"
              />
              <span className="text-red-600">
                Replace (delete existing data, use only imported data)
              </span>
            </label>
          </div>
        </div>

        <DragDropUpload onFileSelect={handleImport} accept=".json" />

        {isImporting && (
          <div className="mt-4 text-center">
            <p className="text-gray-600">Importing data...</p>
          </div>
        )}
      </section>

      {/* Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">Important</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Always keep a backup before importing data</li>
          <li>• Imported data must be from a GigPro export</li>
          <li>• Replace mode will permanently delete existing data</li>
        </ul>
      </div>
    </div>
  )
}
```

## Best Practices

### Export

1. **Include Metadata**: Version, timestamp, app version
2. **Timestamp Filenames**: Use ISO timestamps in filenames
3. **Human-Readable**: Use JSON.stringify with formatting (2-space indent)
4. **Validate Before Export**: Ensure data integrity
5. **Handle Errors**: Catch and report export failures
6. **User Feedback**: Show progress for large exports

### Import

1. **Validate Schema**: Use Zod or similar to validate structure
2. **Version Compatibility**: Check backup version vs. current version
3. **Transaction Safety**: Use transactions for atomic imports
4. **Preserve User Choice**: Offer merge vs. replace options
5. **Confirm Destructive Actions**: Warn before replacing data
6. **Error Recovery**: Handle parsing and import errors gracefully
7. **Progress Feedback**: Show import progress for user confidence

### Data Serialization

1. **Handle Special Types**: Dates, undefined, functions
2. **Preserve Type Information**: Tag special types during serialization
3. **Consistent Format**: Use same serialization for export/import
4. **Test Round-Trip**: Ensure export → import preserves data

### Security

1. **Validate Input**: Never trust imported data
2. **Sanitize Data**: Remove potentially dangerous content
3. **Limit File Size**: Prevent memory issues with large files
4. **Check File Type**: Verify file extensions and MIME types

## Testing Export/Import

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { exportDatabase, importDatabase } from '@/lib/export-import'
import { db } from '@/lib/db'

describe('Export/Import', () => {
  beforeEach(async () => {
    await db.income_entries.clear()
  })

  it('should export and import data successfully', async () => {
    // Add test data
    await db.income_entries.add({
      date: new Date('2024-11-30'),
      platform: 'AmazonFlex',
      amount: 88.50,
    })

    // Export
    const exported = await exportDatabase()
    expect(exported.success).toBe(true)

    // Clear database
    await db.income_entries.clear()

    // Create mock file
    const mockFile = new File(
      [JSON.stringify(exported.data)],
      'test-backup.json',
      { type: 'application/json' }
    )

    // Import
    const imported = await importDatabase(mockFile, 'replace')
    expect(imported.success).toBe(true)

    // Verify data
    const entries = await db.income_entries.toArray()
    expect(entries).toHaveLength(1)
    expect(entries[0].amount).toBe(88.50)
  })

  it('should handle invalid JSON', async () => {
    const invalidFile = new File(
      ['{ invalid json'],
      'invalid.json',
      { type: 'application/json' }
    )

    const result = await importDatabase(invalidFile, 'replace')
    expect(result.success).toBe(false)
  })
})
```

## Key Takeaways

1. **Use FileSaver.js**: Industry-standard solution for file downloads
2. **JSON for Backups**: Best format for complete database exports
3. **CSV for Reports**: User-friendly format for analysis
4. **Validate Imports**: Always validate structure and data before importing
5. **Transactions**: Use database transactions for atomic imports
6. **User Control**: Offer merge vs. replace options
7. **Progress Feedback**: Show progress for large operations
8. **Error Handling**: Gracefully handle all failure scenarios
9. **Metadata**: Include version and timestamp in exports
10. **Test Thoroughly**: Ensure round-trip data integrity

## References

- [idb-backup-and-restore.js - GitHub Gist](https://gist.github.com/loilo/ed43739361ec718129a15ae5d531095b)
- [indexeddb-export-import - GitHub](https://github.com/Polarisation/indexeddb-export-import)
- [Import and Export IndexedDB data - Stack Overflow](https://stackoverflow.com/questions/17783719/import-and-export-indexeddb-data)
- [indexeddb-export-import - npm](https://www.npmjs.com/package/indexeddb-export-import)
- [file-saver - npm](https://www.npmjs.com/package/file-saver)
- [FileSaver.js - GitHub](https://github.com/eligrey/FileSaver.js)
- [file-saver Examples - Tabnine](https://www.tabnine.com/code/javascript/modules/file-saver)
- [How to Upload and Read CSV Files in React.js - Stack Overflow](https://stackoverflow.com/questions/44769051/how-to-upload-and-read-csv-files-in-react-js)
- [Working with CSV Files with react-papaparse - LogRocket](https://blog.logrocket.com/working-csv-files-react-papaparse/)
- [react-papaparse Documentation](https://react-papaparse.js.org/)
