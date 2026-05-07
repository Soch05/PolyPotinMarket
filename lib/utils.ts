export function calculateProbability(totalYes: number, totalNo: number): number {
  const total = totalYes + totalNo
  if (total === 0) return 50
  return Math.round((totalYes / total) * 100)
}

export function calculateWinnings(
  userBet: number,
  totalWinningBets: number,
  losersPool: number
): number {
  if (totalWinningBets === 0) return userBet
  return Math.round(userBet + (userBet / totalWinningBets) * losersPool)
}

export function formatTokens(amount: number): string {
  return `${amount} token${amount !== 1 ? 's' : ''}`
}
