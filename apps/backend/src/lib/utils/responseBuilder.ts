import axios from "axios";
import { NextFunction, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import {
	AGRI_SERVICES_BPP_MOCKSERVER_URL,
	B2B_BPP_MOCKSERVER_URL,
	HEALTHCARE_SERVICES_BPP_MOCKSERVER_URL,
	MOCKSERVER_ID,
	SERVICES_BPP_MOCKSERVER_URL,
} from "./constants";
import { createAuthHeader } from "./responseAuth";
import { logger } from "./logger";
import { TransactionType, redis } from "./redis";
import { AxiosError } from "axios";
import { redisFetchFromServer } from "./redisFetch";
import { send_nack } from "./send_response";

interface TagDescriptor {
	code: string;
}

interface TagList {
	descriptor: TagDescriptor;
	value: string;
}

interface Quantity {
	selected: {
		count: number;
	};
}

interface AddOn {
	id: string;
}

interface Tag {
	descriptor: TagDescriptor;
	list: TagList[];
}

interface Item {
	price: any;
	title: any;
	fulfillment_ids: string[];
	id: string;
	quantity: Quantity;
	add_ons: AddOn[];
	tags: Tag[];
}

export const responseBuilder = async (
	res: Response,
	next: NextFunction,
	reqContext: object,
	message: object,
	uri: string,
	action: string,
	domain: "b2b" | "services" | "agri-services" | "healthcare-service",
	error?: object | undefined
) => {
	res.locals = {};
	let ts = new Date();
	ts.setSeconds(ts.getSeconds() + 1);
	const sandboxMode = res.getHeader("mode") === "sandbox";

	var async: { message: object; context?: object; error?: object } = {
		context: {},
		message,
	};

	const bppURI =
		domain === "b2b"
			? B2B_BPP_MOCKSERVER_URL
			: domain === "agri-services"
			? AGRI_SERVICES_BPP_MOCKSERVER_URL
			: domain === "healthcare-service"
			? HEALTHCARE_SERVICES_BPP_MOCKSERVER_URL
			: SERVICES_BPP_MOCKSERVER_URL;

	if (action.startsWith("on_")) {
		async = {
			...async,
			context: {
				...reqContext,
				bpp_id: MOCKSERVER_ID,
				bpp_uri: bppURI,
				timestamp: ts.toISOString(),
				action,
			},
		};
	} else {
		// const { bpp_uri, bpp_id, ...remainingContext } = reqContext as any;
		async = {
			...async,
			context: {
				// ...remainingContext,
				...reqContext,
				bap_id: MOCKSERVER_ID,
				bap_uri: bppURI,
				timestamp: ts.toISOString(),
				message_id: uuidv4(),
				action,
			},
		};
	}

	if (error) {
		async = { ...async, error };
	}

	const header = await createAuthHeader(async);

	if (sandboxMode) {
		if (action.startsWith("on_")) {
			var log: TransactionType = {
				request: async,
			};
			if (action === "on_status") {
				const transactionKeys = await redis.keys(
					`${(async.context! as any).transaction_id}-*`
				);
				const logIndex = transactionKeys.filter((e) =>
					e.includes("on_status-to-server")
				).length;

				await redis.set(
					`${
						(async.context! as any).transaction_id
					}-${logIndex}-${action}-from-server`,
					JSON.stringify(log)
				);
			} else {
				await redis.set(
					`${(async.context! as any).transaction_id}-${action}-from-server`,
					JSON.stringify(log)
				);
			}
			try {
				const response = await axios.post(uri, async, {
					headers: {
						authorization: header,
					},
				});

				log.response = {
					timestamp: new Date().toISOString(),
					response: response.data,
				};

				await redis.set(
					`${(async.context! as any).transaction_id}-${action}-from-server`,
					JSON.stringify(log)
				);
			} catch (error) {
				const response =
					error instanceof AxiosError
						? error?.response?.data
						: {
								message: {
									ack: {
										status: "NACK",
									},
								},
								error: {
									message: error,
								},
						  };
				log.response = {
					timestamp: new Date().toISOString(),
					response: response,
				};
				await redis.set(
					`${(async.context! as any).transaction_id}-${action}-from-server`,
					JSON.stringify(log)
				);

				return next(error);
			}
		}

		logger.info({
			type: "response",
			action: action,
			transaction_id: (reqContext as any).transaction_id,
			message: { sync: { message: { ack: { status: "ACK" } } } },
		});
		return res.json({
			message: {
				ack: {
					status: "ACK",
				},
			},
		});
	} else {
		if (action.startsWith("on_")) {
			var log: TransactionType = {
				request: async,
			};
			if (action === "on_status") {
				const transactionKeys = await redis.keys(
					`${(async.context! as any).transaction_id}-*`
				);
				const logIndex = transactionKeys.filter((e) =>
					e.includes("on_status-to-server")
				).length;
				await redis.set(
					`${
						(async.context! as any).transaction_id
					}-${logIndex}-${action}-from-server`,
					JSON.stringify(log)
				);
			} else {
				await redis.set(
					`${(async.context! as any).transaction_id}-${action}-from-server`,
					JSON.stringify(log)
				);
			}
			try {
				const response = await axios.post(uri, async, {
					headers: {
						authorization: header,
					},
				});

				log.response = {
					timestamp: new Date().toISOString(),
					response: response.data,
				};
				await redis.set(
					`${(async.context! as any).transaction_id}-${action}-from-server`,
					JSON.stringify(log)
				);
			} catch (error) {
				const response =
					error instanceof AxiosError
						? error?.response?.data
						: {
								message: {
									ack: {
										status: "NACK",
									},
								},
								error: {
									message: error,
								},
						  };
				log.response = {
					timestamp: new Date().toISOString(),
					response: response,
				};
				await redis.set(
					`${(async.context! as any).transaction_id}-${action}-from-server`,
					JSON.stringify(log)
				);
				return next(error);
			}
		}

		logger.info({
			type: "response",
			action: action,
			transaction_id: (reqContext as any).transaction_id,
			message: { sync: { message: { ack: { status: "ACK" } } } },
		});
		return res.json({
			message: {
				ack: {
					status: "ACK",
				},
			},
		});
	}
};

export const sendStatusAxiosCall = async (
	reqContext: object,
	message: object,
	uri: string,
	action: string,
	domain: "b2b" | "services" | "agri-services" | "healthcare-service",
	error?: object | undefined
) => {
	let ts = new Date();
	ts.setSeconds(ts.getSeconds() + 1);

	let async: { message: object; context?: object; error?: object } = {
		context: {},
		message,
	};

	const bppURI =
		domain === "b2b"
			? B2B_BPP_MOCKSERVER_URL
			: domain === "agri-services"
			? AGRI_SERVICES_BPP_MOCKSERVER_URL
			: domain === "healthcare-service"
			? HEALTHCARE_SERVICES_BPP_MOCKSERVER_URL
			: SERVICES_BPP_MOCKSERVER_URL;

	async = {
		...async,
		context: {
			...reqContext,
			bpp_id: MOCKSERVER_ID,
			bpp_uri: bppURI,
			timestamp: ts.toISOString(),
			action,
		},
	};

	if (error) {
		async = { ...async, error };
	}

	const header = await createAuthHeader(async);

	if (action.startsWith("on_")) {
		var log: TransactionType = {
			request: async,
		};
		try {
			const response = await axios.post(uri, async, {
				headers: {
					authorization: header,
				},
			});
			log.response = {
				timestamp: new Date().toISOString(),
				response: response.data,
			};
			await redis.set(
				`${(async.context! as any).transaction_id}-${action}-from-server`,
				JSON.stringify(log)
			);
		} catch (error) {
			const response =
				error instanceof AxiosError
					? error?.response?.data
					: {
							message: {
								ack: {
									status: "NACK",
								},
							},
							error: {
								message: error,
							},
					  };
			log.response = {
				timestamp: new Date().toISOString(),
				response: response,
			};

			await redis.set(
				`${(async.context! as any).transaction_id}-${action}-from-server`,
				JSON.stringify(log)
			);
		}
	}

	logger.info({
		type: "response",
		action: action,
		transaction_id: (reqContext as any).transaction_id,
		message: { sync: { message: { ack: { status: "ACK" } } } },
	});
};

export const quoteCreator = (items: Item[]) => {
	var breakup: any[] = [];
	const chargesOnFulfillment = [
		{
			"@ondc/org/item_id": "F1",
			title: "Delivery charges",
			"@ondc/org/title_type": "delivery",
			price: {
				currency: "INR",
				value: "4000",
			},
		},
		{
			"@ondc/org/item_id": "F1",
			title: "Packing charges",
			"@ondc/org/title_type": "packing",
			price: {
				currency: "INR",
				value: "500",
			},
		},
		{
			"@ondc/org/item_id": "F1",
			title: "Convenience Fee",
			"@ondc/org/title_type": "misc",
			price: {
				currency: "INR",
				value: "100",
			},
		},
	];
	const chargesOnItem = [
		{
			"@ondc/org/item_id": "I1",
			title: "Tax",
			"@ondc/org/title_type": "tax",
			price: {
				currency: "INR",
				value: "0",
			},
		},
		{
			"@ondc/org/item_id": "I1",
			title: "Discount",
			"@ondc/org/title_type": "discount",
			price: {
				currency: "INR",
				value: "-1000",
			},
		},
	];
	items.forEach((item: any) => {
		breakup = [
			...breakup,
			...chargesOnItem,
			{
				"@ondc/org/item_id": item.id,
				"@ondc/org/item_quantity": {
					count: item.quantity.selected.count,
				},
				title: "Product Name Here",
				"@ondc/org/title_type": "item",
				price: {
					currency: "INR",
					value: (item.quantity.selected.count * 250).toString(),
				},
				item: {
					price: {
						currency: "INR",
						value: "250",
					},
				},
			},
		];
		item.fulfillment_ids.forEach((eachId: string) => {
			breakup = [
				...breakup,
				...chargesOnFulfillment.map((each) => ({
					...each,
					"@ondc/org/item_id": eachId,
				})),
			];
		});
	});
	return {
		breakup,
		price: {
			currency: "INR",
			value: (53_600 * items.length).toString(),
		},
		ttl: "P1D",
	};
};

export const quoteCreatorAgriService = (
	items: Item[],
	providersItems?: any
) => {
	//get price from on_search
	items.forEach((item) => {
		// Find the corresponding item in the second array
		if (providersItems) {
			const matchingItem = providersItems.find(
				(secondItem: { id: string }) => secondItem.id === item.id
			);
			// If a matching item is found, update the price in the items array
			if (matchingItem) {
				item.title = matchingItem.descriptor.name;
				item.price = matchingItem.price;
				item.tags = matchingItem.tags;
			}
		}
	});

	let breakup: any[] = [];

	items.forEach((item) => {
		breakup.push({
			title: item.title,
			price: {
				currency: "INR",
				value: (
					Number(item.price.value) * item.quantity.selected.count
				).toString(),
			},
			tags: item.tags,
			item:
				item.title === "tax"
					? {
							id: item.id,
					  }
					: {
							id: item.id,
							price: item.price,
							quantity: item.quantity ? item.quantity : undefined,
					  },
		});
	});

	//ADD STATIC TAX IN BREAKUP QUOTE
	breakup.push({
		title: "tax",
		price: {
			currency: "INR",
			value: "10",
		},
		item: items[0],
		tags: [
			{
				descriptor: {
					code: "title",
				},
				list: [
					{
						descriptor: {
							code: "type",
						},
						value: "tax",
					},
				],
			},
		],
	});

	//MAKE DYNAMIC BREACKUP USING THE DYANMIC ITEMS
	let totalPrice = 0;
	breakup.forEach((entry) => {
		const priceValue = parseFloat(entry.price.value);
		if (!isNaN(priceValue)) {
			totalPrice += priceValue;
		}
	});

	const result = {
		breakup,
		price: {
			currency: "INR",
			value: totalPrice.toFixed(2),
		},
		ttl: "P1D",
	};

	return result;
};

export const quoteCreatorHealthCareService = (
	items: Item[],
	providersItems?: any,
	offers?: any
) => {
	try {
		//GET PACKAGE ITEMS
		//get price from on_search
		items.forEach((item) => {
			if (
				item &&
				item?.tags &&
				item?.tags[0] &&
				item?.tags[0]?.list[0]?.value === "PACKAGE"
			) {
				const getItems = item.tags[0].list[1].value.split(",");
				getItems.forEach((pItem) => {
					// Find the corresponding item in the second array
					if (providersItems) {
						const matchingItem = providersItems?.find(
							(secondItem: { id: string }) => secondItem.id === pItem
						);
						// If a matching item is found, update the price in the items array

						if (matchingItem) {
							items.push({ ...matchingItem, quantity: item?.quantity });
						} 
					}
				});
			}
		});

		items.forEach((item) => {
			// Find the corresponding item in the second array
			if (providersItems) {
				const matchingItem = providersItems?.find(
					(secondItem: { id: string }) => secondItem.id === item.id
				);
				// If a matching item is found, update the price in the items array
				if (matchingItem) {
					item.title = matchingItem?.descriptor?.name;
					item.price = matchingItem?.price;
					item.tags = matchingItem?.tags;
				}
			}
		});

		let breakup: any[] = [];

		items.forEach((item) => {
			breakup.push({
				title: item.title,
				price: {
					currency: "INR",
					value: (
						Number(item?.price?.value) * item?.quantity?.selected.count
					).toString(),
				},
				tags: item?.tags,
				item:
					item.title === "tax"
						? {
								id: item?.id,
						  }
						: {
								id: item?.id,
								price: item?.price,
								quantity: item?.quantity ? item?.quantity : undefined,
						  },
			});
		});

		//MAKE DYNAMIC BREACKUP USING THE DYANMIC ITEMS

		//ADD STATIC TAX FOR ITEM ONE
		breakup.push({
			title: "tax",
			price: {
				currency: "INR",
				value: "10",
			},
			item: items[0],
			tags: [
				{
					descriptor: {
						code: "title",
					},
					list: [
						{
							descriptor: {
								code: "type",
							},
							value: "tax",
						},
					],
				},
			],
		});
		let totalPrice = 0;

		breakup.forEach((entry) => {
			const priceValue = parseFloat(entry?.price?.value);
			if (!isNaN(priceValue)) {
				totalPrice += priceValue;
			}
		});

		const result = {
			breakup,
			price: {
				currency: "INR",
				value: totalPrice.toFixed(2),
			},
			ttl: "P1D",
		};

		return result;
	} catch (error: any) {
		return error;
	}
};

export const quoteCommon = (items: Item[], providersItems?: any) => {
	//get price from on_search
	items.forEach((item) => {
		// Find the corresponding item in the second array
		const matchingItem = providersItems.find(
			(secondItem: { id: string }) => secondItem.id === item.id
		);
		// If a matching item is found, update the price in the items array
		if (matchingItem) {
			item.title = matchingItem?.descriptor?.name;
			item.price = matchingItem?.price;
			item.tags = matchingItem?.tags;
		}
	});

	let breakup: any[] = [];

	items.forEach((item) => {
		breakup.push({
			title: item.title,
			price: {
				currency: "INR",
				value: (
					Number(item.price.value) * item.quantity.selected.count
				).toString(),
			},
			tags: item.tags,
			item: {
				id: item.id,
				price: item.price,
				quantity: item.quantity ? item.quantity : undefined,
			},
		});
	});

	//ADD STATIC TAX IN BREAKUP QUOTE
	breakup.push({
		title: "tax",
		price: {
			currency: "INR",
			value: "10",
		},
		item: items[0],
		tags: [
			{
				descriptor: {
					code: "title",
				},
				list: [
					{
						descriptor: {
							code: "type",
						},
						value: "tax",
					},
				],
			},
		],
	});

	//MAKE DYNAMIC BREACKUP USING THE DYANMIC ITEMS

	let totalPrice = 0;

	breakup.forEach((entry) => {
		const priceValue = parseFloat(entry.price.value);
		if (!isNaN(priceValue)) {
			totalPrice += priceValue;
		}
	});
	const result = {
		breakup,
		price: {
			currency: "INR",
			value: totalPrice.toFixed(2),
		},
		ttl: "P1D",
	};

	return result;
};

export const quoteCreatorService = (items: Item[], providersItems?: any) => {
	let result;
	if (providersItems) {
		result = quoteCommon(items, providersItems);
	}
	result?.breakup?.push({
		title: "discount",
		price: {
			currency: "INR",
			value: "0",
		},
		item: {
			id: "I1",
			quantity: {
				allocated: {
					count: "1",
				},
			},
			price: {
				currency: "INR",
				value: "474",
			},
		},
		tags: [
			{
				descriptor: {
					code: "title",
				},
				list: [
					{
						descriptor: {
							code: "type",
						},
						value: "discount",
					},
				],
			},
		],
	});
	result?.breakup?.push({
		title: "convenience_fee",
		price: {
			currency: "INR",
			value: "0",
		},
		item: {
			id: "I1",
			quantity: {
				allocated: {
					count: "1",
				},
			},
			price: {
				currency: "INR",
				value: "474",
			},
		},
		tags: [
			{
				descriptor: {
					code: "title",
				},
				list: [
					{
						descriptor: {
							code: "type",
						},
						value: "misc",
					},
				],
			},
		],
	});
	return result;
};

export const quoteCreatorServiceCustomized = (
	items: Item[],
	providersItems?: any
) => {
	let result;
	if (providersItems) {
		result = quoteCommon(items, providersItems);
	}
	result?.breakup?.push({
		title: "convenience_fee",
		price: {
			currency: "INR",
			value: "0",
		},
		item: {
			id: "I1",
		},
		tags: [
			{
				descriptor: {
					code: "title",
				},
				list: [
					{
						descriptor: {
							code: "type",
						},
						value: "misc",
					},
				],
			},
		],
	});
	return result;
};

export const checkIfCustomized = (items: Item[]) => {
	return items.some(
		(item) =>
			item.tags &&
			item.tags.some(
				(tag) =>
					tag.list &&
					tag.list.some((subTag) => {
						if (subTag.descriptor.code === "type") {
							return subTag.value === "customization";
						}
					})
			)
	);
};
