// Inventory — symbolic life-asset collectibles.
export const INVENTORY_META: Record<string, { name: string; icon: string; color: string; source: string }> = {
  gold_coin:     { name: 'Gold Coin',      icon: 'logo-usd',       color: '#F59E0B', source: 'Finances' },
  vitality_gem:  { name: 'Vitality Gem',   icon: 'fitness',        color: '#10B981', source: 'Health' },
  wisdom_crystal:{ name: 'Wisdom Crystal', icon: 'bulb',           color: '#A78BFA', source: 'Mind' },
  social_feather:{ name: 'Social Feather', icon: 'people',         color: '#F43F5E', source: 'Relationships' },
  ambition_key:  { name: 'Ambition Key',   icon: 'briefcase',      color: '#3B82F6', source: 'Career' },
  artisan_hammer:{ name: 'Artisan Hammer', icon: 'construct',      color: '#06B6D4', source: 'Skills' },
  compass_shard: { name: 'Compass Shard',  icon: 'compass',        color: '#FFFFFF', source: 'Purpose' },
  eternal_leaf:  { name: 'Eternal Leaf',   icon: 'ribbon',         color: '#FFD700', source: 'Legacy' },
};

export function inventoryKeyForArea(area: string): string {
  const map: Record<string, string> = {
    Career: 'ambition_key',
    Finances: 'gold_coin',
    Health: 'vitality_gem',
    Relationships: 'social_feather',
    Mind: 'wisdom_crystal',
    Skills: 'artisan_hammer',
    Purpose: 'compass_shard',
    Legacy: 'eternal_leaf',
  };
  return map[area] || 'gold_coin';
}
