import { WebSocket } from 'ws';
import {
  GamePhase,
  Player,
  RoomSettings,
  ClientQuestion,
  VoteResultData,
  SuspicionData,
  AuthorRevealData,
  RoundScoreEntry,
  GameAwards,
  ClientRoomState,
  ClientMessage,
  ServerMessage
} from '../src/types';
import { SAMPLE_PROMPTS, BOT_NAMES } from './sampleQuestions';
import { saveGameRoom, saveQuestionReport } from './dbManager';

interface ServerQuestion {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  used: boolean;
  reported: boolean;
}

interface SocketClient {
  ws: WebSocket;
  playerId: string;
  isTVDisplay: boolean;
}

export class GameRoom {
  public code: string;
  public phase: GamePhase = 'LOBBY';
  public players: Map<string, Player> = new Map();
  public hostId: string = '';
  public clients: Set<SocketClient> = new Set();
  
  public settings: RoomSettings = {
    totalRounds: 5,
    defenseTimeSec: 15,
    votingTimeSec: 20,
    guessTimeSec: 15,
    resultTimeSec: 8
  };

  public currentRound: number = 0;
  public totalRounds: number = 5;
  public timer: number = 0;
  private timerInterval: NodeJS.Timeout | null = null;
  private autoAdvanceTimeout: NodeJS.Timeout | null = null;

  // Server question pool with strict authorId masking
  private questionPool: ServerQuestion[] = [];
  private currentQuestion: ServerQuestion | null = null;

  // Round specific states
  private roundVotes: Map<string, string> = new Map(); // voterId -> targetPlayerId
  private roundAuthorGuesses: Map<string, string> = new Map(); // guesserId -> suspectedPlayerId
  
  private currentVoteResult?: VoteResultData;
  private currentSuspicions?: SuspicionData;
  private currentAuthorReveal?: AuthorRevealData;
  private roundLeaderboard?: RoundScoreEntry[];
  private gameAwards?: GameAwards;

  // Stats across the whole game
  private timesVotedProtagonist: Map<string, number> = new Map();
  private correctAuthorGuessesCount: Map<string, number> = new Map();
  private undiscoveredAuthorCount: Map<string, number> = new Map();
  public rematchCount: number = 0;

  constructor(code: string) {
    this.code = code;
  }

  public addClient(ws: WebSocket, playerId: string, isTVDisplay: boolean = false) {
    // Remove previous socket if reconnected
    for (const c of this.clients) {
      if (c.playerId === playerId && !isTVDisplay) {
        this.clients.delete(c);
      }
    }
    this.clients.add({ ws, playerId, isTVDisplay });

    const player = this.players.get(playerId);
    if (player) {
      player.connected = true;
    }
  }

  public removeClient(ws: WebSocket) {
    let disconnectedPlayerId: string | null = null;
    for (const client of this.clients) {
      if (client.ws === ws) {
        disconnectedPlayerId = client.playerId;
        this.clients.delete(client);
        break;
      }
    }

    if (disconnectedPlayerId) {
      // Check if there are other connections for this player
      const hasOther = Array.from(this.clients).some(c => c.playerId === disconnectedPlayerId);
      if (!hasOther) {
        const player = this.players.get(disconnectedPlayerId);
        if (player) {
          player.connected = false;
        }
      }
    }
    this.broadcastState();
  }

  public addPlayer(player: Player): boolean {
    if (this.players.size >= 12 && !this.players.has(player.id)) {
      return false;
    }
    if (this.players.size === 0) {
      player.isHost = true;
      this.hostId = player.id;
    }
    this.players.set(player.id, player);
    this.broadcastState();
    return true;
  }

