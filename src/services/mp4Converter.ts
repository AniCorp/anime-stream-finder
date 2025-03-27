import axios, { AxiosResponse } from 'axios';
import FormData from 'form-data';
import { Readable } from 'stream';

export interface ConversionResult {
  uuid: string;
  files: Array<{ download_url: string, filename: string }>;
  finished: boolean;
  errors: string[];
}

export interface ConversionProgress {
  processed: number;
  total: number;
  estimatedSecondsRemaining: number;
}

export class Mp4ConverterService {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly pollInterval: number;
  private readonly maxRetries: number;

  constructor() {
    this.apiUrl = process.env.MP4_TO_API_URL || 'https://www.mp4.to/apis/v1/convert';
    this.apiKey = process.env.MP4_TO_API_KEY || '';
    this.pollInterval = parseInt(process.env.MP4_TO_POLL_INTERVAL || '5000');
    this.maxRetries = parseInt(process.env.MP4_TO_MAX_RETRIES || '3');
  }

  public async convertAll(sourceUrls: string[], progressCallback?: (progress: ConversionProgress) => void): Promise<ConversionResult> {
    const form = new FormData();
    
    // Add source URLs to form data
    for (const url of sourceUrls) {
      const response = await axios.get(url, { responseType: 'stream' });
      form.append('files', response.data, {
        filename: url.split('/').pop()
      });
    }

    form.append('lang', 'en');
    form.append('convert_to', 'mp4-wav');

    const { uuid } = await this.executeConversion(form);
    return this.pollConversion(uuid, progressCallback);
  }

  private async executeConversion(form: FormData): Promise<{ uuid: string }> {
    let attempt = 0;
    
    while (attempt < this.maxRetries) {
      try {
        const response = await axios.post(this.apiUrl, form, {
          headers: {
            ...form.getHeaders(),
            Authorization: this.apiKey
          }
        });
        
        return response.data;
      } catch (error) {
        if (++attempt >= this.maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    throw new Error('Max conversion retries exceeded');
  }

  private async pollConversion(uuid: string, progressCallback?: (progress: ConversionProgress) => void): Promise<ConversionResult> {
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          const response = await axios.get(`${this.apiUrl}/results`, {
            params: { uuid },
            headers: { Authorization: this.apiKey }
          });

          const result: ConversionResult = response.data;
          
          if (progressCallback) {
            progressCallback({
              processed: result.files.length,
              total: result.files.length + result.errors.length,
              estimatedSecondsRemaining: result.finished ? 0 : 
                Math.ceil((result.files.length * this.pollInterval) / 1000)
            });
          }

          if (result.finished) {
            clearInterval(interval);
            resolve(result);
          }
        } catch (error) {
          clearInterval(interval);
          reject(error);
        }
      }, this.pollInterval);
    });
  }
}
