-- Clean up unused author verification system

-- Drop the unused author-related tables and their dependencies
DROP TABLE IF EXISTS author_document_access_log CASCADE;
DROP TABLE IF EXISTS verified_authors CASCADE; 
DROP TABLE IF EXISTS author_applications CASCADE;

-- The RLS policies and triggers will be automatically dropped with CASCADE