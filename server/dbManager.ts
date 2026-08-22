import { getDbPool, sql } from './db';
import { SAMPLE_PROMPTS } from './sampleQuestions';

/**
 * Initialize all database tables and seed data if they do not already exist.
 */
export async function initializeDatabase(): Promise<{ success: boolean; message: string }> {
  try {
    const pool = await getDbPool();

    // 1. Users table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
      BEGIN
          CREATE TABLE Users (
              Id NVARCHAR(64) PRIMARY KEY,
              Username NVARCHAR(100) NOT NULL,
              AvatarColor NVARCHAR(20) NULL,
              AvatarIcon NVARCHAR(50) NULL,
              TotalGamesPlayed INT NOT NULL DEFAULT 0,
              TotalWins INT NOT NULL DEFAULT 0,
              TotalScore INT NOT NULL DEFAULT 0,
              CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
              LastActiveAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
          );
          CREATE INDEX IX_Users_Score ON Users(TotalScore DESC);
      END;
    `);

    // 2. QuestionBank table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'QuestionBank')
      BEGIN
          CREATE TABLE QuestionBank (
              Id INT IDENTITY(1,1) PRIMARY KEY,
              QuestionText NVARCHAR(500) NOT NULL,
              Category NVARCHAR(50) NOT NULL DEFAULT 'general',
              IsSystem BIT NOT NULL DEFAULT 1,
              IsApproved BIT NOT NULL DEFAULT 1,
              UsageCount INT NOT NULL DEFAULT 0,
              CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
          );
          CREATE INDEX IX_QuestionBank_Category ON QuestionBank(Category, IsApproved);
      END;
    `);

    // 3. GameRooms table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'GameRooms')
      BEGIN
          CREATE TABLE GameRooms (
              RoomCode NVARCHAR(10) PRIMARY KEY,
              HostPlayerId NVARCHAR(64) NULL,
              HostName NVARCHAR(100) NULL,
              Status NVARCHAR(30) NOT NULL DEFAULT 'LOBBY',
              TotalRounds INT NOT NULL DEFAULT 5,
              DefenseTimeSec INT NOT NULL DEFAULT 25,
              VotingTimeSec INT NOT NULL DEFAULT 25,
              GuessTimeSec INT NOT NULL DEFAULT 20,
              CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
              FinishedAt DATETIME2 NULL
          );
          CREATE INDEX IX_GameRooms_Status ON GameRooms(Status, CreatedAt DESC);
      END;
    `);

    // 4. RoomParticipants table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RoomParticipants')
      BEGIN
          CREATE TABLE RoomParticipants (
              Id BIGINT IDENTITY(1,1) PRIMARY KEY,
              RoomCode NVARCHAR(10) NOT NULL,
              PlayerId NVARCHAR(64) NOT NULL,
              PlayerName NVARCHAR(100) NOT NULL,
              AvatarColor NVARCHAR(20) NULL,
              AvatarIcon NVARCHAR(50) NULL,
              FinalScore INT NOT NULL DEFAULT 0,
              IsHost BIT NOT NULL DEFAULT 0,
              IsBot BIT NOT NULL DEFAULT 0,
              JoinedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
              CONSTRAINT FK_RoomParticipants_GameRooms FOREIGN KEY (RoomCode) 
                  REFERENCES GameRooms(RoomCode) ON DELETE CASCADE
          );
          CREATE INDEX IX_RoomParticipants_RoomCode ON RoomParticipants(RoomCode);
          CREATE INDEX IX_RoomParticipants_PlayerId ON RoomParticipants(PlayerId);
      END;
    `);

    // 5. GameRounds table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'GameRounds')
      BEGIN
          CREATE TABLE GameRounds (
              Id BIGINT IDENTITY(1,1) PRIMARY KEY,
              RoomCode NVARCHAR(10) NOT NULL,
              RoundNumber INT NOT NULL,
              QuestionText NVARCHAR(500) NOT NULL,
              AuthorPlayerId NVARCHAR(64) NULL,
              AuthorPlayerName NVARCHAR(100) NULL,
              MostVotedPlayerId NVARCHAR(64) NULL,
              MostVotedPlayerName NVARCHAR(100) NULL,
              IsTie BIT NOT NULL DEFAULT 0,
              CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
              CONSTRAINT FK_GameRounds_GameRooms FOREIGN KEY (RoomCode) 
                  REFERENCES GameRooms(RoomCode) ON DELETE CASCADE
          );
          CREATE INDEX IX_GameRounds_Room ON GameRounds(RoomCode, RoundNumber);
      END;
    `);

    // 6. RoundVotes table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RoundVotes')
      BEGIN
          CREATE TABLE RoundVotes (
              Id BIGINT IDENTITY(1,1) PRIMARY KEY,
              RoundId BIGINT NOT NULL,
              VoterPlayerId NVARCHAR(64) NOT NULL,
              VoterPlayerName NVARCHAR(100) NOT NULL,
              TargetPlayerId NVARCHAR(64) NOT NULL,
              TargetPlayerName NVARCHAR(100) NOT NULL,
              CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
              CONSTRAINT FK_RoundVotes_GameRounds FOREIGN KEY (RoundId) 
                  REFERENCES GameRounds(Id) ON DELETE CASCADE
          );
          CREATE INDEX IX_RoundVotes_RoundId ON RoundVotes(RoundId);
          CREATE INDEX IX_RoundVotes_Target ON RoundVotes(TargetPlayerId);
      END;
    `);

    // 7. RoundGuesses table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RoundGuesses')
      BEGIN
          CREATE TABLE RoundGuesses (
              Id BIGINT IDENTITY(1,1) PRIMARY KEY,
              RoundId BIGINT NOT NULL,
              GuesserPlayerId NVARCHAR(64) NOT NULL,
              GuesserPlayerName NVARCHAR(100) NOT NULL,
              SuspectedPlayerId NVARCHAR(64) NOT NULL,
              SuspectedPlayerName NVARCHAR(100) NOT NULL,
              IsCorrect BIT NOT NULL DEFAULT 0,
              CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
              CONSTRAINT FK_RoundGuesses_GameRounds FOREIGN KEY (RoundId) 
                  REFERENCES GameRounds(Id) ON DELETE CASCADE
          );
          CREATE INDEX IX_RoundGuesses_RoundId ON RoundGuesses(RoundId);
      END;
    `);

    // 8. QuestionReports table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'QuestionReports')
      BEGIN
          CREATE TABLE QuestionReports (
              Id BIGINT IDENTITY(1,1) PRIMARY KEY,
              RoomCode NVARCHAR(10) NOT NULL,
              QuestionText NVARCHAR(500) NOT NULL,
              ReportedByPlayerId NVARCHAR(64) NULL,
              AuthorPlayerId NVARCHAR(64) NULL,
              Reason NVARCHAR(255) NOT NULL DEFAULT 'Inappropriate / Offensive content',
              Status NVARCHAR(30) NOT NULL DEFAULT 'PENDING',
              CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
          );
          CREATE INDEX IX_QuestionReports_Status ON QuestionReports(Status, CreatedAt DESC);
      END;
    `);

    // Seed QuestionBank if empty
    const checkQuestions = await pool.request().query('SELECT COUNT(*) AS total FROM QuestionBank');
    if (checkQuestions.recordset[0]?.total === 0) {
      for (const prompt of SAMPLE_PROMPTS) {
        await pool
          .request()
          .input('text', sql.NVarChar(500), prompt)
          .input('category', sql.NVarChar(50), 'party')
          .query(`
            INSERT INTO QuestionBank (QuestionText, Category, IsSystem, IsApproved, UsageCount)
            VALUES (@text, @category, 1, 1, 0)
          `);
      }
      console.log(`[MSSQL] QuestionBank inicializado con ${SAMPLE_PROMPTS.length} preguntas predeterminadas.`);
    }

    console.log('[MSSQL] Todas las tablas y relaciones fueron creadas y verificadas exitosamente.');
    return {
      success: true,
      message: 'Tablas, relaciones y modelo de datos creados exitosamente en MSSQL.',
    };
  } catch (error: any) {
    console.error('[MSSQL] Error initializing database schema:', error);
    return {
      success: false,
      message: error?.message || 'Error al crear tablas en MSSQL',
    };
  }
}

