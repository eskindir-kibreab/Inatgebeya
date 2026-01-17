import axios from './axios';

export const transactionsAPI = {
    getMyTransactions: () => axios.get('/transactions/my')
};
