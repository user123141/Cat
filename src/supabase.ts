// src/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { PlayerProfile } from './types';
import { GameLogger } from './utils/GameLogger';

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || import.meta.env?.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || import.meta.env?.SUPABASE_ANON_KEY || '';

// Safely initialize the Supabase client only if keys are present to prevent startup crashes.
export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

if (supabase) {
  GameLogger.log('success', 'Supabase client initialized successfully.');
} else {
  GameLogger.log('warn', 'Supabase credentials missing. Running in local-only mode.');
}

/**
 * Saves the player's profile to Supabase.
 * Schema expectation: table 'player_profiles' with columns 'id' (text, primary key) and 'profile_data' (jsonb).
 */
export async function saveProfileToSupabase(userId: string, profile: PlayerProfile): Promise<boolean> {
  if (!supabase) {
    return false;
  }
  
  try {
    const { error } = await supabase
      .from('player_profiles')
      .upsert({
        id: userId,
        profile_data: profile,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.error('Error saving profile:', error);
      GameLogger.log('error', `Ошибка сохранения в облаке: ${error.message}`);
      return false;
    }

    return true;
  } catch (err: any) {
    console.error('Network or unknown error during save:', err);
    return false;
  }
}

/**
 * Loads the player's profile from the cloud.
 */
export async function loadProfileFromSupabase(userId: string): Promise<PlayerProfile | null> {
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('player_profiles')
      .select('profile_data')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error loading profile:', error);
      GameLogger.log('error', `Ошибка загрузки из облака: ${error.message}`);
      return null;
    }

    if (data && data.profile_data) {
      return data.profile_data as PlayerProfile;
    }

    return null;
  } catch (err: any) {
    console.error('Network or unknown error during Supabase load:', err);
    return null;
  }
}
