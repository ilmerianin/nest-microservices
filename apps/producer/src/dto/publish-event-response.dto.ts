import { ApiProperty } from '@nestjs/swagger';

export class PublishEventResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'UUID опубликованного события',
  })
  id: string;

  @ApiProperty({ example: 'published', enum: ['published'] })
  status: 'published';
}
