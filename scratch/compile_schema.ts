import * as fs from 'fs';
import * as path from 'path';

const workspaceRoot = 'd:/QuocAnh/2026/01.Project/qlda-ddcn-ht';
const initSchemaPath = path.join(workspaceRoot, 'supabase', 'init_schema.sql');
const migrationsDir = path.join(workspaceRoot, 'supabase', 'migrations');
const outputPath = path.join(workspaceRoot, 'supabase', 'compiled_full_schema.sql');

function compile() {
    console.log('Starting schema compilation...');
    
    let compiledSql = '';
    
    // Add banner
    compiledSql += `-- =========================================================================\n`;
    compiledSql += `-- COMPILED SUPABASE FULL SCHEMA & MIGRATIONS\n`;
    compiledSql += `-- Generated on: ${new Date().toISOString()}\n`;
    compiledSql += `-- Contains init_schema.sql + all progressive migrations in chronological order\n`;
    compiledSql += `-- =========================================================================\n\n`;
    
    // 1. Read init_schema.sql
    if (fs.existsSync(initSchemaPath)) {
        console.log(`Adding init_schema.sql...`);
        const initContent = fs.readFileSync(initSchemaPath, 'utf8');
        compiledSql += `-- ==========================================\n`;
        compiledSql += `-- FILE: init_schema.sql\n`;
        compiledSql += `-- ==========================================\n\n`;
        compiledSql += initContent;
        compiledSql += `\n\n`;
    } else {
        console.error(`Error: init_schema.sql not found at ${initSchemaPath}`);
        return;
    }
    
    // 2. Read migration files
    if (fs.existsSync(migrationsDir)) {
        const files = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort(); // Sorts chronologically because of the naming convention (YYYYMMDD...)
            
        console.log(`Found ${files.length} migration files in ${migrationsDir}`);
        
        for (const file of files) {
            console.log(`Adding migration: ${file}...`);
            const filePath = path.join(migrationsDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            
            compiledSql += `-- ==========================================\n`;
            compiledSql += `-- MIGRATION: ${file}\n`;
            compiledSql += `-- ==========================================\n\n`;
            compiledSql += content;
            compiledSql += `\n\n`;
        }
    } else {
        console.warn(`Warning: migrations directory not found at ${migrationsDir}`);
    }
    
    // Write out the compiled file
    fs.writeFileSync(outputPath, compiledSql, 'utf8');
    console.log(`Successfully compiled schema to ${outputPath}`);
}

compile();
