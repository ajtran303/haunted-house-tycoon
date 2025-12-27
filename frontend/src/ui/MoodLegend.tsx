const MOOD_LEGEND = [
  { mood: 'happy', color: '#98fb98', label: 'Happy' },
  { mood: 'neutral', color: '#ffffff', label: 'Neutral' },
  { mood: 'unhappy', color: '#da70d6', label: 'Unhappy' },
  { mood: 'anxious', color: '#ffc107', label: 'Anxious' },
  { mood: 'miserable', color: '#4169e1', label: 'Miserable' },
  { mood: 'scared', color: '#ff5252', label: 'Scared' },
] as const;

export const MoodLegend = () => {
  return (
    <div>
      <div className="mb-2 text-sm font-bold text-gray-400">MOOD</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        {MOOD_LEGEND.map(({ mood, color, label }) => (
          <div key={mood} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-gray-300">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
