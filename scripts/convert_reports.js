import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

// HTML Template with stunning premium styling
const getHtmlTemplate = (title, contentHtml) => `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${title} - Ban QLDA đầu tư xây dựng công trình Dân dụng và Công nghiệp tỉnh Hà Tĩnh">
  <title>${title}</title>
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <!-- FontAwesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  
  <style>
    :root {
      --bg-primary: #0b0f19;
      --bg-secondary: #161b2a;
      --bg-tertiary: #1f2638;
      --text-primary: #f3f4f6;
      --text-secondary: #9ca3af;
      --text-muted: #6b7280;
      --accent-color: #06b6d4;
      --accent-hover: #0891b2;
      --accent-gradient: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
      --success-color: #10b981;
      --warning-color: #f59e0b;
      --error-color: #ef4444;
      --border-color: #2e3748;
      --card-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.7);
      --font-heading: 'Outfit', sans-serif;
      --font-body: 'Inter', sans-serif;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-primary);
      color: var(--text-primary);
      font-family: var(--font-body);
      line-height: 1.6;
      overflow-x: hidden;
    }

    /* Scrollbar Styling */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    ::-webkit-scrollbar-track {
      background: var(--bg-primary);
    }
    ::-webkit-scrollbar-thumb {
      background: var(--border-color);
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: var(--text-muted);
    }

    /* Layout Wrapper */
    .app-container {
      display: flex;
      min-height: 100vh;
      position: relative;
    }

    /* Sidebar Navigation */
    .sidebar {
      width: 320px;
      background-color: var(--bg-secondary);
      border-right: 1px solid var(--border-color);
      padding: 2.5rem 1.5rem;
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      overflow-y: auto;
      z-index: 10;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 2.5rem;
    }

    .brand-logo {
      width: 42px;
      height: 42px;
      background: var(--accent-gradient);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      font-weight: 800;
      color: white;
      box-shadow: 0 0 20px rgba(6, 182, 212, 0.4);
    }

    .brand-title {
      font-family: var(--font-heading);
      font-weight: 700;
      font-size: 1.15rem;
      letter-spacing: 0.5px;
      background: var(--accent-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .toc-title {
      font-family: var(--font-heading);
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: var(--text-muted);
      margin-bottom: 1rem;
      padding-left: 0.5rem;
    }

    .toc-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .toc-item a {
      display: block;
      color: var(--text-secondary);
      text-decoration: none;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      font-size: 0.9rem;
      transition: all 0.3s ease;
      border-left: 2px solid transparent;
    }

    .toc-item a:hover {
      color: var(--accent-color);
      background-color: var(--bg-tertiary);
      padding-left: 1rem;
      border-left: 2px solid var(--accent-color);
    }

    .toc-item.active a {
      color: white;
      background: var(--accent-gradient);
      font-weight: 600;
      border-left: 2px solid transparent;
      box-shadow: 0 4px 15px rgba(6, 182, 212, 0.25);
    }

    /* Main Content Area */
    .main-content {
      flex: 1;
      margin-left: 320px;
      padding: 3rem 4rem;
      max-width: 1300px;
    }

    /* Document Header Header styling */
    .doc-header {
      margin-bottom: 3.5rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid var(--border-color);
      position: relative;
    }

    .doc-header::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      width: 100px;
      height: 3px;
      background: var(--accent-gradient);
      border-radius: 3px;
    }

    .doc-meta {
      display: flex;
      gap: 1.5rem;
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin-top: 1rem;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .meta-item i {
      color: var(--accent-color);
    }

    /* Markdown Styling overrides */
    h1 {
      font-family: var(--font-heading);
      font-weight: 800;
      font-size: 2.25rem;
      line-height: 1.3;
      margin-bottom: 1.5rem;
      background: linear-gradient(135deg, white 0%, var(--text-secondary) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    h2 {
      font-family: var(--font-heading);
      font-weight: 700;
      font-size: 1.65rem;
      margin-top: 3rem;
      margin-bottom: 1.25rem;
      color: white;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    h2::before {
      content: '';
      display: inline-block;
      width: 4px;
      height: 24px;
      background: var(--accent-gradient);
      border-radius: 4px;
    }

    h3 {
      font-family: var(--font-heading);
      font-weight: 600;
      font-size: 1.25rem;
      margin-top: 2rem;
      margin-bottom: 1rem;
      color: var(--accent-color);
    }

    h4 {
      font-family: var(--font-heading);
      font-weight: 600;
      font-size: 1.1rem;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
      color: white;
    }

    p {
      color: var(--text-secondary);
      margin-bottom: 1.5rem;
      font-size: 1.05rem;
      text-align: justify;
    }

    /* Lists styling */
    ul, ol {
      margin-left: 1.5rem;
      margin-bottom: 1.5rem;
      color: var(--text-secondary);
    }

    li {
      margin-bottom: 0.5rem;
      font-size: 1.02rem;
    }

    /* Table styling - Stunning dashboard look */
    .table-responsive {
      width: 100%;
      overflow-x: auto;
      margin: 2.5rem 0;
      border-radius: 12px;
      border: 1px solid var(--border-color);
      box-shadow: var(--card-shadow);
      background-color: var(--bg-secondary);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    th {
      background-color: var(--bg-tertiary);
      color: white;
      font-family: var(--font-heading);
      font-weight: 600;
      font-size: 0.95rem;
      padding: 1rem 1.25rem;
      border-bottom: 2px solid var(--border-color);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }

    td {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-secondary);
      font-size: 0.95rem;
      vertical-align: middle;
    }

    tr:last-child td {
      border-bottom: none;
    }

    tr:hover td {
      color: white;
      background-color: rgba(6, 182, 212, 0.05);
    }

    /* Format numbers in table */
    td:nth-child(n+3) {
      font-variant-numeric: tabular-nums;
    }

    /* Alerts styling (GitHub style) */
    blockquote {
      margin: 2rem 0;
      padding: 1.25rem 1.5rem;
      background-color: var(--bg-secondary);
      border-left: 4px solid var(--accent-color);
      border-radius: 8px;
      color: var(--text-primary);
      font-size: 1rem;
      box-shadow: var(--card-shadow);
    }

    /* Custom classes injected for alerts dynamically */
    .alert-warning {
      border-left-color: var(--warning-color);
      background-color: rgba(245, 158, 11, 0.05);
    }
    .alert-warning .alert-title {
      color: var(--warning-color);
    }

    .alert-note {
      border-left-color: var(--accent-color);
      background-color: rgba(6, 182, 212, 0.05);
    }
    .alert-note .alert-title {
      color: var(--accent-color);
    }

    .alert-tip {
      border-left-color: var(--success-color);
      background-color: rgba(16, 187, 129, 0.05);
    }
    .alert-tip .alert-title {
      color: var(--success-color);
    }

    .alert-title {
      font-family: var(--font-heading);
      font-weight: 700;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    hr {
      margin: 3.5rem 0;
      border: 0;
      height: 1px;
      background: var(--border-color);
    }

    /* Highlight Badges */
    .badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-error {
      background-color: rgba(239, 68, 68, 0.15);
      color: var(--error-color);
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .badge-warning {
      background-color: rgba(245, 158, 11, 0.15);
      color: var(--warning-color);
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .badge-success {
      background-color: rgba(16, 185, 129, 0.15);
      color: var(--success-color);
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    /* Responsive adjustments */
    @media (max-width: 1024px) {
      .sidebar {
        display: none;
      }
      .main-content {
        margin-left: 0;
        padding: 2rem;
      }
    }
  </style>
</head>
<body>
  <div class="app-container">
    <!-- Sidebar Navigation -->
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-logo"><i class="fa-solid fa-chart-line"></i></div>
        <div class="brand-title">CIC ERP - Portal</div>
      </div>
      <h3 class="toc-title">Mục lục báo cáo</h3>
      <ul class="toc-list" id="toc-nav">
        <!-- Will be populated dynamically by JavaScript -->
      </ul>
    </aside>

    <!-- Main Content Area -->
    <main class="main-content">
      <div class="doc-header">
        <h1>${title}</h1>
        <div class="doc-meta">
          <div class="meta-item"><i class="fa-regular fa-calendar"></i> 28/05/2026</div>
          <div class="meta-item"><i class="fa-regular fa-user"></i> Ban Giam Doc</div>
          <div class="meta-item"><i class="fa-solid fa-shield-halved"></i> Đã rà soát & đánh giá</div>
        </div>
      </div>
      
      <div class="doc-body" id="doc-body">
        ${contentHtml}
      </div>
    </main>
  </div>

  <script>
    // Dynamic Table of Contents Generation
    document.addEventListener("DOMContentLoaded", () => {
      const docBody = document.getElementById("doc-body");
      const tocNav = document.getElementById("toc-nav");
      
      const headings = docBody.querySelectorAll("h2, h3");
      headings.forEach((heading, idx) => {
        // Create an ID if not exists
        const id = heading.id || "section-" + idx;
        heading.id = id;
        
        // Add item to TOC sidebar
        const li = document.createElement("li");
        li.className = "toc-item " + (heading.tagName === "H3" ? "toc-sub-item" : "");
        li.style.paddingLeft = heading.tagName === "H3" ? "1rem" : "0px";
        
        const a = document.createElement("a");
        a.href = "#" + id;
        a.textContent = heading.textContent;
        
        li.appendChild(a);
        tocNav.appendChild(li);
      });

      // Quick intersection observer for active menu
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const activeLink = document.querySelector(\`#toc-nav a[href="#\${entry.target.id}"]\`);
            if (activeLink) {
              document.querySelectorAll("#toc-nav li").forEach(li => li.classList.remove("active"));
              activeLink.parentElement.classList.add("active");
            }
          }
        });
      }, { rootMargin: "-20% 0px -80% 0px" });

      headings.forEach(heading => observer.observe(heading));
    });
  </script>
</body>
</html>
`;

