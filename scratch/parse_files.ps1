# parse_files.ps1
# Script to parse Word (.docx) and Excel (.xlsx) files using COM objects in PowerShell.

$ksFolder = "d:\QuocAnh\2026\01.Project\qlda-ddcn-ht\Ks"
$outputFolder = "d:\QuocAnh\2026\01.Project\qlda-ddcn-ht\scratch\output"

if (!(Test-Path $outputFolder)) {
    New-Item -ItemType Directory -Path $outputFolder -Force | Out-Null
}

Write-Host "Initializing Word and Excel COM Applications..."
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false

function Get-WordSummary {
    param (
        [string]$filePath,
        [string]$outputFile
    )
    
    $fileName = Split-Path $filePath -Leaf
    Write-Host "Parsing Word: $fileName..."
    $doc = $null
    try {
        $doc = $word.Documents.Open($filePath, $true, $true) # FileName, ConfirmConversions, ReadOnly
        
        $paragraphs = $doc.Paragraphs
        $pCount = $paragraphs.Count
        
        $stream = [System.IO.StreamWriter]::new($outputFile)
        $stream.WriteLine("================================================================================")
        $stream.WriteLine("WORD DOCUMENT SUMMARY: $fileName")
        $stream.WriteLine("File Path: $filePath")
        $stream.WriteLine("Total Paragraphs: $pCount")
        $stream.WriteLine("================================================================================")
        $stream.WriteLine()
        
        # Extract headings and outline
        $stream.WriteLine("--- TABLE OF CONTENTS / HEADINGS ---")
        $headingsFound = 0
        for ($i = 1; $i -le $pCount; $i++) {
            $p = $paragraphs.Item($i)
            $styleName = ""
            try {
                $styleName = $p.Style.NameLocal
            } catch {}
            
            $text = $p.Range.Text.Trim()
            if ($text -and ($styleName -like "*Heading*" -or $styleName -like "*Tiêu đề*" -or $p.OutlineLevel -lt 10)) {
                $indent = "  " * [math]::Max(0, $p.OutlineLevel)
                $stream.WriteLine("$indent- [$styleName] $text")
                $headingsFound++
            }
        }
        if ($headingsFound -eq 0) {
            $stream.WriteLine("(No formal headings detected via OutlineLevel/Style, scanning for bold text in first 100 paragraphs)")
            # Fallback scan for bold text
            $scanLimit = [math]::Min($pCount, 100)
            for ($i = 1; $i -le $scanLimit; $i++) {
                $p = $paragraphs.Item($i)
                $text = $p.Range.Text.Trim()
                if ($text -and $p.Range.Bold -eq -1 -and $text.Length -lt 200) {
                    $stream.WriteLine("- [Bold fallback] $text")
                }
            }
        }
        $stream.WriteLine()
        
        # Extract first 30 non-empty paragraphs for reading
        $stream.WriteLine("--- SAMPLE CONTENT (FIRST 30 NON-EMPTY PARAGRAPHS) ---")
        $contentCount = 0
        for ($i = 1; $i -le $pCount; $i++) {
            $p = $paragraphs.Item($i)
            $text = $p.Range.Text.Trim()
            if ($text) {
                $styleName = ""
                try { $styleName = $p.Style.NameLocal } catch {}
                $stream.WriteLine("[Para $i][$styleName]: $text")
                $stream.WriteLine()
                $contentCount++
                if ($contentCount -ge 30) { break }
            }
        }
        
        $stream.Close()
    }
    catch {
        Write-Host "Error parsing $fileName - $_"
    }
    finally {
        if ($doc) {
            $doc.Close($false) # SaveChanges = false
        }
    }
}

function Get-ExcelSummary {
    param (
        [string]$filePath,
        [string]$outputFile
    )
    
    $fileName = Split-Path $filePath -Leaf
    Write-Host "Parsing Excel: $fileName..."
    $wb = $null
    try {
        $wb = $excel.Workbooks.Open($filePath, $false, $true) # UpdateLinks, ReadOnly
        
        $stream = [System.IO.StreamWriter]::new($outputFile)
        $stream.WriteLine("================================================================================")
        $stream.WriteLine("EXCEL WORKBOOK SUMMARY: $fileName")
        $stream.WriteLine("File Path: $filePath")
        $stream.WriteLine("Total Sheets: $($wb.Sheets.Count)")
        $stream.WriteLine("================================================================================")
        $stream.WriteLine()
        
        # Sheet list
        $stream.WriteLine("--- SHEET LIST ---")
        for ($s = 1; $s -le $wb.Sheets.Count; $s++) {
            $sheet = $wb.Sheets.Item($s)
            $stream.WriteLine("- Sheet $($s) : $($sheet.Name) ($($sheet.UsedRange.Rows.Count) rows x $($sheet.UsedRange.Columns.Count) cols)")
        }
        $stream.WriteLine()
        
        # Sheet contents
        for ($s = 1; $s -le $wb.Sheets.Count; $s++) {
            $sheet = $wb.Sheets.Item($s)
            $stream.WriteLine("================================================================================")
            $stream.WriteLine("SHEET: $($sheet.Name)")
            $stream.WriteLine("================================================================================")
            
            $usedRange = $sheet.UsedRange
            $rowCount = [math]::Min($usedRange.Rows.Count, 40)
            $colCount = [math]::Min($usedRange.Columns.Count, 15)
            
            $stream.WriteLine("(Displaying top $rowCount rows and $colCount columns)")
            $stream.WriteLine()
            
            for ($r = 1; $r -le $rowCount; $r++) {
                $rowVals = @()
                for ($c = 1; $c -le $colCount; $c++) {
                    $cell = $usedRange.Cells.Item($r, $c)
                    $val = $cell.Text
                    if ($val -eq $null) { $val = "" }
                    # Escape tabs and newlines
                    $val = $val.Replace("`t", " ").Replace("`r", " ").Replace("`n", " ")
                    $rowVals += $val
                }
                $line = $rowVals -join "`t"
                # Only write line if it's not entirely empty tabs
                if ($line.Trim() -ne "") {
                    $stream.WriteLine("[Row $r]`t$line")
                }
            }
            $stream.WriteLine()
        }
        
        $stream.Close()
    }
    catch {
        Write-Host "Error parsing $fileName - $_"
    }
    finally {
        if ($wb) {
            $wb.Close($false)
        }
    }
}

# Recursively find all docx and xlsx files in $ksFolder
$files = Get-ChildItem -Path $ksFolder -Recurse -File -Include *.docx, *.xlsx

foreach ($file in $files) {
    # Use PowerShell case-insensitive -replace to remove $ksFolder prefix
    $relative = $file.FullName -replace [regex]::Escape($ksFolder), ""
    $relative = $relative.TrimStart("\").TrimStart("/")
    $safeName = $relative.Replace("\", "_").Replace("/", "_").Replace(" ", "_") + ".txt"
    $outputFile = Join-Path $outputFolder $safeName
    
    if ($file.Extension -eq ".docx") {
        Get-WordSummary -filePath $file.FullName -outputFile $outputFile
    }
    elseif ($file.Extension -eq ".xlsx") {
        Get-ExcelSummary -filePath $file.FullName -outputFile $outputFile
    }
}

$word.Quit()
$excel.Quit()
Write-Host "Parsing completed! Outputs saved to: $outputFolder"
