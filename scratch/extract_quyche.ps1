# scratch/extract_quyche.ps1
# Script to convert the docx file of Quy che to Markdown with high fidelity

$docxPath = "d:\QuocAnh\2026\01.Project\qlda-ddcn-ht\Ks\48.12-Ban-hanh-.Quy-che-lam-viec-Ban-QLDA (3).docx"
$outputPath = "d:\QuocAnh\2026\01.Project\qlda-ddcn-ht\Quyche.md"

if (!(Test-Path $docxPath)) {
    Write-Error "Docx file not found at $docxPath"
    exit 1
}

Write-Host "Initializing Word COM Application..."
$word = New-Object -ComObject Word.Application
$word.Visible = $false

try {
    Write-Host "Opening document: $docxPath"
    $doc = $word.Documents.Open($docxPath, $true, $true) # ConfirmConversions=True, ReadOnly=True
    
    $paragraphs = $doc.Paragraphs
    $pCount = $paragraphs.Count
    Write-Host "Total paragraphs: $pCount"
    
    $markdown = [System.Text.StringBuilder]::new()
    
    for ($i = 1; $i -le $pCount; $i++) {
        $p = $paragraphs.Item($i)
        $text = $p.Range.Text
        # Clean up Word line endings and tabs
        $text = $text -replace "`r", ""
        $text = $text -replace "`n", ""
        $trimmed = $text.Trim()
        
        if (!$trimmed) {
            # Empty paragraph -> empty line in markdown
            [void]$markdown.AppendLine("")
            continue
        }
        
        # Determine heading style or outline level
        $styleName = ""
        try { $styleName = $p.Style.NameLocal } catch {}
        $outlineLevel = $p.OutlineLevel
        
        # Check if list template is active
        $isList = $false
        try {
            if ($p.Range.ListFormat.ListType -ne [Microsoft.Office.Interop.Word.WdListType]::wdListNoNumbering) {
                $isList = $true
            }
        } catch {}
        
        # Format as header if outline level < 10 or specific styles
        if ($styleName -like "*Heading 1*" -or $styleName -like "*Tiêu đề 1*" -or $outlineLevel -eq 0) {
            [void]$markdown.AppendLine("# $trimmed")
            [void]$markdown.AppendLine("")
        }
        elseif ($styleName -like "*Heading 2*" -or $styleName -like "*Tiêu đề 2*" -or $outlineLevel -eq 1) {
            [void]$markdown.AppendLine("## $trimmed")
            [void]$markdown.AppendLine("")
        }
        elseif ($styleName -like "*Heading 3*" -or $styleName -like "*Tiêu đề 3*" -or $outlineLevel -eq 2) {
            [void]$markdown.AppendLine("### $trimmed")
            [void]$markdown.AppendLine("")
        }
        elseif ($styleName -like "*Heading 4*" -or $styleName -like "*Tiêu đề 4*" -or $outlineLevel -eq 3) {
            [void]$markdown.AppendLine("#### $trimmed")
            [void]$markdown.AppendLine("")
        }
        elseif ($trimmed -match "^(CHƯƠNG|Chương)\s+[IVXLCDM]+\s*$" -or $trimmed -match "^Chương\s+\d+" -or $trimmed -match "^Điều\s+\d+") {
            # Highlight chapters and articles as bold headings
            [void]$markdown.AppendLine("### **$trimmed**")
            [void]$markdown.AppendLine("")
        }
        elseif ($isList) {
            # List item
            [void]$markdown.AppendLine("- $trimmed")
        }
        else {
            # Regular paragraph. Check if bold
            $isBold = $p.Range.Bold -eq -1
            if ($isBold -and $trimmed.Length -lt 150) {
                [void]$markdown.AppendLine("**$trimmed**")
                [void]$markdown.AppendLine("")
            } else {
                [void]$markdown.AppendLine($trimmed)
                [void]$markdown.AppendLine("")
            }
        }
    }
    
    # Let's also extract Tables if any!
    $tables = $doc.Tables
    $tCount = $tables.Count
    if ($tCount -gt 0) {
        Write-Host "Found $tCount tables. Appending them at the end of the markdown..."
        [void]$markdown.AppendLine("`r`n## PHỤ LỤC: DANH SÁCH BẢNG BIỂU`r`n")
        for ($t = 1; $t -le $tCount; $t++) {
            $table = $tables.Item($t)
            $rows = $table.Rows
            $rCount = $rows.Count
            
            [void]$markdown.AppendLine("### Bảng $t`n")
            
            for ($r = 1; $r -le $rCount; $r++) {
                $row = $rows.Item($r)
                $cells = $row.Cells
                $cCount = $cells.Count
                
                $rowText = @()
                for ($c = 1; $c -le $cCount; $c++) {
                    $cell = $cells.Item($c)
                    $cellText = $cell.Range.Text
                    # Remove Word table markers
                    $cellText = $cellText -replace "`a", ""
                    $cellText = $cellText -replace "`r", " "
                    $cellText = $cellText -replace "`n", " "
                    $cellText = $cellText.Trim()
                    $rowText += $cellText
                }
                
                $markdownRow = "| " + ($rowText -join " | ") + " |"
                [void]$markdown.AppendLine($markdownRow)
                
                # Add separator after header row
                if ($r -eq 1) {
                    $sep = @()
                    for ($c = 1; $c -le $cCount; $c++) { $sep += "---" }
                    $markdownSep = "| " + ($sep -join " | ") + " |"
                    [void]$markdown.AppendLine($markdownSep)
                }
            }
            [void]$markdown.AppendLine("")
        }
    }
    
    # Save output as UTF-8 without BOM (or standard UTF8)
    [System.IO.File]::WriteAllText($outputPath, $markdown.ToString(), [System.Text.Encoding]::UTF8)
    Write-Host "Quyche.md created successfully at $outputPath"
    
}
catch {
    Write-Error "An error occurred during extraction: $_"
}
finally {
    if ($doc) {
        $doc.Close($false)
    }
    $word.Quit()
}
