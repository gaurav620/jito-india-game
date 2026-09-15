/**
 * UsersModule — player profile and password management.
 * Guards imported from AuthModule (PlayerJwtGuard, UserStatusGuard).
 */
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
