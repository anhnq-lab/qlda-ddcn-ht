-- Cleanup seeded data
DELETE FROM disbursement_plans WHERE project_id LIKE 'SEED-%';
DELETE FROM package_bidders WHERE package_id IN (SELECT package_id FROM bidding_packages WHERE project_id LIKE 'SEED-%');
DELETE FROM contracts WHERE project_id LIKE 'SEED-%';
DELETE FROM bidding_packages WHERE project_id LIKE 'SEED-%';
DELETE FROM procurement_plans WHERE project_id LIKE 'SEED-%';
DELETE FROM capital_plans WHERE project_id LIKE 'SEED-%';
DELETE FROM projects WHERE project_id LIKE 'SEED-%';
