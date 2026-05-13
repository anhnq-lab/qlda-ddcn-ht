# parse_files.ps1
# Script để đọc các file Word (.docx) và Excel (.xlsx) sử dụng COM objects trong PowerShell.

$ksFolder = "d:\QuocAnh\2026\01.Project\qlda-ddcn-ht\Ks"
$outputFolder = "d:\QuocAnh\2026\01.Project\qlda-ddcn-ht\scratch\output"

if (!(Test-Path $outputFolder)) {
    New-Item -ItemType Directory -Path $outputFolder -Force | Out-Null
}

Write-Host "Khởi tạo Word và Excel COM Applications..."
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
    Write-Host "Đang đọc Word: $fileName..."
    $doc = $null
    try {
        $doc = $word.Documents.Open($filePath, $true, $true) # FileName, ConfirmConversions, ReadOnly
        
        $paragraphs = $doc.Paragraphs
        $pCount = $paragraphs.Count
        
        $stream = [System.IO.StreamWriter]::new($outputFile)
        $stream.WriteLine("================================================================================")
        $stream.WriteLine("TÓM TẮT TÀI LIỆU WORD: $fileName")
        $stream.WriteLine("Đường dẫn file: $filePath")
        $stream.WriteLine("Tổng số đoạn văn: $pCount")
        $stream.WriteLine("================================================================================")
        $stream.WriteLine()
        
        # Trích xuất các tiêu đề và dàn ý
        $stream.WriteLine("--- MỤC LỤC / CÁC TIÊU ĐỀ ---")
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
            $stream.WriteLine("(Không phát hiện tiêu đề chính thức qua OutlineLevel/Style, đang quét văn bản in đậm trong 100 đoạn đầu tiên)")
            # Quét dự phòng cho văn bản in đậm
            $scanLimit = [math]::Min($pCount, 100)
            for ($i = 1; $i -le $scanLimit; $i++) {
                $p = $paragraphs.Item($i)
                $text = $p.Range.Text.Trim()
                if ($text -and $p.Range.Bold -eq -1 -and $text.Length -lt 200) {
                    $stream.WriteLine("- [In đậm dự phòng] $text")
                }
            }
        }
        $stream.WriteLine()
        
        # Trích xuất 30 đoạn văn không rỗng đầu tiên để đọc
        $stream.WriteLine("--- NỘI DUNG MẪU (30 ĐOẠN VĂN KHÔNG RỖNG ĐẦU TIÊN) ---")
        $contentCount = 0
        for ($i = 1; $i -le $pCount; $i++) {
            $p = $paragraphs.Item($i)
            $text = $p.Range.Text.Trim()
            if ($text) {
                $styleName = ""
                try { $styleName = $p.Style.NameLocal } catch {}
                $stream.WriteLine("[Đoạn $i][$styleName]: $text")
                $stream.WriteLine()
                $contentCount++
                if ($contentCount -ge 30) { break }
            }
        }
        
        $stream.Close()
    }
    catch {
        Write-Host "Lỗi khi đọc file $fileName - $_"
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
    Write-Host "Đang đọc Excel: $fileName..."
    $wb = $null
    try {
        $wb = $excel.Workbooks.Open($filePath, $false, $true) # UpdateLinks, ReadOnly
        
        $stream = [System.IO.StreamWriter]::new($outputFile)
        $stream.WriteLine("================================================================================")
        $stream.WriteLine("TÓM TẮT EXCEL WORKBOOK: $fileName")
        $stream.WriteLine("Đường dẫn file: $filePath")
        $stream.WriteLine("Tổng số Sheet: $($wb.Sheets.Count)")
        $stream.WriteLine("================================================================================")
        $stream.WriteLine()
        
        # Danh sách Sheet
        $stream.WriteLine("--- DANH SÁCH SHEET ---")
        for ($s = 1; $s -le $wb.Sheets.Count; $s++) {
            $sheet = $wb.Sheets.Item($s)
            $stream.WriteLine("- Sheet $($s) : $($sheet.Name) ($($sheet.UsedRange.Rows.Count) dòng x $($sheet.UsedRange.Columns.Count) cột)")
        }
        $stream.WriteLine()
        
        # Nội dung Sheet
        for ($s = 1; $s -le $wb.Sheets.Count; $s++) {
            $sheet = $wb.Sheets.Item($s)
            $stream.WriteLine("================================================================================")
            $stream.WriteLine("SHEET: $($sheet.Name)")
            $stream.WriteLine("================================================================================")
            
            $usedRange = $sheet.UsedRange
            $rowCount = [math]::Min($usedRange.Rows.Count, 40)
            $colCount = [math]::Min($usedRange.Columns.Count, 15)
            
            $stream.WriteLine("(Hiển thị $rowCount dòng và $colCount cột đầu tiên)")
            $stream.WriteLine()
            
            for ($r = 1; $r -le $rowCount; $r++) {
                $rowVals = @()
                for ($c = 1; $c -le $colCount; $c++) {
                    $cell = $usedRange.Cells.Item($r, $c)
                    $val = $cell.Text
                    if ($val -eq $null) { $val = "" }
                    # Xử lý ký tự tab và xuống dòng
                    $val = $val.Replace("`t", " ").Replace("`r", " ").Replace("`n", " ")
                    $rowVals += $val
                }
                $line = $rowVals -join "`t"
                # Chỉ ghi dòng nếu nó không hoàn toàn là các tab trống
                if ($line.Trim() -ne "") {
                    $stream.WriteLine("[Dòng $r]`t$line")
                }
            }
            $stream.WriteLine()
        }
        
        $stream.Close()
    }
    catch {
        Write-Host "Lỗi khi đọc file $fileName - $_"
    }
    finally {
        if ($wb) {
            $wb.Close($false)
        }
    }
}

# Đệ quy tìm tất cả các file docx và xlsx trong $ksFolder
$files = Get-ChildItem -Path $ksFolder -Recurse -File -Include *.docx, *.xlsx

foreach ($file in $files) {
    # Sử dụng -replace không phân biệt chữ hoa chữ thường của PowerShell để xóa tiền tố $ksFolder
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
Write-Host "Đã đọc xong! Kết quả được lưu tại: $outputFolder"
