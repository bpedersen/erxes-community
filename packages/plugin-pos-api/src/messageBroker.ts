import { afterMutationHandlers } from './afterMutations';
import {
  confirmLoyalties,
  getBranchesUtil,
  statusToDone,
  syncOrderFromClient
} from './utils';
import { generateModels } from './connectionResolver';
import { IPosDocument } from './models/definitions/pos';
import { ISendMessageArgs, sendMessage } from '@erxes/api-utils/src/core';
import { serviceDiscovery } from './configs';

let client;

export const initBroker = async cl => {
  client = cl;

  const { consumeQueue, consumeRPCQueue } = client;

  consumeQueue('pos:afterMutation', async ({ subdomain, data }) => {
    await afterMutationHandlers(subdomain, data);
    return;
  });

  consumeQueue('pos:createOrUpdateOrders', async ({ subdomain, data }) => {
    const models = await generateModels(subdomain);

    const { action, posToken, responses, order, items, oldBranchId } = data;
    const pos = await models.Pos.findOne({ token: posToken }).lean();

    // ====== if (action === 'statusToDone')
    // if (doneOrder.type === 'delivery' && doneOrder.status === 'done') { }
    if (action === 'statusToDone') {
      return await statusToDone({ subdomain, models, order, pos });
    }

    // ====== if (action === 'makePayment')
    await syncOrderFromClient({
      subdomain,
      models,
      order,
      items,
      pos,
      posToken,
      responses,
      oldBranchId
    });

    return {
      status: 'success'
    };
  });

  consumeRPCQueue(
    'pos:getModuleRelation',
    async ({ data: { module, target } }) => {
      // need to check pos-order or pos

      let filter;

      if (module.includes('contacts')) {
        if (target.customerId) {
          filter = { _id: target.customerId };
        }
      }

      return {
        status: 'success',
        data: filter
      };
    }
  );

  consumeRPCQueue('pos:findSlots', async ({ subdomain, data }) => {
    const models = await generateModels(subdomain);

    return {
      status: 'success',
      data: await models.PosSlots.find({ posId: data.posId }).lean()
    };
  });

  consumeRPCQueue(
    'pos:orders.updateOne',
    async ({ subdomain, data: { selector, modifier } }) => {
      const models = await generateModels(subdomain);

      return {
        status: 'success',
        data: await models.PosOrders.updateOne(selector, modifier)
      };
    }
  );

  consumeRPCQueue('pos:ecommerceGetBranches', async ({ subdomain, data }) => {
    const { posToken } = data;

    const models = await generateModels(subdomain);
    return {
      status: 'success',
      data: await getBranchesUtil(subdomain, models, posToken)
    };
  });

  consumeRPCQueue('pos:ordersDeliveryInfo', async ({ subdomain, data }) => {
    const { orderId } = data;
    const models = await generateModels(subdomain);

    const order = await models.PosOrders.findOne({ _id: orderId }).lean();

    // on kitchen
    if (!order.deliveryInfo) {
      return {
        status: 'success',
        data: {
          error: 'Deleted delivery information.'
        }
      };
    }

    if (!order.deliveryInfo.dealId) {
      return {
        status: 'success',
        data: {
          _id: order._id,
          status: 'onKitchen',
          date: order.paidDate
        }
      };
    }

    const dealId = order.deliveryInfo.dealId;
    const deal = await sendCardsMessage({
      subdomain,
      action: 'deals.findOne',
      data: { _id: dealId },
      isRPC: true
    });

    if (!deal) {
      return {
        status: 'success',
        data: {
          error: 'Deleted delivery information.'
        }
      };
    }

    const stage = await sendCardsMessage({
      subdomain,
      action: 'stages.findOne',
      data: { _id: deal.stageId },
      isRPC: true
    });

    return {
      status: 'success',
      data: {
        _id: order._id,
        status: stage.name,
        date: deal.stageChangedDate || deal.modifiedDate || deal.createdAt
      }
    };
  });

  consumeRPCQueue('pos:orders.find', async ({ subdomain, data }) => {
    const models = await generateModels(subdomain);
    return {
      status: 'success',
      data: await models.PosOrders.find(data).lean()
    };
  });

  consumeRPCQueue('pos:orders.findOne', async ({ subdomain, data }) => {
    const models = await generateModels(subdomain);
    return {
      status: 'success',
      data: await models.PosOrders.findOne(data).lean()
    };
  });

  consumeRPCQueue('pos:configs.find', async ({ subdomain, data }) => {
    const models = await generateModels(subdomain);
    return {
      status: 'success',
      data: await models.Pos.find(data).lean()
    };
  });

  consumeRPCQueue('pos:configs.findOne', async ({ subdomain, data }) => {
    const models = await generateModels(subdomain);
    return {
      status: 'success',
      data: await models.Pos.findOne(data).lean()
    };
  });

  consumeRPCQueue('pos:covers.confirm', async ({ subdomain, data }) => {
    const models = await generateModels(subdomain);
    const { cover } = data;
    await models.Covers.updateOne(
      { _id: cover._id },
      { ...cover },
      { upsert: true }
    );
    return {
      status: 'success',
      data: await models.Covers.findOne({ _id: cover._id })
    };
  });
};

