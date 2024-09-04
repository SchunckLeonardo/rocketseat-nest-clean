import { INestApplication } from '@nestjs/common'
import { AppModule } from 'src/app.module'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { PrismaService } from 'src/prisma/prisma.service'
import { hash } from 'bcryptjs'
import { JwtService } from '@nestjs/jwt'

describe('Fetch Recent Questions (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  test('[POST] /questions', async () => {
    const user = await prisma.user.create({
      data: {
        name: 'John Doe',
        email: 'johndoe@example.com',
        password: await hash('123456', 8),
      },
    })

    const accessToken = jwt.sign({ sub: user.id })

    for (let i = 1; i <= 22; i++) {
      await prisma.question.create({
        data: {
          title: `New question ${i}`,
          slug: `new-question-${i}`,
          content: 'Question content',
          author_id: user.id,
        },
      })
    }

    const response = await request(app.getHttpServer())
      .get('/questions')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      questions: [expect.objectContaining({ title: 'New questions 1' })],
    })

    const responseQueryParams = await request(app.getHttpServer())
      .get('/questions?page=2')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(responseQueryParams.body.questions).toHaveLength(2)
  })
})
