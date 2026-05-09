import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Load env variables
function loadEnv() {
  try {
    const envPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const part = trimmed.split('=');
          const key = part[0].trim();
          const val = part.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
          process.env[key] = val;
        }
      });
    }
  } catch (e) {
    console.error('Error loading env:', e);
  }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase URL or Key missing. Check .env!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Map status code (1-10) to core ProjectStatus (1-3)
function mapStatusCodeToCoreStatus(code: number): number {
  if ([1, 2, 10].includes(code)) return 1;
  if ([3, 4, 5, 6, 7, 8].includes(code)) return 2;
  if (code === 9) return 3;
  return 1; // default fallback
}

// 3. Find matched employee using intelligent heuristics
function findMatchedEmployee(accountantName: string, employees: any[]): any | null {
  const cleanName = accountantName.trim();
  const lowerName = cleanName.toLowerCase();

  // Try Heuristic 1: Exact match on full name
  const exactMatch = employees.find(emp => emp.full_name.trim().toLowerCase() === lowerName);
  if (exactMatch) return exactMatch;

  // Try Heuristic 2: Match Kế toán viên ending with the name (e.g., "Hương" -> "Nguyễn Thị Hương" Kế toán viên)
  const accountantMatch = employees.find(emp => {
    const pos = emp.position || '';
    const dept = emp.department || '';
    const isAccountant = pos.toLowerCase().includes('kế toán') || dept.toLowerCase().includes('kế toán');
    return isAccountant && emp.full_name.trim().toLowerCase().endsWith(' ' + lowerName);
  });
  if (accountantMatch) return accountantMatch;

  // Try Heuristic 3: Match anyone in Phòng Hành chính – Tổng hợp ending with the name
  const deptMatch = employees.find(emp => {
    const dept = emp.department || '';
    return dept.toLowerCase().includes('hành chính') && emp.full_name.trim().toLowerCase().endsWith(' ' + lowerName);
  });
  if (deptMatch) return deptMatch;

  // Try Heuristic 4: Match anyone ending with the name (last name match)
  const lastNameMatch = employees.find(emp => emp.full_name.trim().toLowerCase().endsWith(' ' + lowerName));
  if (lastNameMatch) return lastNameMatch;

  // Try Heuristic 5: Match anyone containing the name
  const containsMatch = employees.find(emp => emp.full_name.trim().toLowerCase().includes(lowerName));
  if (containsMatch) return containsMatch;

  return null;
}

