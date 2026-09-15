import { Global, Module } from '@nestjs/common';

import { EnginePrismaService } from './prisma.service';

@Global()
@Module({
  providers: [EnginePrismaService],
  exports: [EnginePrismaService],
})
export class EnginePrismaModule {}
