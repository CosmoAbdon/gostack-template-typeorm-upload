import {
  getCustomRepository,
  getRepository,
  TransactionRepository,
} from 'typeorm';
import AppError from '../errors/AppError';
import Category from '../models/Category';
// import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const categoriesRepository = await getRepository(Category);
    const transactionsRepository = await getCustomRepository(
      TransactionsRepository,
    );

    const { total } = await transactionsRepository.getBalance();

    if (type === 'outcome' && total < value)
      throw new AppError('Can not pay for that', 400);

    const categoryExists = await categoriesRepository.findOne({
      where: { title: category },
    });

    const createCategory = categoriesRepository.create({ title: category });

    const analyzeCategory =
      categoryExists || (await categoriesRepository.save(createCategory));

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: analyzeCategory.id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
