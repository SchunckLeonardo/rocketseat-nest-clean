import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common'
import { CurrentUser } from 'src/auth/current-user-decorator'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import { UserPayload } from 'src/auth/jwt.strategy'
import { ZodValidationPipe } from 'src/pipes/zod-validation-pipe'
import { PrismaService } from 'src/prisma/prisma.service'
import { z } from 'zod'

const createQuestionBodySchema = z.object({
  title: z.string(),
  content: z.string(),
})

type CreateQuestionBodySchema = z.infer<typeof createQuestionBodySchema>

@Controller('/questions')
@UseGuards(JwtAuthGuard)
export class CreateQuestionController {
  constructor(private prisma: PrismaService) {}

  @Post()
  @HttpCode(201)
  async handle(
    @CurrentUser() user: UserPayload,
    @Body(new ZodValidationPipe(createQuestionBodySchema))
    body: CreateQuestionBodySchema,
  ) {
    const { sub } = user
    const { title, content } = body

    const slug = this.slugify(title)

    await this.prisma.question.create({
      data: {
        author_id: sub,
        title,
        content,
        slug,
      },
    })
  }

  private slugify(str: string): string {
    return str
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }
}
