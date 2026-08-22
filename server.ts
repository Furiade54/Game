import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { GameRoom } from './server/gameRoom';
import { testDbConnection, getMssqlConfig } from './server/db';
import { initializeDatabase, getDatabaseSchemaOverview } from './server/dbManager';
import { ClientMessage, ServerMessage, Player } from './src/types';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// In-memory active game rooms
const rooms = new Map<string, GameRoom>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  if (rooms.has(code)) {
    return generateRoomCode();
  }
  return code;
}

// Health check API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', activeRooms: rooms.size });
});

// Database connection status API
app.get('/api/db/status', async (req, res) => {
  const isConfigured = Boolean(getMssqlConfig());
  if (!isConfigured) {
    res.json({
      configured: false,
      message: 'Variables de entorno de MSSQL no configuradas aún.',
    });
    return;
  }

  const result = await testDbConnection();
  res.json({
    configured: true,
    ...result,
  });
});

// Database schema initialization API
app.post('/api/db/init', async (req, res) => {
  const result = await initializeDatabase();
  res.json(result);
});

// Database schema overview API
app.get('/api/db/schema', async (req, res) => {
  try {
    const schema = await getDatabaseSchemaOverview();
    res.json({ success: true, schema });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// REST endpoint to get room status
app.get('/api/room/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const room = rooms.get(code);
  if (!room) {
    res.status(404).json({ error: 'Sala no encontrada' });
    return;
  }
  res.json(room.getClientState());
});

// WebSocket Server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket) => {
  let currentRoom: GameRoom | null = null;
  let currentPlayerId: string = '';
  let isTV = false;

  ws.on('message', (rawData: string) => {
    try {
      const msg: ClientMessage = JSON.parse(rawData.toString());

      if (msg.type === 'CREATE_ROOM') {
        const code = generateRoomCode();
        const room = new GameRoom(code);
        rooms.set(code, room);
        currentRoom = room;
        isTV = !!msg.payload.isTVDisplay;

        const playerId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        currentPlayerId = playerId;

        if (!isTV) {
          const hostPlayer: Player = {
            id: playerId,
            name: msg.payload.hostName || 'Anfitrión',
            avatarColor: msg.payload.avatarColor || '#f43f5e',
            avatarIcon: msg.payload.avatarIcon || 'crown',
            score: 0,
            isHost: true,
            connected: true
          };
          room.addPlayer(hostPlayer);
        }

        room.addClient(ws, playerId, isTV);

        const reply: ServerMessage = {
          type: 'JOINED',
          payload: {
            playerId,
            roomCode: code,
            isHost: !isTV,
            isTVDisplay: isTV,
            state: room.getClientState()
          }
        };
        ws.send(JSON.stringify(reply));
        return;
      }

      if (msg.type === 'JOIN_ROOM') {
        const code = msg.payload.roomCode.toUpperCase().trim();
        const room = rooms.get(code);
        if (!room) {
          ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'No se encontró la sala con código ' + code } }));
          return;
        }

        currentRoom = room;
        isTV = !!msg.payload.isTVDisplay;
        const playerId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        currentPlayerId = playerId;

        if (!isTV) {
          const isHost = room.players.size === 0;
          const newPlayer: Player = {
            id: playerId,
            name: msg.payload.playerName || `Jugador ${room.players.size + 1}`,
            avatarColor: msg.payload.avatarColor || '#3b82f6',
            avatarIcon: msg.payload.avatarIcon || 'smile',
            score: 0,
            isHost,
            connected: true
          };
          const added = room.addPlayer(newPlayer);
          if (!added) {
            ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'La sala está llena (máximo 12 jugadores)' } }));
            return;
          }
        }

        room.addClient(ws, playerId, isTV);

        const reply: ServerMessage = {
          type: 'JOINED',
          payload: {
            playerId,
            roomCode: code,
            isHost: room.hostId === playerId,
            isTVDisplay: isTV,
            state: room.getClientState()
          }
        };
        ws.send(JSON.stringify(reply));
        return;
      }

      if (msg.type === 'RECONNECT') {
        const code = msg.payload.roomCode.toUpperCase().trim();
        const room = rooms.get(code);
        if (!room) {
          ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Sala no disponible' } }));
          return;
        }

        currentRoom = room;
        currentPlayerId = msg.payload.playerId;
        isTV = !!msg.payload.isTVDisplay;

        room.addClient(ws, currentPlayerId, isTV);

        const reply: ServerMessage = {
          type: 'JOINED',
          payload: {
            playerId: currentPlayerId,
            roomCode: code,
            isHost: room.hostId === currentPlayerId,
            isTVDisplay: isTV,
            state: room.getClientState()
          }
        };
        ws.send(JSON.stringify(reply));
        return;
      }

      if (currentRoom) {
        currentRoom.handleMessage(ws, currentPlayerId, msg);
      }
    } catch (err) {
      console.error('Error handling WS message:', err);
    }
  });

  ws.on('close', () => {
    if (currentRoom) {
      currentRoom.removeClient(ws);
      // Clean up empty rooms after 15 minutes of inactivity
      if (currentRoom.players.size === 0 && currentRoom.clients.size === 0) {
        rooms.delete(currentRoom.code);
      }
    }
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server and WebSocket listening on http://localhost:${PORT}`);
    if (getMssqlConfig()) {
      try {
        console.log('[MSSQL] Auto-initializing database schema...');
        await initializeDatabase();
      } catch (err) {
        console.error('[MSSQL] Auto-initialization error:', err);
      }
    }
  });
}

startServer();
