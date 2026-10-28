type RankableTeam = {
  isDisqualified?: boolean;
  totalScore?: number | null;
};

export function sortTeamsForRanking<T extends RankableTeam>(teams: T[]): T[] {
  return [...teams].sort((a, b) => {
    const dqA = a.isDisqualified ? 1 : 0;
    const dqB = b.isDisqualified ? 1 : 0;
    if (dqA !== dqB) {
      return dqA - dqB;
    }
    return (b.totalScore || 0) - (a.totalScore || 0);
  });
}

export function rankingLabel<T extends RankableTeam>(sortedTeams: T[], index: number): string {
  const team = sortedTeams[index];
  if (team?.isDisqualified) {
    return 'DSQ';
  }
  let rank = 0;
  for (let i = 0; i <= index; i += 1) {
    if (!sortedTeams[i]?.isDisqualified) {
      rank += 1;
    }
  }
  return `#${rank}`;
}