/**
 * Persist or update a room in MSSQL.
 */
export async function saveGameRoom(
  roomCode: string,
  hostPlayerId: string,
  hostName: string,
  status: string,
  totalRounds: number,
  defenseTimeSec: number,
  votingTimeSec: number,
  guessTimeSec: number
) {
  try {
    const pool = await getDbPool();
    await pool
      .request()
      .input('code', sql.NVarChar(10), roomCode)
      .input('hostId', sql.NVarChar(64), hostPlayerId)
      .input('hostName', sql.NVarChar(100), hostName)
      .input('status', sql.NVarChar(30), status)
      .input('totalRounds', sql.Int, totalRounds)
      .input('defenseTime', sql.Int, defenseTimeSec)
      .input('votingTime', sql.Int, votingTimeSec)
      .input('guessTime', sql.Int, guessTimeSec).query(`
        IF EXISTS (SELECT 1 FROM GameRooms WHERE RoomCode = @code)
        BEGIN
            UPDATE GameRooms
            SET Status = @status,
                HostPlayerId = @hostId,
                HostName = @hostName,
                TotalRounds = @totalRounds,
                DefenseTimeSec = @defenseTime,
                VotingTimeSec = @votingTime,
                GuessTimeSec = @guessTime,
                FinishedAt = CASE WHEN @status = 'FINISHED' THEN GETUTCDATE() ELSE FinishedAt END
            WHERE RoomCode = @code;
        END
        ELSE
        BEGIN
            INSERT INTO GameRooms (RoomCode, HostPlayerId, HostName, Status, TotalRounds, DefenseTimeSec, VotingTimeSec, GuessTimeSec)
            VALUES (@code, @hostId, @hostName, @status, @totalRounds, @defenseTime, @votingTime, @guessTime);
        END
      `);
  } catch (err) {
    console.error(`[MSSQL] Failed to save game room ${roomCode}:`, err);
  }
}

