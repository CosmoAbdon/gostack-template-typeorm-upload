import { Router } from 'express';
import { getRepository, getCustomRepository } from 'typeorm';
import multer from 'multer';
import uploadConfig from '../config/upload';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
// import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

const transactionsRouter = Router();
const upload = multer(uploadConfig);

transactionsRouter.get('/', async (request, response) => {
  const transactionsRepository = await getCustomRepository(
    TransactionsRepository,
  );

  const transactions = await transactionsRepository.find();
  const balance = await transactionsRepository.getBalance();

  return response.json({ transactions, balance });
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category } = request.body;

  const createTransaction = new CreateTransactionService();

  const transaction = await createTransaction.execute({
    title,
    value,
    type,
    category,
  });

  return response.json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;

  const transactionsRepository = await getRepository(Transaction);
  const transaction = await transactionsRepository.findOne(id);

  if (!transaction) throw new AppError('Transaction does not exists!', 400);

  await transactionsRepository.delete(transaction.id);

  return response.json(true);
});

transactionsRouter.post(
  '/import',
  upload.single('file'),
  async (request, response) => {
    const importTransaction = new ImportTransactionsService();

    const transactions = await importTransaction.execute(request.file.filename);

    return response.json(transactions);

    response.json(true);
  },
);

export default transactionsRouter;
