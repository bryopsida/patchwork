import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ConfigModule } from '@nestjs/config'
import { HealthModule } from './health/health.module'
import { LoggerModule } from 'nestjs-pino'
import { AnalyzerModule } from './analyzer/analyzer.module';
import { PatcherModule } from './patcher/patcher.module';
@Module({
  imports: [ConfigModule.forRoot(), LoggerModule.forRoot(), HealthModule, AnalyzerModule, PatcherModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