export const sendProductsMessage = async (
  args: ISendMessageArgs
): Promise<any> => {
  return sendMessage({
    client,
    serviceDiscovery,
    serviceName: 'products',
    ...args
  });
};

export const sendCardsMessage = async (
  args: ISendMessageArgs
): Promise<any> => {
  return sendMessage({
    client,
    serviceDiscovery,
    serviceName: 'cards',
    ...args
  });
};

export const sendLoyaltiesMessage = async (
  args: ISendMessageArgs
): Promise<any> => {
  return sendMessage({
    client,
    serviceDiscovery,
    serviceName: 'loyalties',
    ...args
  });
};

export const sendPricingMessage = async (
  args: ISendMessageArgs
): Promise<any> => {
  return sendMessage({
    client,
    serviceDiscovery,
    serviceName: 'pricing',
    ...args
  });
};

export const sendContactsMessage = async (
  args: ISendMessageArgs
): Promise<any> => {
  return sendMessage({
    client,
    serviceDiscovery,
    serviceName: 'contacts',
    ...args
  });
};

export const sendEbarimtMessage = async (
  args: ISendMessageArgs
): Promise<any> => {
  return sendMessage({
    client,
    serviceDiscovery,
    serviceName: 'ebarimt',
    ...args
  });
};

export const sendCoreMessage = async (args: ISendMessageArgs): Promise<any> => {
  return sendMessage({
    client,
    serviceDiscovery,
    serviceName: 'core',
    ...args
  });
};

export const sendInventoriesMessage = async (
  args: ISendMessageArgs
): Promise<any> => {
  return sendMessage({
    client,
    serviceDiscovery,
    serviceName: 'inventories',
    ...args
  });
};

export const sendSyncerkhetMessage = async (
  args: ISendMessageArgs
): Promise<any> => {
  return sendMessage({
    client,
    serviceDiscovery,
    serviceName: 'syncerkhet',
    ...args
  });
};

export const sendPosclientMessage = async (
  args: ISendMessageArgs & {
    pos: IPosDocument;
  }
) => {
  const { action, pos } = args;
  let lastAction = action;
  let serviceName = 'posclient';

  const { ALL_AUTO_INIT } = process.env;

  if (
    ![true, 'true', 'True', '1'].includes(ALL_AUTO_INIT || '') &&
    !pos.onServer
  ) {
    lastAction = `posclient:${action}_${pos.token}`;
    serviceName = '';
    args.data.thirdService = true;
  }

  args.data.token = pos.token;

  return await sendMessage({
    client,
    serviceDiscovery,
    serviceName,
    ...args,
    action: lastAction
  });
};

export const sendAutomationsMessage = async (
  args: ISendMessageArgs
): Promise<any> => {
  return sendMessage({
    client,
    serviceDiscovery,
    serviceName: 'automations',
    ...args
  });
};

export const sendCommonMessage = async (
  args: ISendMessageArgs & { serviceName: string }
): Promise<any> => {
  return sendMessage({
    serviceDiscovery,
    client,
    ...args
  });
};

export default function() {
  return client;
}
