$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open('d:\QuocAnh\2026\01.Project\qlda-ddcn-ht\Doccument\VanBanPhapLuat.md\85_2025_ND-CP_651162.doc')
$doc.SaveAs([ref]'d:\QuocAnh\2026\01.Project\qlda-ddcn-ht\Doccument\VanBanPhapLuat.md\85_2025_ND-CP.txt', [ref]2)
$doc.Close()
$word.Quit()