// Helper to format blockquotes with alerts (GitHub-style syntax)
function postProcessHtml(html) {
  let processed = html;
  
  // Replace warning blockquote
  processed = processed.replace(
    /<blockquote>\s*<p>\s*\[!WARNING\]([\s\S]*?)<\/p>\s*<\/blockquote>/g,
    `<blockquote class="alert-warning"><div class="alert-title"><i class="fa-solid fa-triangle-exclamation"></i> Cảnh báo</div><p>$1</p></blockquote>`
  );
  
  // Replace note blockquote
  processed = processed.replace(
    /<blockquote>\s*<p>\s*\[!NOTE\]([\s\S]*?)<\/p>\s*<\/blockquote>/g,
    `<blockquote class="alert-note"><div class="alert-title"><i class="fa-solid fa-circle-info"></i> Ghi chú</div><p>$1</p></blockquote>`
  );

  // Replace tip blockquote
  processed = processed.replace(
    /<blockquote>\s*<p>\s*\[!TIP\]([\s\S]*?)<\/p>\s*<\/blockquote>/g,
    `<blockquote class="alert-tip"><div class="alert-title"><i class="fa-regular fa-lightbulb"></i> Gợi ý</div><p>$1</p></blockquote>`
  );
  
  // Wrap standard tables in responsive wrappers
  processed = processed.replace(
    /<table>([\s\S]*?)<\/table>/g,
    `<div class="table-responsive"><table>$1</table></div>`
  );

  // Beautify standard error labels into badges
  processed = processed.replace(/\[Lỗi 1 - Vốn vượt TMDT\]/g, `<span class="badge badge-warning">Lỗi 1 - Vốn vượt TMDT</span>`);
  processed = processed.replace(/\[Lỗi 2 - Cộng nguồn lệch\]/g, `<span class="badge badge-warning">Lỗi 2 - Cộng nguồn lệch</span>`);
  processed = processed.replace(/\[Lỗi 3 - Giải ngân vượt Vốn bố trí\]/g, `<span class="badge badge-error">Lỗi 3 - Giải ngân vượt Vốn bố trí</span>`);
  processed = processed.replace(/\[Lỗi 4 - Giải ngân vượt TMDT\]/g, `<span class="badge badge-error">Lỗi 4 - Giải ngân vượt TMDT</span>`);
  processed = processed.replace(/\[Lỗi 5 - Giải ngân vượt Nghiệm thu\]/g, `<span class="badge badge-error">Lỗi 5 - Giải ngân vượt Nghiệm thu</span>`);
  processed = processed.replace(/\[Lỗi 6 - Công nợ không khớp\]/g, `<span class="badge badge-warning">Lỗi 6 - Công nợ không khớp</span>`);

  return processed;
}

