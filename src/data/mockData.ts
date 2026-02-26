export interface Team {
  name: string;
  code: string;
  score?: string;
  overs?: string;
}

export interface Match {
  id: string;
  series: string;
  format: 'T20' | 'ODI' | 'Test';
  team1: Team;
  team2: Team;
  status: 'Live' | 'Scheduled' | 'Completed';
  venue: string;
  time?: string;
  runRate?: string;
  result?: string;
  winProbability?: {
    team1: number;
    team2: number;
  };
}

export const liveMatches: Match[] = [
  {
    id: '1',
    series: 'ICC World Cup 2023',
    format: 'ODI',
    team1: {
      name: 'India',
      code: 'IND',
      score: '287/4',
      overs: '45.2'
    },
    team2: {
      name: 'Australia',
      code: 'AUS',
      score: '180/6',
      overs: '32.1'
    },
    status: 'Live',
    venue: 'Wankhede Stadium, Mumbai',
    runRate: '6.32',
    winProbability: {
      team1: 75,
      team2: 25
    }
  },
  {
    id: '2',
    series: 'T20 World Cup 2024',
    format: 'T20',
    team1: {
      name: 'England',
      code: 'ENG',
      score: '156/7',
      overs: '18.4'
    },
    team2: {
      name: 'Pakistan',
      code: 'PAK',
      score: '89/3',
      overs: '12.0'
    },
    status: 'Live',
    venue: 'Lord\'s, London',
    runRate: '7.42'
  }
];

export const upcomingMatches: Match[] = [
  {
    id: '3',
    series: 'Border-Gavaskar Trophy',
    format: 'Test',
    team1: {
      name: 'India',
      code: 'IND'
    },
    team2: {
      name: 'Australia',
      code: 'AUS'
    },
    status: 'Scheduled',
    venue: 'Melbourne Cricket Ground',
    time: '9:30 AM'
  },
  {
    id: '4',
    series: 'Asia Cup 2024',
    format: 'ODI',
    team1: {
      name: 'Sri Lanka',
      code: 'SL'
    },
    team2: {
      name: 'Bangladesh',
      code: 'BAN'
    },
    status: 'Scheduled',
    venue: 'R.Premadasa Stadium, Colombo',
    time: '2:30 PM'
  }
];

export const completedMatches: Match[] = [
  {
    id: '5',
    series: 'IPL 2024',
    format: 'T20',
    team1: {
      name: 'Mumbai Indians',
      code: 'MI',
      score: '185/6',
      overs: '20.0'
    },
    team2: {
      name: 'Chennai Super Kings',
      code: 'CSK',
      score: '178/8',
      overs: '20.0'
    },
    status: 'Completed',
    venue: 'Wankhede Stadium, Mumbai',
    result: 'Mumbai Indians won by 7 runs'
  },
  {
    id: '6',
    series: 'The Ashes 2023',
    format: 'Test',
    team1: {
      name: 'England',
      code: 'ENG',
      score: '325 & 273',
      overs: '98.2'
    },
    team2: {
      name: 'Australia',
      code: 'AUS',
      score: '416 & 185/3',
      overs: '45.0'
    },
    status: 'Completed',
    venue: 'Lord\'s, London',
    result: 'Australia won by 7 wickets'
  }
];