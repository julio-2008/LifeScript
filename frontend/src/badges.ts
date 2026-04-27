// LifeScript badge catalog. Locked badges are grayed in the UI.
export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string; // ionicons or material-community-icons name
  iconSet?: 'ion' | 'mci';
  color: string;
  rule: string; // human-readable trigger
};

export const BADGES: Badge[] = [
  { id: 'first_step',     name: 'First Step',     description: 'Completed your very first mission.', icon: 'footsteps',     color: '#10B981', rule: 'Day 1 mission complete' },
  { id: 'early_bird',     name: 'Early Bird',     description: 'Started a mission before 9am.',      icon: 'sunny-outline', color: '#F59E0B', rule: 'Mission before 9am' },
  { id: 'unstoppable',    name: 'Unstoppable',    description: '7-day streak achieved.',             icon: 'flame',         color: '#EF4444', rule: '7-day streak' },
  { id: 'transformer',    name: 'Transformer',    description: '30-day streak achieved.',            icon: 'infinite',      color: '#8B5CF6', rule: '30-day streak' },
  { id: 'mind_master',    name: 'Mind Master',    description: 'Completed 10 Mind missions.',        icon: 'bulb',          color: '#7C3AED', rule: '10 Mind missions' },
  { id: 'wealth_builder', name: 'Wealth Builder', description: 'Completed 10 Finance missions.',     icon: 'cash',          color: '#F59E0B', rule: '10 Finance missions' },
  { id: 'iron_body',      name: 'Iron Body',      description: 'Completed 10 Health missions.',      icon: 'barbell',       color: '#10B981', rule: '10 Health missions' },
  { id: 'social_arc',     name: 'Connector',      description: 'Completed 10 Relationship missions.',icon: 'people',        color: '#EC4899', rule: '10 Relationship missions' },
  { id: 'craftsman',      name: 'Craftsman',      description: 'Completed 10 Skills missions.',      icon: 'hammer',        color: '#06B6D4', rule: '10 Skills missions' },
  { id: 'climber',        name: 'Climber',        description: 'Completed 10 Career missions.',      icon: 'trending-up',   color: '#3B82F6', rule: '10 Career missions' },
  { id: 'level_2',        name: 'Seeker',         description: 'Reached Level 2.',                   icon: 'compass',       color: '#3B82F6', rule: 'Reach Level 2' },
  { id: 'level_3',        name: 'Builder',        description: 'Reached Level 3.',                   icon: 'construct',     color: '#7C3AED', rule: 'Reach Level 3' },
  { id: 'level_4',        name: 'Achiever',       description: 'Reached Level 4.',                   icon: 'trophy',        color: '#F59E0B', rule: 'Reach Level 4' },
  { id: 'level_5',        name: 'Legend',         description: 'Reached Level 5.',                   icon: 'flame',         color: '#EC4899', rule: 'Reach Level 5' },
  { id: 'level_6',        name: 'Sovereign',      description: 'Reached the highest level.',         icon: 'planet',        color: '#FFD700', rule: 'Reach Level 6' },
  { id: 'boss_slayer',    name: 'Boss Slayer',    description: 'Defeated your first Boss Battle.',   icon: 'skull',         color: '#7C3AED', rule: 'First Boss Battle complete' },
  { id: 'shielded',       name: 'Shielded',       description: 'Earned a Streak Shield.',            icon: 'shield-checkmark', color: '#10B981', rule: 'Earn a streak shield' },
  { id: 'sharer',         name: 'Evangelist',     description: 'Shared your first LifeScript.',      icon: 'share-social',  color: '#7C3AED', rule: 'First share' },
  { id: 'recruiter',      name: 'Recruiter',      description: 'Invited your first friend.',         icon: 'person-add',    color: '#06B6D4', rule: 'First referral' },
  { id: 'tribe',          name: 'Tribe Builder',  description: 'Invited 3 friends — Pro unlocked.',  icon: 'people-circle', color: '#F59E0B', rule: '3 referrals' },
  { id: 'rest_master',    name: 'Rest Master',    description: 'Took a wise rest day.',              icon: 'bed',           color: '#9CA3AF', rule: 'Take a rest day' },
  { id: 'comeback',       name: 'Comeback Kid',   description: 'Restarted after losing a streak.',   icon: 'refresh-circle',color: '#3B82F6', rule: 'Restart after streak loss' },
  { id: 'century',        name: 'Centurion',      description: 'Completed 100 missions total.',      icon: 'medal',         color: '#FFD700', rule: '100 missions complete' },
  { id: 'night_owl',      name: 'Night Owl',      description: 'Completed a mission after 10pm.',    icon: 'moon',          color: '#1F2937', rule: 'Mission after 10pm' },
  { id: 'first_quote',    name: 'Wordsmith',      description: 'Read your first daily quote.',       icon: 'sparkles',      color: '#EC4899', rule: 'Read first quote' },
];

export function awardBadge(unlocked: string[], id: string): string[] {
  if (unlocked.includes(id)) return unlocked;
  return [...unlocked, id];
}
