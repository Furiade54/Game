-- MSSQL Database Schema for "¿Quién es más probable?" Party Game

-- 1. Users / Player Profiles
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

-- 2. Question Bank (Global catalog of predefined questions)
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

-- 3. Game Rooms (Sessions)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'GameRooms')
BEGIN
    CREATE TABLE GameRooms (
        RoomCode NVARCHAR(10) PRIMARY KEY,
        HostPlayerId NVARCHAR(64) NULL,
        HostName NVARCHAR(100) NULL,
        Status NVARCHAR(30) NOT NULL DEFAULT 'LOBBY', -- 'LOBBY', 'IN_GAME', 'FINISHED', 'ABANDONED'
        TotalRounds INT NOT NULL DEFAULT 5,
        DefenseTimeSec INT NOT NULL DEFAULT 25,
        VotingTimeSec INT NOT NULL DEFAULT 25,
        GuessTimeSec INT NOT NULL DEFAULT 20,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FinishedAt DATETIME2 NULL
    );
    CREATE INDEX IX_GameRooms_Status ON GameRooms(Status, CreatedAt DESC);
END;

-- 4. Room Participants (Players in a match)
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

-- 5. Game Rounds
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

-- 6. Round Votes
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

-- 7. Round Guesses (Detective author guesses)
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

-- 8. Question Reports (Safety / Moderation)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'QuestionReports')
BEGIN
    CREATE TABLE QuestionReports (
        Id BIGINT IDENTITY(1,1) PRIMARY KEY,
        RoomCode NVARCHAR(10) NOT NULL,
        QuestionText NVARCHAR(500) NOT NULL,
        ReportedByPlayerId NVARCHAR(64) NULL,
        AuthorPlayerId NVARCHAR(64) NULL,
        Reason NVARCHAR(255) NOT NULL DEFAULT 'Inappropriate / Offensive content',
        Status NVARCHAR(30) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'RESOLVED', 'DISMISSED'
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
    CREATE INDEX IX_QuestionReports_Status ON QuestionReports(Status, CreatedAt DESC);
END;
