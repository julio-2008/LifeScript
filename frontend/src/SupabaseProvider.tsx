import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { State, INITIAL_STATE } from './state';
import { LedgerEntry, LedgerEntryType, LedgerPrivacy } from './models';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

type SupabaseContextValue = {
  appState: State;
  loading: boolean;
  setAppState: (state: State) => Promise<void>;
  appendLedgerEntry: (entry: Omit<LedgerEntry, 'id' | 'createdAt' | 'hash'>) => Promise<LedgerEntry>;
  queryLedgerEntries: (filter?: { type?: LedgerEntryType; privacy?: LedgerPrivacy; since?: string }) => Promise<LedgerEntry[]>;
};

const SupabaseContext = createContext<SupabaseContextValue | null>(null);

export function useSupabase(): SupabaseContextValue {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within SupabaseProvider');
  }
  return context;
}

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [appState, setAppStateState] = useState<State>(INITIAL_STATE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initialize() {
      try {
        console.log('SupabaseProvider: Initializing...');

        // Carregar estado do Supabase
        const { data, error } = await supabase
          .from('app_state')
          .select('state')
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading state:', error);
        }

        if (data) {
          console.log('SupabaseProvider: Loaded state from Supabase');
          setAppStateState(data.state);
        } else {
          console.log('SupabaseProvider: No state found, using initial');
          // Salvar estado inicial
          const { error: insertError } = await supabase
            .from('app_state')
            .insert([{ state: INITIAL_STATE }]);

          if (insertError) {
            console.error('Error saving initial state:', insertError);
          }
          setAppStateState(INITIAL_STATE);
        }
      } catch (error) {
        console.error('SupabaseProvider error:', error);
        setAppStateState(INITIAL_STATE);
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, []);

  const setAppState = async (state: State) => {
    setAppStateState(state);
    try {
      await supabase
        .from('app_state')
        .upsert([{ state }], { onConflict: 'id' });
      console.log('State synced to Supabase');
    } catch (error) {
      console.error('Error syncing state:', error);
    }
  };

  const appendLedgerEntry = async (entry: Omit<LedgerEntry, 'id' | 'createdAt' | 'hash'>) => {
    const newEntry: LedgerEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      createdAt: new Date().toISOString(),
      hash: `${entry.type}:${entry.body}:${Date.now()}`,
    };

    try {
      await supabase
        .from('ledger_entries')
        .insert([newEntry]);
      console.log('Ledger entry added');
      return newEntry;
    } catch (error) {
      console.error('Error adding ledger entry:', error);
      throw error;
    }
  };

  const queryLedgerEntries = async (filter?: { type?: LedgerEntryType; privacy?: LedgerPrivacy; since?: string }) => {
    try {
      let query = supabase.from('ledger_entries').select('*');

      if (filter?.type) {
        query = query.eq('type', filter.type);
      }
      if (filter?.privacy) {
        query = query.eq('privacy', filter.privacy);
      }
      if (filter?.since) {
        query = query.gte('createdAt', filter.since);
      }

      const { data, error } = await query.order('createdAt', { ascending: false });

      if (error) {
        console.error('Error querying ledger entries:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error querying ledger:', error);
      return [];
    }
  };

  const value: SupabaseContextValue = {
    appState,
    loading,
    setAppState,
    appendLedgerEntry,
    queryLedgerEntries,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}
