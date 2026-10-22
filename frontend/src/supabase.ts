import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY! Check your .env file.')
}

export const supabase = createClient(url, key)

export interface StockAlert {
  id: number
  ticker: string
  name: string
  low_target: number | null
  high_target: number | null
  last_price: number | null
  status: string | null
  is_active: boolean
  updated_at: string
}

export type StockAlertInput = Pick<StockAlert, 'ticker' | 'name' | 'low_target' | 'high_target' | 'is_active'>
