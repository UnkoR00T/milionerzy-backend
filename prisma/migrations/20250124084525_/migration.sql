-- CreateTable
CREATE TABLE "questions" (
    "id" SERIAL NOT NULL,
    "gameId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answerA" TEXT NOT NULL,
    "answerB" TEXT NOT NULL,
    "answerC" TEXT NOT NULL,
    "answerD" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);
