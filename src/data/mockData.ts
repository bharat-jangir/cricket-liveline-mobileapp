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

export interface Venue {
  id: string;
  name: string;
  city: string;
  country: string;
  image: string;
  capacity?: string;
}

export const mockVenues: Venue[] = [
  {
    id: 'v1',
    name: 'Narendra Modi Stadium',
    city: 'Ahmedabad',
    country: 'India',
    image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    capacity: '132,000'
  },
  {
    id: 'v2',
    name: 'Wankhede Stadium',
    city: 'Mumbai',
    country: 'India',
    image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    capacity: '33,108'
  },
  {
    id: 'v3',
    name: 'Eden Gardens',
    city: 'Kolkata',
    country: 'India',
    image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    capacity: '68,000'
  },
  {
    id: 'v4',
    name: 'Lord\'s Cricket Ground',
    city: 'London',
    country: 'England',
    image: 'https://images.unsplash.com/photo-1624526267923-a128af55f756?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    capacity: '30,000'
  },
  {
    id: 'v5',
    name: 'Melbourne Cricket Ground',
    city: 'Melbourne',
    country: 'Australia',
    image: 'https://images.unsplash.com/photo-1563291074-2bf8677ac0e5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    capacity: '100,024'
  },
  {
    id: 'v6',
    name: 'Sydney Cricket Ground',
    city: 'Sydney',
    country: 'Australia',
    image: 'https://images.unsplash.com/photo-1629813284000-dcbd9aeb24e4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    capacity: '48,000'
  }
];

export interface PlayerStats {
  matches: string;
  runs?: string;
  wickets?: string;
  average?: string;
  strikeRate?: string;
  economy?: string;
  highScore?: string;
  bestBowling?: string;
  hundreds?: string;
  fifties?: string;
  fiveWickets?: string;
}

export interface Player {
  id: string;
  name: string;
  country: string;
  role: 'Batsman' | 'Bowler' | 'All-Rounder';
  battingStyle: string;
  bowlingStyle: string;
  image: string;
  age: string;
  birthPlace: string;
  teams: string[];
  recentMatches?: string[]; // IDs reference 'completedMatches'
  recentNews?: { id: string, title: string, date: string, image: string }[];
  stats: {
    test: PlayerStats;
    odi: PlayerStats;
    t20i: PlayerStats;
  };
}

export const mockPlayers: Player[] = [
  {
    id: 'p1',
    name: 'Virat Kohli',
    country: 'India',
    role: 'Batsman',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm medium',
    image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80',
    age: '35',
    birthPlace: 'Delhi, India',
    teams: ['India', 'Royal Challengers Bangalore', 'Delhi'],
    stats: {
      test: { matches: '113', runs: '8848', average: '49.15', highScore: '254*', hundreds: '29', fifties: '30' },
      odi: { matches: '292', runs: '13848', average: '58.67', strikeRate: '93.62', highScore: '183', hundreds: '50', fifties: '72' },
      t20i: { matches: '117', runs: '4037', average: '51.75', strikeRate: '138.15', highScore: '122*', hundreds: '1', fifties: '37' },
    }
  },
  {
    id: 'p2',
    name: 'Pat Cummins',
    country: 'Australia',
    role: 'Bowler',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm fast',
    image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80',
    age: '30',
    birthPlace: 'Westmead, Sydney',
    teams: ['Australia', 'Sunrisers Hyderabad', 'New South Wales'],
    stats: {
      test: { matches: '58', wickets: '258', average: '22.45', economy: '2.77', bestBowling: '6/23', fiveWickets: '10' },
      odi: { matches: '82', wickets: '136', average: '27.91', economy: '5.29', bestBowling: '5/70', fiveWickets: '1' },
      t20i: { matches: '52', wickets: '57', average: '24.12', economy: '7.36', bestBowling: '3/15', fiveWickets: '0' },
    }
  },
  {
    id: 'p3',
    name: 'Ben Stokes',
    country: 'England',
    role: 'All-Rounder',
    battingStyle: 'Left-hand bat',
    bowlingStyle: 'Right-arm fast-medium',
    image: 'https://images.unsplash.com/photo-1624526267923-a128af55f756?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80',
    age: '32',
    birthPlace: 'Christchurch, New Zealand',
    teams: ['England', 'Chennai Super Kings', 'Durham'],
    stats: {
      test: { matches: '100', runs: '6251', wickets: '197', average: '35.31', economy: '3.31', hundreds: '13', fiveWickets: '4' },
      odi: { matches: '114', runs: '3463', wickets: '74', average: '40.26', economy: '6.05', hundreds: '5', fiveWickets: '1' },
      t20i: { matches: '43', runs: '585', wickets: '26', average: '21.66', economy: '8.39', hundreds: '0', fiveWickets: '0' },
    }
  },
  {
    id: 'p4',
    name: 'Babar Azam',
    country: 'Pakistan',
    role: 'Batsman',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm offbreak',
    image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80',
    age: '29',
    birthPlace: 'Lahore, Punjab',
    teams: ['Pakistan', 'Peshawar Zalmi', 'Karachi Kings'],
    stats: {
      test: { matches: '52', runs: '3898', average: '45.85', highScore: '196', hundreds: '9', fifties: '26' },
      odi: { matches: '117', runs: '5729', average: '56.72', strikeRate: '88.75', highScore: '158', hundreds: '19', fifties: '32' },
      t20i: { matches: '109', runs: '3698', average: '41.55', strikeRate: '129.12', highScore: '122', hundreds: '3', fifties: '33' },
    }
  },
  {
    id: 'p5',
    name: 'Rashid Khan',
    country: 'Afghanistan',
    role: 'Bowler',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm legbreak',
    image: 'https://images.unsplash.com/photo-1563291074-2bf8677ac0e5?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80',
    age: '25',
    birthPlace: 'Nangarhar, Afghanistan',
    teams: ['Afghanistan', 'Gujarat Titans', 'Adelaide Strikers'],
    stats: {
      test: { matches: '5', wickets: '34', average: '22.35', economy: '3.08', bestBowling: '7/137', fiveWickets: '4' },
      odi: { matches: '103', wickets: '183', average: '20.53', economy: '4.21', bestBowling: '7/18', fiveWickets: '4' },
      t20i: { matches: '85', wickets: '138', average: '14.27', economy: '6.07', bestBowling: '5/3', fiveWickets: '2' },
    }
  },
  {
    id: 'p6',
    name: 'Jasprit Bumrah',
    country: 'India',
    role: 'Bowler',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm fast',
    image: 'https://images.unsplash.com/photo-1629813284000-dcbd9aeb24e4?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80',
    age: '30',
    birthPlace: 'Ahmedabad, Gujarat',
    teams: ['India', 'Mumbai Indians', 'Gujarat'],
    stats: {
      test: { matches: '34', wickets: '146', average: '20.69', economy: '2.74', bestBowling: '6/27', fiveWickets: '9' },
      odi: { matches: '89', wickets: '149', average: '23.55', economy: '4.59', bestBowling: '6/19', fiveWickets: '2' },
      t20i: { matches: '62', wickets: '74', average: '19.66', economy: '6.55', bestBowling: '3/11', fiveWickets: '0' },
    }
  },
];