  public addBots(count: number) {
    let availableBots = BOT_NAMES.filter(b => !Array.from(this.players.values()).some(p => p.name === b.name));
    if (availableBots.length === 0) availableBots = BOT_NAMES;
    
    for (let i = 0; i < count; i++) {
      if (this.players.size >= 12) break;
      const botDef = availableBots[i % availableBots.length];
      const botId = `bot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const botPlayer: Player = {
        id: botId,
        name: botDef.name,
        avatarColor: botDef.avatarColor,
        avatarIcon: botDef.avatarIcon,
        score: 0,
        isHost: false,
        isBot: true,
        connected: true
      };
      this.players.set(botId, botPlayer);
    }
    this.broadcastState();
  }

  public removeBots() {
    for (const [id, p] of this.players.entries()) {
      if (p.isBot) {
        this.players.delete(id);
      }
    }
    this.broadcastState();
  }

  public updateSettings(newSettings: Partial<RoomSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.totalRounds = this.settings.totalRounds;
    this.broadcastState();
  }

  public startGame() {
    if (this.players.size < 4) {
      // Auto fill with bots up to 4 if host starts with fewer
      this.addBots(4 - this.players.size);
    }

    // Reset scores & stats
    this.currentRound = 0;
    this.totalRounds = Math.min(this.settings.totalRounds, 15);
    this.timesVotedProtagonist.clear();
    this.correctAuthorGuessesCount.clear();
    this.undiscoveredAuthorCount.clear();
    this.questionPool = [];

    for (const p of this.players.values()) {
      p.score = 0;
      p.hasSubmittedQuestion = false;
      p.hasVoted = false;
      p.hasGuessedAuthor = false;
    }

    // Move to QUESTION_CREATION
    this.transitionToPhase('QUESTION_CREATION');

    // Persist room state to MSSQL
    const hostPlayer = this.players.get(this.hostId);
    saveGameRoom(
      this.code,
      this.hostId,
      hostPlayer?.name || 'Anfitrión',
      'IN_GAME',
      this.totalRounds,
      this.settings.defenseTimeSec,
      this.settings.votingTimeSec,
      this.settings.guessTimeSec
    ).catch(() => {});
  }

  public submitQuestion(playerId: string, text: string) {
    const player = this.players.get(playerId);
    if (!player || this.phase !== 'QUESTION_CREATION') return;

    const trimmed = text.trim();
    if (trimmed.length < 3) return;

    // Check if player already submitted
    const existingIdx = this.questionPool.findIndex(q => q.authorId === playerId);
    const qItem: ServerQuestion = {
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      text: trimmed,
      authorId: playerId,
      authorName: player.name,
      used: false,
      reported: false
    };

    if (existingIdx >= 0) {
      this.questionPool[existingIdx] = qItem;
    } else {
      this.questionPool.push(qItem);
    }

    player.hasSubmittedQuestion = true;

    // Auto submit bot questions
    this.submitBotQuestions();

    this.broadcastState();

    // If all real players submitted, advance quickly
    const allRealSubmitted = Array.from(this.players.values())
      .filter(p => !p.isBot && p.connected)
      .every(p => p.hasSubmittedQuestion);

    if (allRealSubmitted && this.players.size >= 4) {
      this.clearTimers();
      this.startNextRound();
    }
  }

  private submitBotQuestions() {
    for (const p of this.players.values()) {
      if (p.isBot && !p.hasSubmittedQuestion) {
        const promptIndex = Math.floor(Math.random() * SAMPLE_PROMPTS.length);
        const randomPrompt = SAMPLE_PROMPTS[promptIndex];
        this.questionPool.push({
          id: `q_bot_${p.id}_${Date.now()}`,
          text: randomPrompt,
          authorId: p.id,
          authorName: p.name,
          used: false,
          reported: false
        });
        p.hasSubmittedQuestion = true;
      }
    }
  }

  public startNextRound() {
    this.clearTimers();

    // Ensure bot questions exist if needed
    this.submitBotQuestions();

    // Filter available questions (not used and not reported)
    let available = this.questionPool.filter(q => !q.used && !q.reported);

    if (available.length === 0) {
      // If no questions remain, inject sample questions to finish configured rounds
      const extraPrompt = SAMPLE_PROMPTS[Math.floor(Math.random() * SAMPLE_PROMPTS.length)];
      const randomPlayer = Array.from(this.players.values())[Math.floor(Math.random() * this.players.size)];
      const fallbackQ: ServerQuestion = {
        id: `q_fallback_${Date.now()}`,
        text: extraPrompt,
        authorId: randomPlayer ? randomPlayer.id : 'anon',
        authorName: randomPlayer ? randomPlayer.name : 'Anónimo',
        used: false,
        reported: false
      };
      this.questionPool.push(fallbackQ);
      available = [fallbackQ];
    }

    // Pick random question from available
    const chosenIndex = Math.floor(Math.random() * available.length);
    this.currentQuestion = available[chosenIndex];
    this.currentQuestion.used = true;

    this.currentRound++;
    this.roundVotes.clear();
    this.roundAuthorGuesses.clear();
    this.currentVoteResult = undefined;
    this.currentSuspicions = undefined;
    this.currentAuthorReveal = undefined;

    // Reset player round flags
    for (const p of this.players.values()) {
      p.hasVoted = false;
      p.hasGuessedAuthor = false;
    }

    this.transitionToPhase('QUESTION_DISPLAY');
  }

  public castVote(voterId: string, targetPlayerId: string) {
    if (this.phase !== 'VOTING') return;
    const voter = this.players.get(voterId);
    const target = this.players.get(targetPlayerId);
    if (!voter || !target) return;

    this.roundVotes.set(voterId, targetPlayerId);
    voter.hasVoted = true;

    this.broadcastState();

    // Check if all connected real players voted
    const activeRealPlayers = Array.from(this.players.values()).filter(p => !p.isBot && p.connected);
    const allRealVoted = activeRealPlayers.every(p => this.roundVotes.has(p.id));

    if (allRealVoted) {
      this.processVotesAndAdvance();
    }
  }

  public guessAuthor(guesserId: string, suspectedPlayerId: string) {
    if (this.phase !== 'AUTHOR_GUESS') return;
    const guesser = this.players.get(guesserId);
    const suspect = this.players.get(suspectedPlayerId);
    if (!guesser || !suspect) return;

    this.roundAuthorGuesses.set(guesserId, suspectedPlayerId);
    guesser.hasGuessedAuthor = true;

    this.broadcastState();

    const activeRealPlayers = Array.from(this.players.values()).filter(p => !p.isBot && p.connected);
    const allRealGuessed = activeRealPlayers.every(p => this.roundAuthorGuesses.has(p.id));

    if (allRealGuessed) {
      this.processAuthorGuessesAndAdvance();
    }
  }

  public reportCurrentQuestion() {
    if (!this.currentQuestion) return;
    this.currentQuestion.reported = true;
    this.currentQuestion.used = true;

    // Log to MSSQL for moderation
    saveQuestionReport(this.code, this.currentQuestion.text, undefined, this.currentQuestion.authorId).catch(() => {});
    
    // Clear and jump to next question immediately
    this.clearTimers();
    if (this.currentRound >= this.totalRounds) {
      this.finishGame();
    } else {
      this.startNextRound();
    }
  }

  private simulateBotVotes() {
    const allPlayerList = Array.from(this.players.values());
    if (allPlayerList.length === 0) return;

    for (const p of allPlayerList) {
      if (p.isBot && !this.roundVotes.has(p.id)) {
        // Bots pick a random player
        const target = allPlayerList[Math.floor(Math.random() * allPlayerList.length)];
        this.roundVotes.set(p.id, target.id);
        p.hasVoted = true;
      }
    }
  }

  private simulateBotGuesses() {
    const allPlayerList = Array.from(this.players.values());
    if (allPlayerList.length === 0) return;

    for (const p of allPlayerList) {
      if (p.isBot && !this.roundAuthorGuesses.has(p.id)) {
        // Bots pick a random suspect
        const suspect = allPlayerList[Math.floor(Math.random() * allPlayerList.length)];
        this.roundAuthorGuesses.set(p.id, suspect.id);
        p.hasGuessedAuthor = true;
      }
    }
  }

  private processVotesAndAdvance() {
    this.clearTimers();
    this.simulateBotVotes();

    // Tally votes
    const counts: Record<string, number> = {};
    for (const p of this.players.values()) {
      counts[p.id] = 0;
    }

    for (const targetId of this.roundVotes.values()) {
      counts[targetId] = (counts[targetId] || 0) + 1;
    }

    let maxVotes = -1;
    let mostVotedIds: string[] = [];

    for (const [pId, count] of Object.entries(counts)) {
      if (count > maxVotes) {
        maxVotes = count;
        mostVotedIds = [pId];
      } else if (count === maxVotes && maxVotes > 0) {
        mostVotedIds.push(pId);
      }
    }

    // Handle tie breaker if necessary
    let selectedProtagonistId = mostVotedIds[0] || Array.from(this.players.keys())[0];
    if (mostVotedIds.length > 1) {
      selectedProtagonistId = mostVotedIds[Math.floor(Math.random() * mostVotedIds.length)];
    }

    const protagonist = this.players.get(selectedProtagonistId);
    const totalVotes = this.roundVotes.size || 1;
    const percentage = Math.round(((counts[selectedProtagonistId] || 0) / totalVotes) * 100);

    // Track protagonist stats
    if (protagonist) {
      this.timesVotedProtagonist.set(
        selectedProtagonistId,
        (this.timesVotedProtagonist.get(selectedProtagonistId) || 0) + 1
      );
    }

    // Award +50 points to players who voted for the most voted protagonist
    const correctVoterIds: string[] = [];
    for (const [voterId, targetId] of this.roundVotes.entries()) {
      if (targetId === selectedProtagonistId) {
        correctVoterIds.push(voterId);
        const voter = this.players.get(voterId);
        if (voter) {
          voter.score += 50;
        }
      }
    }

    this.currentVoteResult = {
      mostVotedPlayerId: selectedProtagonistId,
      mostVotedPlayerName: protagonist ? protagonist.name : 'Alguien',
      mostVotedPercentage: percentage,
      totalVotes,
      voteCounts: counts,
      isTie: mostVotedIds.length > 1,
      tiedPlayerIds: mostVotedIds,
      correctVoterIds
    };

    this.transitionToPhase('VOTE_RESULT');
  }

  private processAuthorGuessesAndAdvance() {
    this.clearTimers();
    this.simulateBotGuesses();

    // Tally suspicions
    const suspectCounts: Record<string, number> = {};
    for (const p of this.players.values()) {
      suspectCounts[p.id] = 0;
    }

    for (const suspectId of this.roundAuthorGuesses.values()) {
      suspectCounts[suspectId] = (suspectCounts[suspectId] || 0) + 1;
    }

    this.currentSuspicions = {
      suspectCounts,
      totalGuesses: this.roundAuthorGuesses.size
    };

    // First show suspicions reveal
    this.transitionToPhase('SUSPICION_REVEAL');
  }

  private revealAuthorAndScore() {
    if (!this.currentQuestion) return;

    const actualAuthorId = this.currentQuestion.authorId;
    const actualAuthor = this.players.get(actualAuthorId);
    const authorName = actualAuthor ? actualAuthor.name : this.currentQuestion.authorName;

    // Check who guessed correctly
    const correctGuesserIds: string[] = [];
    const guesserNames: string[] = [];

    for (const [guesserId, suspectedId] of this.roundAuthorGuesses.entries()) {
      if (suspectedId === actualAuthorId) {
        correctGuesserIds.push(guesserId);
        const guesser = this.players.get(guesserId);
        if (guesser) {
          guesser.score += 50;
          guesserNames.push(guesser.name);
          this.correctAuthorGuessesCount.set(
            guesserId,
            (this.correctAuthorGuessesCount.get(guesserId) || 0) + 1
          );
        }
      }
    }

    if (correctGuesserIds.length === 0 && actualAuthor) {
      this.undiscoveredAuthorCount.set(
        actualAuthorId,
        (this.undiscoveredAuthorCount.get(actualAuthorId) || 0) + 1
      );
    }

    this.currentAuthorReveal = {
      authorId: actualAuthorId,
      authorName,
      correctGuesserIds,
      guesserNames
    };

    // Calculate leaderboard breakdown
    this.roundLeaderboard = Array.from(this.players.values())
      .map(p => {
        const votedCorrectly = this.currentVoteResult?.correctVoterIds.includes(p.id);
        const guessedAuthor = correctGuesserIds.includes(p.id);
        const breakdown: string[] = [];
        let pts = 0;
        if (votedCorrectly) {
          pts += 50;
          breakdown.push('+50 Acertó más votado');
        }
        if (guessedAuthor) {
          pts += 50;
          breakdown.push('+50 Descubrió al autor');
        }
        return {
          playerId: p.id,
          name: p.name,
          avatarColor: p.avatarColor,
          avatarIcon: p.avatarIcon,
          score: p.score,
          roundPoints: pts,
          breakdown
        };
      })
      .sort((a, b) => b.score - a.score);

    this.transitionToPhase('AUTHOR_REVEAL');
  }

  private finishGame() {
    this.clearTimers();

    // Compute Awards
    let maxProtagonistCount = 0;
    let mostVotedPlayer: { name: string; count: number } | undefined;
    for (const [pId, count] of this.timesVotedProtagonist.entries()) {
      if (count > maxProtagonistCount) {
        maxProtagonistCount = count;
        const p = this.players.get(pId);
        if (p) mostVotedPlayer = { name: p.name, count };
      }
    }

    let maxDetectiveCount = 0;
    let bestDetective: { name: string; count: number } | undefined;
    for (const [pId, count] of this.correctAuthorGuessesCount.entries()) {
      if (count > maxDetectiveCount) {
        maxDetectiveCount = count;
        const p = this.players.get(pId);
        if (p) bestDetective = { name: p.name, count };
      }
    }

    let maxSneakyCount = 0;
    let sneakAuthor: { name: string; count: number } | undefined;
    for (const [pId, count] of this.undiscoveredAuthorCount.entries()) {
      if (count > maxSneakyCount) {
        maxSneakyCount = count;
        const p = this.players.get(pId);
        if (p) sneakAuthor = { name: p.name, count };
      }
    }

    const sortedPlayers = Array.from(this.players.values()).sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];

    this.gameAwards = {
      mostVoted: mostVotedPlayer,
      bestDetective,
      sneakAuthor,
      gameWinner: winner ? { name: winner.name, score: winner.score } : undefined
    };

    this.transitionToPhase('GAME_RESULT');

    const hostPlayer = this.players.get(this.hostId);
    saveGameRoom(
      this.code,
      this.hostId,
      hostPlayer?.name || 'Anfitrión',
      'FINISHED',
      this.totalRounds,
      this.settings.defenseTimeSec,
      this.settings.votingTimeSec,
      this.settings.guessTimeSec
    ).catch(() => {});
  }

  public requestRematch() {
    this.rematchCount++;
    this.startGame();
  }

  public nextPhaseManual() {
    // Allows host or timer to proceed
    switch (this.phase) {
      case 'QUESTION_CREATION':
        this.startNextRound();
        break;
      case 'QUESTION_DISPLAY':
        this.transitionToPhase('VOTING');
        break;
      case 'VOTING':
        this.processVotesAndAdvance();
        break;
      case 'VOTE_RESULT':
        this.transitionToPhase('DEFENSE');
        break;
      case 'DEFENSE':
        this.transitionToPhase('AUTHOR_GUESS');
        break;
      case 'AUTHOR_GUESS':
        this.processAuthorGuessesAndAdvance();
        break;
      case 'SUSPICION_REVEAL':
        this.revealAuthorAndScore();
        break;
      case 'AUTHOR_REVEAL':
        this.transitionToPhase('ROUND_RESULT');
        break;
      case 'ROUND_RESULT':
        if (this.currentRound >= this.totalRounds) {
          this.finishGame();
        } else {
          this.startNextRound();
        }
        break;
      case 'GAME_RESULT':
        this.requestRematch();
        break;
    }
  }

  private transitionToPhase(newPhase: GamePhase) {
    this.clearTimers();
    this.phase = newPhase;

    switch (newPhase) {
      case 'QUESTION_CREATION':
        this.timer = 40;
        this.startCountdownTimer(() => {
          this.startNextRound();
        });
        break;

      case 'QUESTION_DISPLAY':
        this.timer = 4;
        this.startCountdownTimer(() => {
          this.transitionToPhase('VOTING');
        });
        break;

      case 'VOTING':
        this.timer = this.settings.votingTimeSec;
        this.startCountdownTimer(() => {
          this.processVotesAndAdvance();
        });
        break;

      case 'VOTE_RESULT':
        this.timer = Math.max(4, Math.min(this.settings.resultTimeSec || 7, 15));
        this.startCountdownTimer(() => {
          this.transitionToPhase('DEFENSE');
        });
        break;

      case 'DEFENSE':
        this.timer = this.settings.defenseTimeSec || 15;
        this.startCountdownTimer(() => {
          this.transitionToPhase('AUTHOR_GUESS');
        });
        break;

      case 'AUTHOR_GUESS':
        this.timer = this.settings.guessTimeSec || 15;
        this.startCountdownTimer(() => {
          this.processAuthorGuessesAndAdvance();
        });
        break;

      case 'SUSPICION_REVEAL':
        this.timer = Math.max(4, Math.min(this.settings.resultTimeSec || 7, 15));
        this.startCountdownTimer(() => {
          this.revealAuthorAndScore();
        });
        break;

      case 'AUTHOR_REVEAL':
        this.timer = Math.max(5, Math.min((this.settings.resultTimeSec || 7) + 2, 20));
        this.startCountdownTimer(() => {
          this.transitionToPhase('ROUND_RESULT');
        });
        break;

      case 'ROUND_RESULT':
        this.timer = Math.max(5, Math.min((this.settings.resultTimeSec || 7) + 2, 20));
        this.startCountdownTimer(() => {
          if (this.currentRound >= this.totalRounds) {
            this.finishGame();
          } else {
            this.startNextRound();
          }
        });
        break;

      case 'GAME_RESULT':
        this.timer = 0;
        break;

      case 'LOBBY':
        this.timer = 0;
        break;
    }

    this.broadcastState();
  }

  private startCountdownTimer(onComplete: () => void) {
    this.clearTimers();
    this.timerInterval = setInterval(() => {
      this.timer--;
      this.broadcastTimer();
      if (this.timer <= 0) {
        this.clearTimers();
        onComplete();
      }
    }, 1000);
  }

  private clearTimers() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.autoAdvanceTimeout) {
      clearTimeout(this.autoAdvanceTimeout);
      this.autoAdvanceTimeout = null;
    }
  }

  // Strictly masks authorId from active question to guarantee technical anonymity
  public getClientState(): ClientRoomState {
    let clientQuestion: ClientQuestion | undefined;
    if (this.currentQuestion && !this.currentQuestion.reported) {
      clientQuestion = {
        id: this.currentQuestion.id,
        text: this.currentQuestion.text
      };
    }

    return {
      code: this.code,
      phase: this.phase,
      players: Array.from(this.players.values()),
      hostId: this.hostId,
      settings: this.settings,
      currentRound: this.currentRound,
      totalRounds: this.totalRounds,
      timer: this.timer,
      activeQuestion: clientQuestion,
      voteResult: this.currentVoteResult,
      suspicions: this.currentSuspicions,
      authorReveal: this.currentAuthorReveal,
      roundLeaderboard: this.roundLeaderboard,
      gameAwards: this.gameAwards,
      reportedQuestion: this.currentQuestion?.reported || false,
      rematchCount: this.rematchCount
    };
  }

  public broadcastState() {
    const state = this.getClientState();
    const message: ServerMessage = {
      type: 'STATE_UPDATE',
      payload: { state }
    };
    const json = JSON.stringify(message);

    for (const client of this.clients) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(json);
      }
    }
  }

  private broadcastTimer() {
    const message: ServerMessage = {
      type: 'TIMER_TICK',
      payload: { timer: this.timer }
    };
    const json = JSON.stringify(message);

    for (const client of this.clients) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(json);
      }
    }
  }

  public handleMessage(ws: WebSocket, senderPlayerId: string, message: ClientMessage) {
    switch (message.type) {
      case 'UPDATE_SETTINGS': {
        const p = this.players.get(senderPlayerId);
        if (p?.isHost) {
          this.updateSettings(message.payload.settings);
        }
        break;
      }
      case 'ADD_BOTS': {
        const p = this.players.get(senderPlayerId);
        if (p?.isHost) {
          this.addBots(message.payload.count);
        }
        break;
      }
      case 'REMOVE_BOTS': {
        const p = this.players.get(senderPlayerId);
        if (p?.isHost) {
          this.removeBots();
        }
        break;
      }
      case 'START_GAME': {
        const p = this.players.get(senderPlayerId);
        if (p?.isHost && this.phase === 'LOBBY') {
          this.startGame();
        }
        break;
      }
      case 'SUBMIT_QUESTION': {
        this.submitQuestion(senderPlayerId, message.payload.text);
        break;
      }
      case 'CAST_VOTE': {
        this.castVote(senderPlayerId, message.payload.targetPlayerId);
        break;
      }
      case 'GUESS_AUTHOR': {
        this.guessAuthor(senderPlayerId, message.payload.suspectedPlayerId);
        break;
      }
      case 'REPORT_QUESTION': {
        this.reportCurrentQuestion();
        break;
      }
      case 'NEXT_PHASE': {
        const p = this.players.get(senderPlayerId);
        if (p?.isHost) {
          this.nextPhaseManual();
        }
        break;
      }
      case 'REQUEST_REMATCH': {
        this.requestRematch();
        break;
      }
      case 'LEAVE_ROOM': {
        this.removeClient(ws);
        this.players.delete(senderPlayerId);
        if (this.hostId === senderPlayerId) {
          const nextHost = Array.from(this.players.values()).find(pl => !pl.isBot);
          if (nextHost) {
            nextHost.isHost = true;
            this.hostId = nextHost.id;
          }
        }
        this.broadcastState();
        break;
      }
    }
  }
}
