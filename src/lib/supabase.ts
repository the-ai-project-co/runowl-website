import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

export type FeedbackType = 'general' | 'bug' | 'feature';

export interface FeedbackRow {
	id: string;
	created_at: string;
	type: FeedbackType;
	message: string;
	email: string | null;
	page: string | null;
	user_agent: string | null;
}
