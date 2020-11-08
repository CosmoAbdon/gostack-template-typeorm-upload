import path from 'path';
import fs from 'fs';
import csvParse from 'csv-parse';
import uploadConfig from '../config/upload';
import Transaction from '../models/Transaction';
import CreateTransactionService from './CreateTransactionService';

interface CsvTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(csv: string): Promise<Transaction[] | null> {
    const createTransactionService = new CreateTransactionService();

    const filePath = path.join(uploadConfig.directory, csv);

    const csvExists = await fs.promises.stat(filePath);
    if (!csvExists) return null;

    const data = await this.loadCsv(filePath);

    const [firstData] = data.splice(0, 1);
    const firstTransaction = await createTransactionService.execute({
      title: firstData.title,
      value: firstData.value,
      type: firstData.type,
      category: firstData.category,
    });
    const lastestTransactions = await Promise.all(
      data.map(async d => {
        const { title, value, type, category } = d;
        const transaction = await createTransactionService.execute({
          title,
          value,
          type,
          category,
        });
        return transaction;
      }),
    );
    const transactions = [firstTransaction, ...lastestTransactions];
    fs.unlinkSync(filePath);
    return transactions;
  }

  private async loadCsv(filePath: string): Promise<CsvTransaction[]> {
    const readCSVStream = fs.createReadStream(filePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });
    const lines: CsvTransaction[] = [];
    const parseCSV = readCSVStream.pipe(parseStream);
    parseCSV.on('data', line => {
      const [title, type, value, category] = line;
      const transaction: CsvTransaction = {
        title,
        value: Number(value),
        type,
        category,
      };
      lines.push(transaction);
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    return lines;
  }
}

export default ImportTransactionsService;
