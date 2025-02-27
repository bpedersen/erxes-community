import customScalars from '@erxes/api-utils/src/customScalars';

import Collateral from './collateral';
import LoanContract from './contract';
import ContractType from './contractType';
import InsuranceType from './insuranceType';
import LoanInvoice from './invoice';
import LoanSchedule from './schedule';
import LoanTransaction from './transaction';
import Mutation from './mutations';
import Query from './queries';

const resolvers: any = async () => ({
  ...customScalars,

  Collateral,
  LoanContract,
  ContractType,
  InsuranceType,
  LoanInvoice,
  LoanSchedule,
  LoanTransaction,
  Mutation,
  Query
});

export default resolvers;
