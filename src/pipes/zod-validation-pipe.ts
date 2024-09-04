import { BadRequestException, PipeTransform } from '@nestjs/common'
import { ZodError, ZodSchema } from 'zod'
import { fromZodError } from 'zod-validation-error'

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema<any>) {}

  transform(value: unknown) {
    try {
      return this.schema.parse(value)
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException({
          message: 'Validation failed.',
          statusCode: 400,
          errors: fromZodError(err),
        })
      }

      throw new BadRequestException('Validation failed.')
    }
    return value
  }
}
