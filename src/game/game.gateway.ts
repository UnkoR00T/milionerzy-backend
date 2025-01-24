import {MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer} from '@nestjs/websockets';
import {Server, Socket} from 'socket.io';
import {PrismaService} from "../prisma/prisma.service";

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameGateway {
  constructor(private prisma: PrismaService) {}
  @WebSocketServer()
  server: Server;

  connactions: Socket[] = [];
  questions: {question: String, answerA: String, answerB: String, answerC: String, answerD: String, correctAnswer: number}[] = [
    {
      question: 'Z czego robi się Stal',
      answerA: 'Miedzi i Żelaza',
      answerB: 'Miedzi i Brązu',
      answerC: 'Żelaza i Węgla',
      answerD: 'Plastiku',
      correctAnswer: 3
    },
    {
      question: 'Z czego robi się frytki',
      answerA: 'Z stali',
      answerB: 'Z plastiku',
      answerC: 'Z ziemi',
      answerD: 'Z ziemniaków',
      correctAnswer: 4
    }
  ];
  selected: number = 0;
  curQuestion = 0;

  @SubscribeMessage('testConnection')
  handleTestConnection(client: Socket, data: string): void {
    this.connactions.map((cl) => {
      cl.emit('testConnection')
    })
  }

  @SubscribeMessage('connectConsumer')
  handleConnect(client: Socket, data: string): void {
    if (data === "PRZEGIBEK2025.202123"){
      this.connactions.push(client);
      client.emit("connectedConsumer", true);
    }else{
      client.emit("connectedConsumer", false);
    }
  }

  @SubscribeMessage('startGame')
  async handleStartGame(data: any, @MessageBody() gameId): Promise<void> {
    this.selected = 0;
    this.curQuestion = 0;
    const dbQuestion = await this.prisma.questions.findMany({where: {gameId: gameId}});
    this.questions = [];
    dbQuestion.forEach((q) => {
      this.questions.push({
        question: q.question,
        answerA: q.answerA,
        answerB: q.answerB,
        answerC: q.answerC,
        answerD: q.answerD,
        correctAnswer: q.correctAnswer
      })
    })
    this.connactions.map((cl) => {
      cl.emit('startGame', {
        questionId: this.curQuestion,
        question: this.questions[this.curQuestion]
      });
    })
  }

  @SubscribeMessage('answerQuestion')
  handleAnswerQuestion(data: any, @MessageBody() body: number): void {
    if (this.selected !== body) {
      this.selected = body;
      this.connactions.map((cl) => {
        cl.emit('answerQuestionSelect', body);
      })
    }else{
      this.connactions.map((cl) => {
        cl.emit('answerQuestionFinal', {
          selected: this.selected,
          correct: this.questions[this.curQuestion].correctAnswer
        })
        this.selected = 0;
      })
    }
  }

  @SubscribeMessage('changeScreen')
  handleChangeScreen(data: any): void {
    if (this.selected === 0){
      this.connactions.map((cl) =>{
        cl.emit('changeScreen', {
          questionId: this.curQuestion,
          question: this.questions[this.curQuestion]
        });
      })
    }
  }
  @SubscribeMessage('nextQuestion')
  handleNextQuestion(data: any): void {
    this.selected = 0;
    this.curQuestion++;
    this.connactions.map((cl) => {
      cl.emit('changeScreen', {
        questionId: this.curQuestion,
        question: this.questions[this.curQuestion]
      })
    })
  }

  @SubscribeMessage('getQuestions')
  async handleEndGame(data: any, @MessageBody() gameId: string):
      Promise<{id: number;gameId: string;question: string;answerA: string;answerB: string;answerC: string;answerD: string;correctAnswer: number; }[]> {
    // @ts-ignore
    return this.prisma.questions.findMany({where: {gameId: gameId}});
  }

  @SubscribeMessage('addQuestion')
  async handleAddQuestion(data: any,
                    @MessageBody() question: {gameId: string, question: string, answerA: string, answerB: string, answerC: string, answerD: string, correctAnswer: number})
      : Promise<void> {
    await this.prisma.questions.create({data: {
        gameId: question.gameId,
        question: question.question,
        answerA: question.answerA,
        answerB: question.answerB,
        answerC: question.answerC,
        answerD: question.answerD,
        correctAnswer: question.correctAnswer,
      }})
  }

  @SubscribeMessage('deleteQuestion')
  async handleDeleteQuestion(data: any, @MessageBody() target: { id: number, gameId: string }): Promise<void> {
    await this.prisma.questions.delete({where: {id: target.id, gameId: target.gameId}});
  }
}
