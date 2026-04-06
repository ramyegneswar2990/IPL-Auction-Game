const TEAM_THEMES = {
  MI: { primary: '#0057B8', secondary: '#D4AF37' },
  'MUMBAI INDIANS': { primary: '#0057B8', secondary: '#D4AF37' },
  CSK: { primary: '#F9CD05', secondary: '#1E1E1E' },
  'CHENNAI SUPER KINGS': { primary: '#F9CD05', secondary: '#1E1E1E' },
  RCB: { primary: '#C8102E', secondary: '#111111' },
  'ROYAL CHALLENGERS BENGALURU': { primary: '#C8102E', secondary: '#111111' },
  KKR: { primary: '#3B0A57', secondary: '#D4AF37' },
  'KOLKATA KNIGHT RIDERS': { primary: '#3B0A57', secondary: '#D4AF37' },
  DC: { primary: '#17479E', secondary: '#EF3340' },
  'DELHI CAPITALS': { primary: '#17479E', secondary: '#EF3340' },
  RR: { primary: '#FF4FA0', secondary: '#254AA5' },
  'RAJASTHAN ROYALS': { primary: '#FF4FA0', secondary: '#254AA5' },
  SRH: { primary: '#F26A1B', secondary: '#111111' },
  'SUNRISERS HYDERABAD': { primary: '#F26A1B', secondary: '#111111' },
  PBKS: { primary: '#D71920', secondary: '#B7B7B7' },
  'PUNJAB KINGS': { primary: '#D71920', secondary: '#B7B7B7' },
  GT: { primary: '#1C2C5B', secondary: '#C5A05A' },
  'GUJARAT TITANS': { primary: '#1C2C5B', secondary: '#C5A05A' },
  LSG: { primary: '#6EC1E4', secondary: '#F26A1B' },
  'LUCKNOW SUPER GIANTS': { primary: '#6EC1E4', secondary: '#F26A1B' },
}

export function getTeamTheme(teamName) {
  if (!teamName) return { primary: '#FF8A00', secondary: '#1F2937' }
  const key = String(teamName).trim().toUpperCase()
  return TEAM_THEMES[key] || { primary: '#FF8A00', secondary: '#1F2937' }
}

export function getPlayerImageUrl(player) {
  const seed = encodeURIComponent(player?.id || player?.name || 'player')
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}&backgroundType=gradientLinear`
}
