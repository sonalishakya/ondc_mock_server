import { NextFunction, Request, Response } from "express";
import fs from "fs";
import path from "path";
import YAML from "yaml";
import {
	quoteCreatorHealthCareService,
	responseBuilder,
	send_nack,
	redisExistFromServer,
	HEALTHCARE_SERVICES_EXAMPLES_PATH,
	redisFetchFromServer,
	updateFulfillments,
} from "../../../lib/utils";
import { ON_ACTION_KEY } from "../../../lib/utils/actionOnActionKeys";
import { ERROR_MESSAGES } from "../../../lib/utils/responseMessages";


export const initController = async (req: Request, res: Response, next: NextFunction) => {
	try{
		const { transaction_id } = req.body.context;
		const on_search = await redisFetchFromServer(ON_ACTION_KEY.ON_SEARCH, transaction_id);
		if (!on_search) {
			return send_nack(res, ERROR_MESSAGES.ON_SEARCH_DOES_NOT_EXISTED)
		}
		const providersItems = on_search?.message?.catalog?.providers[0]?.items;
		req.body.providersItems = providersItems

		const exit = await redisExistFromServer(ON_ACTION_KEY.ON_SELECT, transaction_id)
		if (!exit) {
			return send_nack(res, ERROR_MESSAGES.ON_SELECT_DOES_NOT_EXISTED)
		}
		return initConsultationController(req, res, next);
	}catch(error){
		return next(error)
	}
	
};

const initConsultationController = (req: Request, res: Response, next: NextFunction) => {
	try{
		const { context, providersItems, message: { order: { provider, items, billing, fulfillments, payments } } } = req.body;
		const { locations, ...remainingProvider } = provider	

		const updatedFulfillments = updateFulfillments(fulfillments, ON_ACTION_KEY?.ON_INIT);

		const file = fs.readFileSync(
			path.join(HEALTHCARE_SERVICES_EXAMPLES_PATH, "on_init/on_init.yaml")
		);
	
		const response = YAML.parse(file.toString());
		const quoteData = quoteCreatorHealthCareService(items, providersItems,"",	fulfillments[0]?.type)

		const responseMessage = {
			order: {
				provider: remainingProvider,
				locations,
				items,
				billing,
				fulfillments: updatedFulfillments,
				quote: quoteData,
				payments: [{
					id: response?.value?.message?.order?.payments[0]?.id,
					type: payments[0]?.type,
					collected_by: payments[0]?.collected_by,
					params: {
						amount: quoteData?.price?.value,
						currency: quoteData?.price?.currency,
						bank_account_number: response?.value?.message?.order?.payments[0]?.params?.bank_account_number,
						virtual_payment_address: response?.value?.message?.order?.payments[0]?.params?.virtual_payment_address
					},
					tags: response?.value?.message?.order?.payments[0]?.tags
				}],
			}
		}

		delete req.body?.providersItems
		return responseBuilder(
			res,
			next,
			context,
			responseMessage,
			`${req.body.context.bap_uri}${req.body.context.bap_uri.endsWith("/") ? ON_ACTION_KEY.ON_INIT: `/${ON_ACTION_KEY.ON_INIT}`
			}`,
			`${ON_ACTION_KEY.ON_INIT}`,
			"healthcare-service"
		);
	}catch(error){
		next(error)
	}
	
};