function convertFile(mdPath, htmlPath, title) {
  try {
    if (!fs.existsSync(mdPath)) {
      console.log(`Markdown file not found: ${mdPath}`);
      return;
    }
    const mdContent = fs.readFileSync(mdPath, 'utf8');
    const contentHtml = marked(mdContent);
    const finalHtml = getHtmlTemplate(title, postProcessHtml(contentHtml));
    fs.writeFileSync(htmlPath, finalHtml, 'utf8');
    console.log(`Successfully converted ${path.basename(mdPath)} to ${path.basename(htmlPath)}`);
  } catch (err) {
    console.error(`Error converting ${mdPath}:`, err);
  }
}

// Convert both report files (Workspace Docs Folder)
convertFile(
  'd:/QuocAnh/2026/01.Project/qlda-ddcn-ht/docs/bao_cao_danh_gia_noi_dung.md',
  'd:/QuocAnh/2026/01.Project/qlda-ddcn-ht/docs/bao_cao_danh_gia_noi_dung.html',
  'Báo cáo Đánh giá Nội dung và Chất lượng Dữ liệu'
);

convertFile(
  'd:/QuocAnh/2026/01.Project/qlda-ddcn-ht/docs/bao_cao_loi_logic_so_lieu.md',
  'd:/QuocAnh/2026/01.Project/qlda-ddcn-ht/docs/bao_cao_loi_logic_so_lieu.html',
  'Báo cáo Phân tích và Cảnh báo Sai lệch Logic Số liệu'
);

// Convert both report files (Brain Artifacts Folder)
const brainDir = 'C:/Users/Personal/.gemini/antigravity/brain/55c485e0-2d68-4662-a5eb-f6428b745fe6';
if (fs.existsSync(brainDir)) {
  convertFile(
    'd:/QuocAnh/2026/01.Project/qlda-ddcn-ht/docs/bao_cao_danh_gia_noi_dung.md',
    path.join(brainDir, 'bao_cao_danh_gia_noi_dung.html'),
    'Báo cáo Đánh giá Nội dung và Chất lượng Dữ liệu'
  );

  convertFile(
    'd:/QuocAnh/2026/01.Project/qlda-ddcn-ht/docs/bao_cao_loi_logic_so_lieu.md',
    path.join(brainDir, 'bao_cao_loi_logic_so_lieu.html'),
    'Báo cáo Phân tích và Cảnh báo Sai lệch Logic Số liệu'
  );
}

