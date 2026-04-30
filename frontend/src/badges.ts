// LifeScript 2.0 badges + trait catalog.
export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  rule: string;
  rarity?: 'common' | 'rare' | 'legendary';
};

export const BADGES: Badge[] = [
  // Core milestones
  { id: 'first_step', name: 'First Step', description: 'Wrote the first line of your LifeScript.', icon: 'footsteps', color: '#10B981', rule: 'Day 1 mission complete' },
  { id: 'unstoppable', name: 'Unstoppable', description: '7-day streak.', icon: 'flame', color: '#F43F5E', rule: '7-day streak' },
  { id: 'transformer', name: 'Transformer', description: '30-day streak.', icon: 'infinite', color: '#A78BFA', rule: '30-day streak' },
  { id: 'centurion', name: 'Centurion', description: '100 missions completed.', icon: 'medal', color: '#FFD700', rule: '100 missions', rarity: 'rare' },
  { id: 'early_bird', name: 'Early Bird', description: 'Mission before 9am.', icon: 'sunny', color: '#F59E0B', rule: 'Mission before 9am' },
  { id: 'night_owl', name: 'Night Owl', description: 'Mission after 10pm.', icon: 'moon', color: '#1F2937', rule: 'Mission after 10pm' },

  // Chapter badges
  { id: 'chapter_1', name: 'Chapter I', description: 'Completed Chapter 1.', icon: 'book', color: '#A78BFA', rule: 'Finish Day 1' },
  { id: 'chapter_2', name: 'Chapter II', description: 'Completed Chapter 2.', icon: 'book', color: '#3B82F6', rule: 'Finish Day 2' },
  { id: 'chapter_3', name: 'Chapter III', description: 'Uncovered the hidden pattern.', icon: 'eye', color: '#F59E0B', rule: 'Finish Day 3', rarity: 'rare' },

  // Era badges
  { id: 'era_1', name: 'Awakened', description: 'Entered the Awakening era.', icon: 'partly-sunny', color: '#A78BFA', rule: 'Reach Level 1+' },
  { id: 'era_2', name: 'Builder', description: 'Entered the Builder era.', icon: 'hammer', color: '#3B82F6', rule: 'Reach Level 11' },
  { id: 'era_3', name: 'Achiever', description: 'Entered the Achiever era.', icon: 'trophy', color: '#10B981', rule: 'Reach Level 21' },
  { id: 'era_4', name: 'Leader', description: 'Entered the Leader era.', icon: 'flame', color: '#F43F5E', rule: 'Reach Level 31' },
  { id: 'era_5', name: 'Sovereign', description: 'Entered the Sovereign era.', icon: 'planet', color: '#FFFFFF', rule: 'Reach Level 41', rarity: 'legendary' },
  { id: 'prestige', name: 'Prestige', description: 'Completed your first LifeScript.', icon: 'star', color: '#FFD700', rule: 'Reach Level 50', rarity: 'legendary' },

  // Area traits (10 missions in an area)
  { id: 'trait_career', name: 'Career Strategist', description: '10 Career missions.', icon: 'briefcase', color: '#3B82F6', rule: '10 Career' },
  { id: 'trait_finances', name: 'Financial Strategist', description: '10 Finance missions.', icon: 'cash', color: '#F59E0B', rule: '10 Finance' },
  { id: 'trait_health', name: 'Iron Body', description: '10 Health missions.', icon: 'barbell', color: '#10B981', rule: '10 Health' },
  { id: 'trait_relationships', name: 'Connector', description: '10 Relationship missions.', icon: 'people', color: '#F43F5E', rule: '10 Relationships' },
  { id: 'trait_mind', name: 'Focused Mind', description: '10 Mind missions.', icon: 'bulb', color: '#A78BFA', rule: '10 Mind' },
  { id: 'trait_skills', name: 'Craftsman', description: '10 Skill missions.', icon: 'construct', color: '#06B6D4', rule: '10 Skills' },
  { id: 'trait_purpose', name: 'Navigator', description: '10 Purpose missions.', icon: 'compass', color: '#FFFFFF', rule: '10 Purpose' },
  { id: 'trait_legacy', name: 'Legacy Weaver', description: '10 Legacy missions.', icon: 'ribbon', color: '#FFD700', rule: '10 Legacy' },

  // Social / virality
  { id: 'sharer', name: 'Evangelist', description: 'First share.', icon: 'share-social', color: '#A78BFA', rule: 'First share' },
  { id: 'recruiter', name: 'Recruiter', description: 'First referral.', icon: 'person-add', color: '#06B6D4', rule: 'First referral' },
  { id: 'tribe', name: 'Tribe Builder', description: '3 friends joined.', icon: 'people-circle', color: '#F59E0B', rule: '3 referrals' },
  { id: 'champion', name: 'Champion', description: 'Won a Life Score battle.', icon: 'ribbon', color: '#FFD700', rule: 'Win a battle', rarity: 'rare' },
  { id: 'defeated', name: 'Defeated', description: 'Lost a Life Score battle. Come back stronger.', icon: 'skull', color: '#6B7280', rule: 'Lose a battle' },
  { id: 'letter_sealed', name: 'Time Traveller', description: 'Sealed your legacy letter.', icon: 'mail', color: '#A78BFA', rule: 'Seal future letter' },
  { id: 'dream_built', name: 'Dream Keeper', description: 'Placed 5 stars on your dream board.', icon: 'star', color: '#F59E0B', rule: '5 dream stars' },

  // Special
  { id: 'hidden_pattern', name: 'Pattern Seen', description: 'Uncovered your hidden pattern.', icon: 'eye', color: '#F59E0B', rule: 'Day 3 insight', rarity: 'rare' },
  { id: 'boss_slayer', name: 'Boss Slayer', description: 'Defeated a Boss Battle.', icon: 'skull', color: '#A78BFA', rule: 'Complete boss', rarity: 'rare' },
  { id: 'shielded', name: 'Shielded', description: 'Earned a Streak Shield.', icon: 'shield-checkmark', color: '#10B981', rule: 'Earn shield' },
  { id: 'first_spin', name: 'Lucky', description: 'Spun the wheel.', icon: 'flash', color: '#F59E0B', rule: 'First daily spin' },
  { id: 'reflector', name: 'Reflector', description: 'Wrote 10 mission reflections.', icon: 'create', color: '#C4B5FD', rule: '10 reflections' },
  { id: 'identity_seen', name: 'Identified', description: 'Unlocked your Identity Card.', icon: 'card', color: '#F59E0B', rule: 'Generate identity card', rarity: 'rare' },
];

export function awardBadge(list: string[], id: string): string[] {
  return list.includes(id) ? list : [...list, id];
}
