export type GamePhase =
  | 'LOBBY'
  | 'QUESTION_CREATION'
  | 'QUESTION_DISPLAY'
  | 'VOTING'
  | 'VOTE_RESULT'
  | 'DEFENSE'
  | 'AUTHOR_GUESS'
  | 'SUSPICION_REVEAL'
  | 'AUTHOR_REVEAL'
  | 'ROUND_RESULT'
  | 'GAME_RESULT';

export interface Player {
  id: string;
  name: string;
  avatarColor: string;
  avatarIcon: string;
  score: number;
  isHost: boolean;
  isBot?: boolean;
  connected: boolean;
  hasSubmittedQuestion?: boolean;
  hasVoted?: boolean;
  hasGuessedAuthor?: boolean;
}

export interface RoomSettings {
  totalRounds: number;
  defenseTimeSec: number;
  votingTimeSec: number;
  guessTimeSec: number;
  resultTimeSec?: number;
}

export interface ClientQuestion {
  id: string;
  text: string;
}

export interface VoteResultData {
  mostVotedPlayerId: string;
  mostVotedPlayerName: string;
  mostVotedPercentage: number;
  totalVotes: number;
  voteCounts: Record<string, number>; // playerId -> count
  isTie: boolean;
  tiedPlayerIds: string[];
  correctVoterIds: string[];
}

export interface SuspicionData {
  suspectCounts: Record<string, number>; // playerId -> count of people suspecting them
  totalGuesses: number;
}

export interface AuthorRevealData {
  authorId: string;
  authorName: string;
  correctGuesserIds: string[];
  guesserNames: string[];
}

export interface RoundScoreEntry {
  playerId: string;
  name: string;
  avatarColor: string;
  avatarIcon: string;
  score: number;
  roundPoints: number;
  breakdown: string[];
}

export interface GameAwards {
  mostVoted?: { name: string; count: number };
  bestDetective?: { name: string; count: number };
  sneakAuthor?: { name: string; count: number };
  gameWinner?: { name: string; score: number };
}

export interface ClientRoomState {
  code: string;
  phase: GamePhase;
  players: Player[];
  hostId: string;
  settings: RoomSettings;
  currentRound: number;
  totalRounds: number;
  timer: number;
  activeQuestion?: ClientQuestion;
  voteResult?: VoteResultData;
  suspicions?: SuspicionData;
  authorReveal?: AuthorRevealData;
  roundLeaderboard?: RoundScoreEntry[];
  gameAwards?: GameAwards;
  reportedQuestion?: boolean;
  rematchCount: number;
}

// Client to Server WebSocket messages
export type ClientMessage =
  | { type: 'CREATE_ROOM'; payload: { hostName: string; avatarColor?: string; avatarIcon?: string; isTVDisplay?: boolean } }
  | { type: 'JOIN_ROOM'; payload: { roomCode: string; playerName: string; avatarColor?: string; avatarIcon?: string; isTVDisplay?: boolean } }
  | { type: 'RECONNECT'; payload: { roomCode: string; playerId: string; isTVDisplay?: boolean } }
  | { type: 'UPDATE_SETTINGS'; payload: { settings: Partial<RoomSettings> } }
  | { type: 'ADD_BOTS'; payload: { count: number } }
  | { type: 'REMOVE_BOTS' }
  | { type: 'START_GAME' }
  | { type: 'SUBMIT_QUESTION'; payload: { text: string } }
  | { type: 'CAST_VOTE'; payload: { targetPlayerId: string } }
  | { type: 'GUESS_AUTHOR'; payload: { suspectedPlayerId: string } }
  | { type: 'REPORT_QUESTION' }
  | { type: 'NEXT_PHASE' }
  | { type: 'REQUEST_REMATCH' }
  | { type: 'LEAVE_ROOM' };

// Server to Client WebSocket messages
export type ServerMessage =
  | { type: 'JOINED'; payload: { playerId: string; roomCode: string; isHost: boolean; isTVDisplay: boolean; state: ClientRoomState } }
  | { type: 'STATE_UPDATE'; payload: { state: ClientRoomState } }
  | { type: 'TIMER_TICK'; payload: { timer: number } }
  | { type: 'ERROR'; payload: { message: string } };