// 4. Main execution
async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log(`🚀 STARTING PROJECT INGESTION... [Mode: ${isDryRun ? 'DRY_RUN (Simulation)' : 'LIVE (Write to DB)'}]`);

  const tsvPath = path.resolve(__dirname, '../Ks/Dm dự án.txt');
  if (!fs.existsSync(tsvPath)) {
    console.error(`❌ TSV file not found at: ${tsvPath}`);
    process.exit(1);
  }

  const rawContent = fs.readFileSync(tsvPath, 'utf-8');
  const lines = rawContent.split(/\r?\n/);
  console.log(`📖 Read ${lines.length} lines from file.`);

  if (lines.length < 4) {
    console.error('❌ Error: TSV file has fewer than 4 lines (invalid structure)');
    process.exit(1);
  }

  const header = lines[0].trim().split('\t');
  console.log('📋 Headers detected:', header);

  console.log('🕵️ Fetching existing employees from DB to match accountants...');
  const { data: dbEmployees, error: empError } = await supabase
    .from('employees')
    .select('employee_id, full_name, department, position');

  if (empError) {
    console.error('❌ Error fetching employees from database:', empError);
    process.exit(1);
  }

  console.log(`💾 Loaded ${dbEmployees?.length} employees from DB for matching.`);

  // Parse lines starting from index 3 (Line 4)
  const projectsToInsert: any[] = [];
  const projectAccountants: { project_id: string; raw_name: string; matched_employee_id?: string }[] = [];
  const accountantsToCreate = new Set<string>();
  const resolvedAccountantsMap = new Map<string, any>(); // raw_name -> matched employee object

  let skippedCount = 0;
  let parsedCount = 0;

  for (let i = 3; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine || rawLine.trim() === '') {
      skippedCount++;
      continue;
    }

    const columns = rawLine.split('\t');
    
    // Check if the row contains "Tổng" or is a summary line
    if (columns[1]?.trim() === 'Tổng' || columns[0]?.trim() === 'Tổng' || columns.slice(0, 3).every(col => !col || col.trim() === '')) {
      skippedCount++;
      continue;
    }

    const stt = columns[0]?.trim();
    let projectId = columns[1]?.trim();
    const projectName = columns[2]?.trim();
    const accountantName = columns[3]?.trim();
    const roomDaStr = columns[4]?.trim();
    const decisionLevel = columns[5]?.trim();
    const oldInvestor = columns[6]?.trim();
    const transferDecision = columns[7]?.trim();
    const statusCodeStr = columns[8]?.trim();

    if (!projectName) {
      skippedCount++;
      continue;
    }

    parsedCount++;

    // Process Project ID
    if (!projectId || projectId.toLowerCase() === 'chưa mở mã') {
      projectId = `TEMP_${stt}`;
    }

    // Process Department (Phòng DA)
    let managementBoard: number | null = null;
    if (roomDaStr) {
      const parsedRoom = parseInt(roomDaStr);
      if (!isNaN(parsedRoom)) {
        managementBoard = parsedRoom;
      }
    }

    // Process Status
    let currentStatusCode: number | null = null;
    let coreStatus = 1;
    if (statusCodeStr) {
      const parsedStatus = parseInt(statusCodeStr);
      if (!isNaN(parsedStatus)) {
        currentStatusCode = parsedStatus;
        coreStatus = mapStatusCodeToCoreStatus(parsedStatus);
      }
    }

    // Assemble DB schema properties
    projectsToInsert.push({
      project_id: projectId,
      project_name: projectName,
      group_code: 'C',
      investment_type: 1,
      total_investment: 0,
      status: coreStatus,
      management_board: managementBoard,
      decision_level_before_handover: decisionLevel || null,
      old_investor: oldInvestor || null,
      transfer_decision: transferDecision || null,
      current_status_code: currentStatusCode,
    });

    // Handle accountant matching
    if (accountantName && accountantName.toLowerCase() !== '#n/a' && accountantName !== '') {
      const cleanName = accountantName.trim();
      const lowerCleanName = cleanName.toLowerCase();

      // Check if we already resolved this raw name in our map
      let matchedEmp = resolvedAccountantsMap.get(lowerCleanName);
      
      if (matchedEmp === undefined) {
        // Resolve using heuristics
        matchedEmp = findMatchedEmployee(cleanName, dbEmployees || []);
        resolvedAccountantsMap.set(lowerCleanName, matchedEmp);
        
        if (!matchedEmp) {
          accountantsToCreate.add(cleanName);
        }
      }

      projectAccountants.push({
        project_id: projectId,
        raw_name: cleanName,
      });
    }
  }

  console.log('\n--- PARSING & RESOLUTION COMPLETE ---');
  console.log(`✅ Parsed projects: ${parsedCount}`);
  console.log(`🚫 Skipped/empty rows: ${skippedCount}`);
  console.log(`💼 Accountant resolution status:`);
  
  const matchesSummary: any[] = [];
  const unmatchedSummary: string[] = [];
  
  resolvedAccountantsMap.forEach((matched, raw) => {
    if (matched) {
      matchesSummary.push({ raw, matched: `${matched.full_name} (${matched.employee_id})` });
    } else {
      unmatchedSummary.push(raw);
    }
  });

  console.log('   🟢 Successfully matched accountants to existing employees:');
  console.table(matchesSummary);
  console.log('   🔴 Unmatched (will be created as new employees under Phòng Tài chính - Kế toán):');
  console.log(unmatchedSummary.length > 0 ? unmatchedSummary.join(', ') : 'None!');

  if (isDryRun) {
    console.log('\n--- DRY RUN SUMMARY (NO WRITE) ---');
    console.log('Project records to upsert preview (First 3 items):');
    console.log(JSON.stringify(projectsToInsert.slice(0, 3), null, 2));
    console.log('\n❌ dry-run mode active. No data has been modified on the Supabase database.');
    return;
  }

  // Live import writes to DB
  console.log('\n--- LIVE DATABASE INGESTION ---');

  // Step 1: Create missing accountants as employees
  if (accountantsToCreate.size > 0) {
    console.log(`➕ Creating ${accountantsToCreate.size} new accountant employees...`);
    const employeesToInsert = Array.from(accountantsToCreate).map(name => {
      const cleanId = `NV_ACC_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      return {
        employee_id: cleanId,
        full_name: name,
        department: 'Phòng Tài chính - Kế toán',
        position: 'Kế toán viên',
        role: 'User',
        status: 1,
      };
    });

    const { data: insertedEmps, error: insertEmpErr } = await supabase
      .from('employees')
      .insert(employeesToInsert)
      .select();

    if (insertEmpErr) {
      console.error('❌ Failed to insert new accountant employees:', insertEmpErr);
      process.exit(1);
    }

    console.log(`✅ Successfully created ${insertedEmps?.length} accountant employees.`);
    
    // Add newly created to our resolution map
    for (const emp of insertedEmps || []) {
      resolvedAccountantsMap.set(emp.full_name.trim().toLowerCase(), emp);
    }
  }

  // Step 2: Batch insert/upsert Projects
  const batchSize = 100;
  console.log(`💾 Upserting ${projectsToInsert.length} projects in batches of ${batchSize}...`);
  
  for (let idx = 0; idx < projectsToInsert.length; idx += batchSize) {
    const batch = projectsToInsert.slice(idx, idx + batchSize);
    console.log(`   📤 Uploading batch ${idx / batchSize + 1}... (${batch.length} items)`);
    
    const { error: upsertErr } = await supabase
      .from('projects')
      .upsert(batch);

    if (upsertErr) {
      console.error(`❌ Batch ${idx / batchSize + 1} upsert failed!`, upsertErr);
      process.exit(1);
    }
  }
  console.log('✅ All project records upserted successfully.');

  // Step 3: Delete existing 'Kế toán phụ trách' roles to avoid duplicates
  const projectIdsToClean = projectAccountants.map(pa => pa.project_id);
  console.log(`🧹 Cleaning existing 'Kế toán phụ trách' project member records for ${projectIdsToClean.length} projects...`);
  
  for (let idx = 0; idx < projectIdsToClean.length; idx += 200) {
    const pIdBatch = projectIdsToClean.slice(idx, idx + 200);
    const { error: deleteErr } = await supabase
      .from('project_members')
      .delete()
      .eq('role', 'Kế toán phụ trách')
      .in('project_id', pIdBatch);

    if (deleteErr) {
      console.error('❌ Failed to delete old project accountant links:', deleteErr);
      process.exit(1);
    }
  }
  console.log('✅ Cleanup of old accountant links complete.');

  // Step 4: Insert new project accountant member links
  const memberLinksToInsert: any[] = [];
  for (const link of projectAccountants) {
    const matchedEmployee = resolvedAccountantsMap.get(link.raw_name.toLowerCase());
    if (matchedEmployee) {
      memberLinksToInsert.push({
        project_id: link.project_id,
        employee_id: matchedEmployee.employee_id,
        role: 'Kế toán phụ trách',
      });
    } else {
      console.warn(`⚠️ Warning: Accountant '${link.raw_name}' could not be matched even after creation check!`);
    }
  }

  console.log(`💾 Inserting ${memberLinksToInsert.length} project member links...`);
  for (let idx = 0; idx < memberLinksToInsert.length; idx += batchSize) {
    const batch = memberLinksToInsert.slice(idx, idx + batchSize);
    const { error: linkErr } = await supabase
      .from('project_members')
      .insert(batch);

    if (linkErr) {
      console.error(`❌ Batch ${idx / batchSize + 1} project member link insert failed!`, linkErr);
      process.exit(1);
    }
  }

  console.log('\n🌟 INGESTION COMPLETED SUCCESSFULLY! 🌟');
}

main().catch(err => {
  console.error('💥 UNCAUGHT CRITICAL ERROR:', err);
  process.exit(1);
});
