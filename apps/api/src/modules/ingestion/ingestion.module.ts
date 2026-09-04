import { Module } from '@nestjs/common';
import { CategorizerService } from './categorizer.service';
import { CsvImporterService } from './csv-importer.service';
import { IngestionController } from './ingestion.controller';

@Module({
  controllers: [IngestionController],
  providers: [
    CategorizerService,
    CsvImporterService,
  ],
  exports: [
    CsvImporterService,
  ],
})
export class IngestionModule {}
