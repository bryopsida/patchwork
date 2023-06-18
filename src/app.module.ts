import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ConfigModule } from '@nestjs/config'
import { HealthModule } from './health/health.module'
import { LoggerModule } from 'nestjs-pino'
import { AnalyzerModule } from './analyzer/analyzer.module'
import { PatcherModule } from './patcher/patcher.module'
import { BullModule } from '@nestjs/bull'
import { ConnOptionsService } from './common/conn-options.service'
import { ScheduleModule } from '@nestjs/schedule'

const connOptionsService = new ConnOptionsService()

@Module({
  imports: [
    ConfigModule.forRoot(),
    LoggerModule.forRoot(),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      redis: connOptionsService.getRedisOptions().options,
    }),
    HealthModule,
    AnalyzerModule,
    PatcherModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
