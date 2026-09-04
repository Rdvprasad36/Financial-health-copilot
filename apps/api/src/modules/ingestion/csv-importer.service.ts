import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CategorizerService } from './categorizer.service';
import { TransactionType } from '@fhc/shared';
import { parse } from 'csv-parse';
import * as crypto from 'crypto';

@Injectable()
export class CsvImporterService {
  private readonly logger = new Logger(CsvImporterService.name);

  constructor(
    private prisma: PrismaService,
    private categorizerService: CategorizerService,
  ) {}

  /**
   * Imports transactions from a CSV file
   */
  async importCsv(
    userId: string,
    sourceId: string,
    fileBuffer: Buffer,
    format: 'generic' = 'generic'
  ): Promise<{ imported: number; skipped: number; errors: string[] }> {
    return new Promise((resolve, reject) => {
      const records: any[] = [];
      const errors: string[] = [];
      let imported = 0;
      let skipped = 0;

      const parser = parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      parser.on('readable', () => {
        let record;
        while ((record = parser.read()) !== null) {
          records.push(record);
        }
      });

      parser.on('error', (err) => {
        this.logger.error(`CSV parsing error: ${err.message}`);
        reject(err);
      });

      parser.on('end', async () => {
        try {
          for (const row of records) {
            try {
              // Generic format: Date, Description, Debit, Credit, Balance
              const dateStr = row['Date'];
              const description = row['Description'] || '';
              const debitStr = row['Debit'] || '0';
              const creditStr = row['Credit'] || '0';

              if (!dateStr) {
                errors.push(`Missing Date in row: ${JSON.stringify(row)}`);
                continue;
              }

              const txnDate = new Date(dateStr);
              if (isNaN(txnDate.getTime())) {
                errors.push(`Invalid Date format: ${dateStr}`);
                continue;
              }

              const debit = parseFloat(debitStr.replace(/,/g, ''));
              const credit = parseFloat(creditStr.replace(/,/g, ''));

              let type: TransactionType;
              let amountRupees = 0;

              if (credit > 0) {
                type = 'income';
                amountRupees = credit;
              } else if (debit > 0) {
                type = 'expense';
                amountRupees = debit;
              } else {
                skipped++;
                continue; // Skip zero amount transactions
              }

              const amountPaise = BigInt(Math.round(amountRupees * 100));
              const category = this.categorizerService.categorize(description, '');
              
              // Deduplicate on a composite key of date + amount + description hash
              const hashInput = `${txnDate.toISOString()}-${amountPaise.toString()}-${description}`;
              const hash = crypto.createHash('sha256').update(hashInput).digest('hex');
              const providerTxnId = `csv-${hash}`;

              const existing = await this.prisma.transaction.findUnique({
                where: { sourceId_providerTxnId: { sourceId, providerTxnId } },
              });

              if (existing) {
                skipped++;
                continue;
              }

              await this.prisma.transaction.create({
                data: {
                  userId,
                  sourceId,
                  providerTxnId,
                  type,
                  amountPaise,
                  currency: 'INR',
                  category,
                  counterparty: description.substring(0, 50),
                  txnDate,
                  rawPayload: JSON.stringify(row),
                },
              });

              imported++;
            } catch (err: any) {
              errors.push(`Error processing row: ${err.message}`);
            }
          }

          resolve({ imported, skipped, errors });
        } catch (err) {
          reject(err);
        }
      });

      parser.write(fileBuffer);
      parser.end();
    });
  }
}
