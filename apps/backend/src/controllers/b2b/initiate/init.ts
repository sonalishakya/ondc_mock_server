import { Request, Response } from "express";
import {
  B2B_BAP_MOCKSERVER_URL,
  B2B_EXAMPLES_PATH,
  MOCKSERVER_ID,
  createAuthHeader,
  logger,
  redis,
} from "../../../lib/utils";
import axios from "axios";
import fs from "fs";
import path from "path";
import YAML from "yaml";
import { v4 as uuidv4 } from "uuid";


export const initiateInitController = async (req: Request, res: Response) => {
  const { scenario, transactionId } = req.body;

  const transactionKeys = await redis.keys(`${transactionId}-*`);
  const ifTransactionExist = transactionKeys.filter((e) => e.includes('on_select-to-server'))

  if (ifTransactionExist.length > 0) {
    return res.status(400).json({
      message: {
        ack: {
          status: "NACK",
        },
      },
      error: {
        message: "On Select doesn't exist",
      },
    });
  }
  const transaction = await redis.mget(ifTransactionExist)
  const parsedTransaction = transaction.map(((ele) => {
    return JSON.parse(ele as string)
  }))

  console.log('parsedTransaction:::: ', parsedTransaction[0])
  return intializeRequest(req, res, parsedTransaction[0], scenario)
};

const intializeRequest = async (req: Request, res: Response, transaction: any, scenario: string) => {
  const { context, message: { order: { provider, items, fulfillments } } } = transaction
  let { payments } = transaction.message.order
  const { transaction_id } = context.transaction_id

  const file = fs.readFileSync(
    path.join(B2B_EXAMPLES_PATH, "init/init_domestic.yaml")
  );
  const response = YAML.parse(file.toString());

  payments = payments.map((payment: any) => {
    if (scenario === 'prepaid-bpp-payment') {
      return {
        ...payment,
        type: 'PRE-FULFILLMENT',
        collected_by: 'BPP'
      }
    } else if (scenario === 'prepaid-bap-payment') {
      return {
        ...payment,
        type: 'PRE-FULFILLMENT',
        collected_by: 'BAP'
      }
    } else {
      return {
        ...payment,
        type: 'ON-FULFILLMENT',
        collected_by: 'BPP'
      }
    }

  })

  const init = {
    context: {
      ...context,
      timestamp: new Date().toISOString(),
      action: 'init',
      bap_id: MOCKSERVER_ID,
      bap_uri: B2B_BAP_MOCKSERVER_URL,
      // bpp_id: MOCKSERVER_ID,
      // bpp_uri,
    },
    order: {
      ...transaction.message.order,
      provider,
      items,
      payments,
      fulfillments: fulfillments.map((fulfillment: any) => ({
        ...response.value.message.order.fulfillments[0],
        id: fulfillment.id,
      })),
    }
  };

  const header = await createAuthHeader(init);
  try {
    await redis.set(
      `${transaction_id}-init-from-server`,
      JSON.stringify({ request: { ...init } })
    );
    await axios.post(`${context.bpp_uri}/init`, init, {
      headers: {
        "X-Gateway-Authorization": header,
        authorization: header,
      },
    });

    return res.json({
      message: {
        ack: {
          status: "ACK",
        },
      },
      transaction_id,
    });
  } catch (error) {
    logger.error({ type: "response", message: error });
    return res.json({
      message: {
        ack: {
          status: "NACK",
        },
      },
      error: {
        // message: (error as any).message,
        message: "Error Occurred while pinging NP at BPP URI",
      },
    });
  }


}