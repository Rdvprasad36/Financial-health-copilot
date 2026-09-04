import { Controller, Post, Body, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CsvImporterService } from './csv-importer.service';

@Controller('sync')
export class IngestionController {
  constructor(
    private readonly csvImporterService: CsvImporterService,
  ) {}

  @Post('csv')
  @UseInterceptors(FileInterceptor('file'))
  async syncCsv(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { userId: string; sourceId: string }
  ) {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }
    if (!body.userId || !body.sourceId) {
      throw new BadRequestException('userId and sourceId are required');
    }
    
    return this.csvImporterService.importCsv(body.userId, body.sourceId, file.buffer, 'generic');
  }
}