/**
 * Record a report for a question in MSSQL.
 */
export async function saveQuestionReport(
  roomCode: string,
  questionText: string,
  reportedByPlayerId?: string,
  authorPlayerId?: string,
  reason: string = 'Contenido inapropiado / sensible'
) {
  try {
    const pool = await getDbPool();
    await pool
      .request()
      .input('roomCode', sql.NVarChar(10), roomCode)
      .input('text', sql.NVarChar(500), questionText)
      .input('reporter', sql.NVarChar(64), reportedByPlayerId || null)
      .input('author', sql.NVarChar(64), authorPlayerId || null)
      .input('reason', sql.NVarChar(255), reason).query(`
        INSERT INTO QuestionReports (RoomCode, QuestionText, ReportedByPlayerId, AuthorPlayerId, Reason, Status)
        VALUES (@roomCode, @text, @reporter, @author, @reason, 'PENDING');
      `);
    console.log(`[MSSQL] Question reported in room ${roomCode}`);
  } catch (err) {
    console.error('[MSSQL] Failed to log question report:', err);
  }
}

/**
 * Get the list of all created tables and their column metadata for inspection.
 */
export async function getDatabaseSchemaOverview() {
  const pool = await getDbPool();
  const result = await pool.request().query(`
    SELECT 
        t.name AS TableName,
        c.name AS ColumnName,
        ty.name AS DataType,
        c.max_length AS MaxLength,
        c.is_nullable AS IsNullable,
        ISNULL(i.is_primary_key, 0) AS IsPrimaryKey
    FROM sys.tables t
    INNER JOIN sys.columns c ON t.object_id = c.object_id
    INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
    LEFT JOIN sys.index_columns ic ON ic.object_id = t.object_id AND ic.column_id = c.column_id
    LEFT JOIN sys.indexes i ON i.object_id = t.object_id AND i.index_id = ic.index_id AND i.is_primary_key = 1
    ORDER BY t.name, c.column_id;
  `);

  const tables: Record<string, any[]> = {};
  for (const row of result.recordset) {
    if (!tables[row.TableName]) {
      tables[row.TableName] = [];
    }
    tables[row.TableName].push({
      column: row.ColumnName,
      type: row.DataType,
      nullable: row.IsNullable,
      primaryKey: Boolean(row.IsPrimaryKey),
    });
  }

  return tables;
}
