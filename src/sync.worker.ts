// src/sync.worker.ts
import { createClient } from '@supabase/supabase-js';

let supabaseClient: any = null;

self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type === 'INIT') {
    const { url, key } = payload;
    if (url && key) {
      supabaseClient = createClient(url, key);
      self.postMessage({ type: 'INIT_SUCCESS' });
    } else {
      self.postMessage({ type: 'INIT_FAIL', error: 'Missing credentials' });
    }
  }

  if (type === 'SAVE_PROFILE') {
    const { userId, profile } = payload;
    if (!supabaseClient) {
      self.postMessage({ type: 'SAVE_FAIL', error: 'Supabase client not initialized' });
      return;
    }

    try {
      const { error } = await supabaseClient
        .from('player_profiles')
        .upsert({
          id: userId,
          profile_data: profile,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) {
        self.postMessage({ type: 'SAVE_FAIL', error: error.message });
      } else {
        self.postMessage({ type: 'SAVE_SUCCESS', userId });
      }
    } catch (err: any) {
      self.postMessage({ type: 'SAVE_FAIL', error: err.message || String(err) });
    }
  }

  if (type === 'LOAD_PROFILE') {
    const { userId } = payload;
    if (!supabaseClient) {
      self.postMessage({ type: 'LOAD_FAIL', error: 'Supabase client not initialized' });
      return;
    }

    try {
      const { data, error } = await supabaseClient
        .from('player_profiles')
        .select('profile_data')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        self.postMessage({ type: 'LOAD_FAIL', error: error.message });
      } else {
        self.postMessage({ type: 'LOAD_SUCCESS', data: data?.profile_data || null });
      }
    } catch (err: any) {
      self.postMessage({ type: 'LOAD_FAIL', error: err.message || String(err) });
    }
  }
};
