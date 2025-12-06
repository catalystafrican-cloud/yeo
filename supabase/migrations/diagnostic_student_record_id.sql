-- Diagnostic Script: Check if student_record_id column exists and is properly configured
-- Run this in your Supabase SQL Editor to diagnose the issue

-- 1. Check if student_record_id column exists in student_profiles table
SELECT 
    'Column Existence Check' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'student_profiles' 
            AND column_name = 'student_record_id'
        ) 
        THEN '✓ Column EXISTS - No migration needed for column creation'
        ELSE '✗ Column MISSING - Run add_student_record_id_to_student_profiles.sql migration'
    END as status;

-- 2. Check how many student_profiles exist
SELECT 
    'Student Profiles Count' as check_type,
    COUNT(*) as total_count,
    COUNT(student_record_id) as linked_count,
    COUNT(*) - COUNT(student_record_id) as unlinked_count
FROM public.student_profiles;

-- 3. Check if there are students with user_id but no linked student_profile
SELECT 
    'Orphaned Students Check' as check_type,
    COUNT(*) as students_with_user_id,
    COUNT(sp.id) as linked_profiles,
    COUNT(*) - COUNT(sp.id) as unlinked_students
FROM public.students s
LEFT JOIN public.student_profiles sp ON s.user_id = sp.id
WHERE s.user_id IS NOT NULL;

-- 4. Check the current handle_new_user function to see if it includes student_record_id
SELECT 
    'Trigger Function Check' as check_type,
    CASE 
        WHEN prosrc LIKE '%student_record_id%'
        THEN '✓ Function UPDATED - Includes student_record_id handling'
        ELSE '✗ Function OUTDATED - Run fix_handle_new_user_trigger.sql migration'
    END as status
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 5. Sample data check - show first 5 student profiles and their linkage status
SELECT 
    sp.id,
    sp.full_name,
    sp.student_record_id,
    s.name as student_table_name,
    s.admission_number,
    CASE 
        WHEN sp.student_record_id IS NOT NULL THEN '✓ Linked'
        WHEN sp.student_record_id IS NULL AND s.id IS NOT NULL THEN '⚠ Can be linked'
        ELSE '✗ Not linked'
    END as link_status
FROM public.student_profiles sp
LEFT JOIN public.students s ON s.user_id = sp.id
LIMIT 5;

-- Summary message
DO $$ 
DECLARE
    col_exists BOOLEAN;
    func_updated BOOLEAN;
    unlinked_count INTEGER;
BEGIN
    -- Check column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'student_profiles' 
        AND column_name = 'student_record_id'
    ) INTO col_exists;
    
    -- Check function
    SELECT prosrc LIKE '%student_record_id%'
    INTO func_updated
    FROM pg_proc 
    WHERE proname = 'handle_new_user';
    
    -- Check unlinked records
    SELECT COUNT(*) - COUNT(student_record_id)
    INTO unlinked_count
    FROM public.student_profiles;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DIAGNOSIS SUMMARY';
    RAISE NOTICE '========================================';
    
    IF NOT col_exists THEN
        RAISE NOTICE '❌ ACTION REQUIRED: Column student_record_id does not exist!';
        RAISE NOTICE '   Run: add_student_record_id_to_student_profiles.sql';
    ELSE
        RAISE NOTICE '✅ Column student_record_id exists';
        
        IF unlinked_count > 0 THEN
            RAISE NOTICE '⚠️  WARNING: % student profiles are not linked', unlinked_count;
            RAISE NOTICE '   Run: add_student_record_id_to_student_profiles.sql to link them';
        ELSE
            RAISE NOTICE '✅ All student profiles are properly linked';
        END IF;
    END IF;
    
    IF NOT func_updated THEN
        RAISE NOTICE '⚠️  WARNING: Trigger function needs update for new students';
        RAISE NOTICE '   Run: fix_handle_new_user_trigger.sql';
    ELSE
        RAISE NOTICE '✅ Trigger function is up to date';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;
