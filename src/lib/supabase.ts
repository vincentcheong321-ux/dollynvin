
import { createClient } from '@supabase/supabase-js';

// Credentials provided by the user
const supabaseUrl = 'https://usgowottnszzozjhxque.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzZ293b3R0bnN6em96amh4cXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDkxMDMsImV4cCI6MjA4MDMyNTEwM30.yxu5caAfXaRag0x5jNSc6wSHUSfmHNeNVbaf_iv9w_w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
