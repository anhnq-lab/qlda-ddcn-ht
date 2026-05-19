/**
 * Contractor Mappers — snake_case (DB) ↔ PascalCase (Frontend)
 */
import type { Contractor, ContractorType } from '../../types';

export const dbToContractor = (row: any): Contractor => ({
    ContractorID: row.contractor_id,
    CapCertCode: row.cap_cert_code || '',
    CapCertLink: row.cap_cert_link || '',
    FullName: row.full_name,
    IsForeign: row.is_foreign,
    ContractorType: (row.contractor_type || 'Construction') as ContractorType,
    OpLicenseNo: row.op_license_no || '',
    Address: row.address || '',
    ContactInfo: row.contact_info || '',
    TaxCode: row.tax_code || '',
    Representative: row.representative || '',
    EstablishedYear: row.established_year || 0,
    Email: row.email || '',
    Website: row.website || '',
});

export const contractorToDb = (c: Partial<Contractor>) => ({
    ...(c.ContractorID !== undefined && { contractor_id: c.ContractorID }),
    ...(c.CapCertCode !== undefined && { cap_cert_code: c.CapCertCode || null }),
    ...(c.CapCertLink !== undefined && { cap_cert_link: c.CapCertLink || null }),
    ...(c.FullName !== undefined && { full_name: c.FullName }),
    ...(c.IsForeign !== undefined && { is_foreign: c.IsForeign }),
    ...(c.ContractorType !== undefined && { contractor_type: c.ContractorType }),
    ...(c.OpLicenseNo !== undefined && { op_license_no: c.OpLicenseNo || null }),
    ...(c.Address !== undefined && { address: c.Address }),
    ...(c.ContactInfo !== undefined && { contact_info: c.ContactInfo }),
    ...(c.TaxCode !== undefined && { tax_code: c.TaxCode || null }),
    ...(c.Representative !== undefined && { representative: c.Representative || null }),
    ...(c.EstablishedYear !== undefined && { established_year: c.EstablishedYear }),
    ...(c.Email !== undefined && { email: c.Email || null }),
    ...(c.Website !== undefined && { website: c.Website || null }),
});

