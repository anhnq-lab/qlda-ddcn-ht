/**
 * Import public assets from Excel "TS 1.1.26" into Supabase public_assets table.
 * Source: BK02 Bảng kê chi tiết TSCĐ năm 2026 - BAN QLDA ĐTXD DÂN DỤNG VÀ HTKV
 * Run: node scripts/import-assets.mjs
 */
import { readFileSync } from 'fs';
import { read, utils } from 'xlsx';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jkaddjllseephsiaqvds.supabase.co';
const SUPABASE_SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprYWRkamxsc2VlcGhzaWFxdmRzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODI5ODY3MCwiZXhwIjoyMDkzODc0NjcwfQ.VJzDdr4Fy76SROCXMgjM6MXET9D6Z3Xv34X6fIhrUQU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

const FILE_PATH =
  'D:/QuocAnh/2026/01.Project/qlda-ddcn-ht/Ks/Theo dõi Tài sản cố định Ban Dân dụng  - hạnh.xls';

// Known location names that appear in Col D instead of real asset codes
const LOCATION_NAMES = new Set([
  'thạch hà', 'can lộc', 'cẩm xuyên', 'cẩm xuyen', 'cam xuyen',
  'đức thọ', 'duc tho', 'hương khê', 'huong khe', 'hương khe',
  'vũ quang', 'vu quang',
]);

function isLocationName(s) {
  return LOCATION_NAMES.has((s || '').toLowerCase().trim());
}

// Convert Excel date serial or plain year number to ISO date string YYYY-MM-DD
function toISODate(val) {
  if (val == null) return null;
  const n = Number(val);
  if (isNaN(n)) return null;
  if (n >= 1990 && n <= 2030) {
    // Plain year value (e.g. 2019, 2020)
    return `${Math.round(n)}-01-01`;
  }
  if (n > 25000) {
    // Excel date serial (Windows epoch: day 1 = 1900-01-01, but Excel has a leap year bug so offset is Dec 30 1899)
    const d = new Date(Date.UTC(1899, 11, 30) + n * 86400000);
    return d.toISOString().split('T')[0];
  }
  return null;
}

// Map asset name keywords to category code for Section IV (MÁY MÓC THIẾT BỊ)
function getMachineCategory(name) {
  const n = name.toLowerCase();
  if (n.includes('xách tay') || n.includes('laptop')) return 'PC_LAPTOP';
  if (n.includes('máy tính') || n.includes('bộ máy tính')) {
    return 'PC_DESKTOP';
  }
  if (
    n.includes('điều hò') ||
    n.includes('điều hoà') ||
    n.includes('điều hoa')
  )
    return 'AIR_CON';
  if (
    n.includes('photo') ||
    n.includes('phô tô') ||
    n.includes('photocopy') ||
    n.includes('photocoppy') ||
    n.includes('scan') ||
    n.includes('máy in')
  )
    return 'PRINTER_PHOTO';
  return 'OFFICE_EQUIP';
}

const SECTION_MAP = {
  I: 'LAND',
  II: 'BUILDING',
  III: 'CAR',
  IV: 'MACHINE',
  V: 'OTHER',
  VI: 'INTANGIBLE',
};

