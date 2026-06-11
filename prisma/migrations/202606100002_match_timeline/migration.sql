-- CreateEnum
CREATE TYPE "MatchEventType" AS ENUM ('GOAL', 'RED_CARD', 'YELLOW_CARD', 'ASSIST', 'SUBSTITUTION', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "FantasyPointSourceType" AS ENUM ('GOAL', 'TEAM_WIN', 'RED_CARD');

-- CreateTable
CREATE TABLE "MatchEvent" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "externalProvider" TEXT NOT NULL,
    "minute" INTEGER,
    "eventType" "MatchEventType" NOT NULL DEFAULT 'UNKNOWN',
    "playerId" TEXT,
    "playerName" TEXT,
    "teamId" TEXT,
    "teamName" TEXT,
    "rawPayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FantasyPointLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fantasyTeamId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "sourceType" "FantasyPointSourceType" NOT NULL,
    "sourceEventId" TEXT,
    "sourceKey" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FantasyPointLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MatchEvent_externalProvider_externalId_key" ON "MatchEvent"("externalProvider", "externalId");

-- CreateIndex
CREATE INDEX "MatchEvent_matchId_eventType_idx" ON "MatchEvent"("matchId", "eventType");

-- CreateIndex
CREATE INDEX "MatchEvent_playerId_idx" ON "MatchEvent"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "FantasyPointLog_sourceKey_key" ON "FantasyPointLog"("sourceKey");

-- CreateIndex
CREATE INDEX "FantasyPointLog_userId_matchId_idx" ON "FantasyPointLog"("userId", "matchId");

-- CreateIndex
CREATE INDEX "FantasyPointLog_fantasyTeamId_playerId_idx" ON "FantasyPointLog"("fantasyTeamId", "playerId");

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FantasyPointLog" ADD CONSTRAINT "FantasyPointLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FantasyPointLog" ADD CONSTRAINT "FantasyPointLog_fantasyTeamId_fkey" FOREIGN KEY ("fantasyTeamId") REFERENCES "FantasyTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FantasyPointLog" ADD CONSTRAINT "FantasyPointLog_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FantasyPointLog" ADD CONSTRAINT "FantasyPointLog_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
