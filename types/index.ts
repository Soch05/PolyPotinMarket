export type UserRole = 'user' | 'modo'
export type MarketStatus = 'open' | 'closed'
export type MarketResult = 'yes' | 'no'
export type BetSide = 'yes' | 'no'

export interface User {
  id: string
  email: string
  username: string | null
  balance: number
  role: UserRole
}

export interface Market {
  id: string
  title: string
  description: string | null
  created_by: string
  end_date: string
  status: MarketStatus
  result: MarketResult | null
  hidden_user_id: string | null
  created_at: string
}

export interface Bet {
  id: string
  user_id: string
  market_id: string
  side: BetSide
  amount: number
  created_at: string
}

export interface MarketWithStats extends Market {
  totalYes: number
  totalNo: number
  probability: number
}

export interface BetWithMarket extends Bet {
  markets: Market
}

export function displayName(user: Pick<User, 'email' | 'username'>): string {
  return user.username ?? user.email.split('@')[0]
}