async function main() {
  // 1. Fetch all categories into a code → id map
  const { data: cats, error: catErr } = await supabase
    .from('public_asset_categories')
    .select('id, code');
  if (catErr) {
    console.error('Failed to fetch categories:', catErr.message);
    process.exit(1);
  }
  const catMap = Object.fromEntries(cats.map((c) => [c.code, c.id]));
  console.log('Categories loaded:', Object.keys(catMap).sort().join(', '));

  // 2. Parse Excel sheet
  const workbook = read(readFileSync(FILE_PATH));
  const sheet = workbook.Sheets['TS 1.1.26'];
  if (!sheet) {
    console.error('Sheet "TS 1.1.26" not found!');
    process.exit(1);
  }
  const range = utils.decode_range(sheet['!ref']);

  const getVal = (r, c) => {
    const cell = sheet[utils.encode_cell({ r, c })];
    return cell != null ? cell.v : null;
  };
  const getStr = (r, c) => {
    const v = getVal(r, c);
    return v != null ? String(v).trim() : '';
  };

  let currentSection = ''; // 'LAND' | 'BUILDING' | 'CAR' | 'MACHINE' | 'OTHER' | 'INTANGIBLE'
  let currentSubGroup = ''; // e.g. "Nhà làm việc Trụ sở chính"
  const assets = [];
  const codeCounters = {}; // track usage of each code to ensure uniqueness

  for (let r = 8; r <= range.e.r; r++) {
    // Col indices (0-based)
    const colB = getStr(r, 1); // STT or Roman numeral section marker
    const colC = getStr(r, 2); // Asset name
    const colD = getStr(r, 3); // Asset code (sometimes location name)
    const colE = getStr(r, 4); // Nơi sử dụng (location/person)
    const colG = getVal(r, 6); // Date put into use
    const colH = getVal(r, 7); // Depreciation years
    const colI = getVal(r, 8); // Depreciation rate (decimal, e.g. 0.04)
    const colJ = getVal(r, 9); // Beginning quantity
    const colK = getVal(r, 10); // Beginning original cost
    const colL = getVal(r, 11); // Beginning accumulated depreciation
    const colN = getStr(r, 13); // Source of fund (SRDP/DDCN/ICDP/IWMC)
    const colZ = getVal(r, 25); // End-of-period quantity
    const colAA = getVal(r, 26); // End-of-period original cost
    const colAB = getVal(r, 27); // End-of-period accumulated depreciation

    // ── Section header (Roman numeral in col B) ──────────────────────────────
    if (SECTION_MAP[colB]) {
      currentSection = SECTION_MAP[colB];
      currentSubGroup = '';
      continue;
    }

    // Skip rows with no name
    if (!colC) continue;

    // Skip grand total row
    if (colC.includes('TỔNG CỘNG') || colC.includes('TỔNG SỐ')) continue;

    // ── Compute financial values ──────────────────────────────────────────────
    const originalCost = Number(colAA ?? colK) || 0;
    const accDep = Math.min(
      Number(colAB ?? colL) || 0,
      originalCost // cap to prevent negatives
    );
    const remainingVal = Math.max(0, originalCost - accDep);

    // ── Sub-group header (empty B, non-empty C, zero/no cost) ────────────────
    if (!colB && originalCost === 0) {
      currentSubGroup = colC;
      continue;
    }

    // ── Skip rows with no financial value ────────────────────────────────────
    if (originalCost <= 0) continue;

    // ── Skip if no current section (header rows at top) ──────────────────────
    if (!currentSection) continue;

    // ── Determine location ───────────────────────────────────────────────────
    let location;
    if (isLocationName(colD)) {
      location = colD; // Col D is actually the location
    } else if (colE && colE !== 'SD chung' && !isLocationName(colE)) {
      location = colE;
    } else {
      location = currentSubGroup || 'Văn phòng quản lý';
    }

    // ── Determine asset code ─────────────────────────────────────────────────
    let assetCode;
    if (!colD || isLocationName(colD)) {
      // Generate a structured code
      const prefix =
        currentSection === 'LAND'
          ? 'DAT'
          : currentSection === 'BUILDING'
          ? 'NC'
          : currentSection === 'CAR'
          ? 'OTO'
          : currentSection === 'MACHINE'
          ? 'MMTB'
          : currentSection === 'OTHER'
          ? 'TSCDK'
          : 'VHINH';
      // Use location abbreviation for generated codes (strip diacritics roughly)
      const locRaw = (isLocationName(colD) ? colD : currentSubGroup || 'HQ')
        .toUpperCase()
        .replace(/[ÀÁÂÃÄÅ]/gi, 'A')
        .replace(/[ÈÉÊË]/gi, 'E')
        .replace(/[ÌÍÎÏ]/gi, 'I')
        .replace(/[ÒÓÔÕÖ]/gi, 'O')
        .replace(/[ÙÚÛÜ]/gi, 'U')
        .replace(/Đ/gi, 'D')
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 6);
      const key = `${prefix}-${locRaw}`;
      codeCounters[key] = (codeCounters[key] || 0) + 1;
      assetCode = `${key}-${String(codeCounters[key]).padStart(3, '0')}`;
    } else {
      // Real code from Excel — ensure uniqueness if duplicated
      const base = colD;
      if (!codeCounters[base]) {
        codeCounters[base] = 1;
        assetCode = base;
      } else {
        codeCounters[base]++;
        assetCode = `${base}-${codeCounters[base]}`;
      }
    }

    // ── Determine category ───────────────────────────────────────────────────
    let categoryCode;
    if (currentSection === 'LAND') {
      categoryCode = 'LAND';
    } else if (currentSection === 'BUILDING') {
      const isHQ =
        currentSubGroup.toLowerCase().includes('trụ sở') ||
        currentSubGroup === '';
      categoryCode = isHQ ? 'BUILDING_HQ' : 'BUILDING_OTHER';
    } else if (currentSection === 'CAR') {
      categoryCode = 'CAR_OFFICIAL';
    } else if (currentSection === 'MACHINE') {
      categoryCode = getMachineCategory(colC);
    } else if (currentSection === 'OTHER') {
      categoryCode = 'TANGIBLE_OTHER';
    } else if (currentSection === 'INTANGIBLE') {
      categoryCode = 'INTANGIBLE_SOFTWARE';
    } else {
      continue;
    }

    const categoryId = catMap[categoryCode];
    if (!categoryId) {
      console.warn(`  [WARN] No category for "${categoryCode}" at row ${r + 1}: ${colC}`);
      continue;
    }

    // ── Compute depreciation rate ─────────────────────────────────────────────
    const depRateRaw = Number(colI) || 0;
    // Excel stores as decimal (0.04 = 4%) → convert to percent for DB (NUMERIC 5,2)
    const depRatePct = Math.round(depRateRaw * 100 * 100) / 100;

    // ── Date ─────────────────────────────────────────────────────────────────
    const useDate = toISODate(colG) || '2019-01-01';

    // ── Unit ─────────────────────────────────────────────────────────────────
    const unit = currentSection === 'LAND' ? 'M2' : 'Chiếc';

    // ── Build asset record ────────────────────────────────────────────────────
    assets.push({
      asset_code: assetCode,
      asset_name: colC,
      category_id: categoryId,
      description: colN ? `Nguồn: ${colN}` : null,
      unit,
      quantity: Number(colZ ?? colJ) || 1,
      location,
      department: currentSubGroup || null,
      purchase_date: useDate,
      use_date: useDate,
      original_cost: originalCost,
      funding_budget_cost: 0,
      funding_other_cost: 0,
      depreciation_rate: depRatePct,
      accumulated_depreciation: accDep,
      remaining_value: remainingVal,
      status: 'active',
    });
  }

  console.log(`\nParsed ${assets.length} assets to import.\n`);

  // Preview
  console.log('Code         | Name (truncated)              | Category code   | Original cost');
  console.log('-------------|-------------------------------|-----------------|---------------');
  const catCodeById = Object.fromEntries(cats.map((c) => [c.id, c.code]));
  assets.forEach((a) => {
    console.log(
      `${a.asset_code.padEnd(12)} | ${a.asset_name.substring(0, 29).padEnd(29)} | ${catCodeById[a.category_id].padEnd(15)} | ${a.original_cost.toLocaleString()}`
    );
  });

  // 3. Confirm before inserting
  console.log(`\nTotal: ${assets.length} assets`);
  console.log('Inserting into public_assets (upsert on asset_code)...');

  let successCount = 0;
  let errorCount = 0;
  const BATCH = 20;

  for (let i = 0; i < assets.length; i += BATCH) {
    const batch = assets.slice(i, i + BATCH);
    const { error } = await supabase
      .from('public_assets')
      .upsert(batch, { onConflict: 'asset_code' });
    if (error) {
      console.error(`\n  [ERROR] Batch ${Math.floor(i / BATCH) + 1}: ${error.message}`);
      // Print the problematic batch for debugging
      batch.forEach((a) =>
        console.error(`    → ${a.asset_code}: ${a.asset_name}`)
      );
      errorCount += batch.length;
    } else {
      successCount += batch.length;
      process.stdout.write(`  Batch ${Math.floor(i / BATCH) + 1}: OK (${batch.length} rows)\n`);
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Import complete: ${successCount} inserted/updated, ${errorCount} errors`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
