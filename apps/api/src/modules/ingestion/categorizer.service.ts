import { Injectable } from '@nestjs/common';
import { CATEGORY_PATTERNS } from '@fhc/shared';

@Injectable()
export class CategorizerService {
  private cache = new Map<string, string>();

  /**
   * Categorizes a transaction based on description and counterparty
   * @param description The transaction description
   * @param counterparty The counterparty name/email
   * @returns The matched category or 'other'
   */
  categorize(description: string, counterparty: string): string {
    const key = `${description}:${counterparty}`.toLowerCase();
    
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const searchString = `${description} ${counterparty}`;
    
    for (const { category, pattern } of CATEGORY_PATTERNS) {
      if (pattern.test(searchString)) {
        this.cache.set(key, category);
        return category;
      }
    }

    this.cache.set(key, 'other');
    return 'other';
  }
}
