import {
	DELIVERY_TERMS_TAGS,
	MESSAGE_INTENT_FULFILLMENTS_TYPE,
	MESSAGE_INTENT_CATEGORY_DESCRIPTOR_CODE,
	CONTEXT_DOMAIN,
	VERSION,
	MESSAGE_INTENT_TAGS_CODE,
	PACKAGE_WEIGHT_TAGS,
	SEARCH_TAGS,
	PACKAGE_WEIGHT_UNIT_VALUES,
	PACKAGE_DIMENSIONS_TAGS,
	PACKAGE_DIMENSIONS_UNIT_VALUES,
	PACKAGE_DETAILS_TAGS,
	PACKAGE_DETAILS_CATEGORY_VALUES,
	COLD_LOGISTICS_TAGS,
} from "./constants";

export const searchSchema = {
	$id: "searchSchema",
	type: "object",
	properties: {
		context: {
			type: "object",
			properties: {
				domain: {
					type: "string",
					enum: CONTEXT_DOMAIN,
				},
				location: {
					type: "object",
					properties: {
						city: {
							type: "object",
							properties: {
								code: {
									type: "string",
								},
							},
							required: ["code"],
						},
						country: {
							type: "object",
							properties: {
								code: {
									type: "string",
								},
							},
							required: ["code"],
						},
					},
					required: ["city", "country"],
				},
				action: {
					type: "string",
					const: "search",
				},
				version: {
					type: "string",
					const: VERSION,
				},
				bap_id: {
					type: "string",
				},
				bap_uri: {
					type: "string",
				},
				transaction_id: {
					type: "string",
				},
				message_id: {
					type: "string",
				},
				timestamp: {
					type: "string",
				},
				ttl: {
					type: "string",
				},
			},
			required: [
				"domain",
				"location",
				"action",
				"version",
				"bap_id",
				"bap_uri",
				"transaction_id",
				"message_id",
				"timestamp",
				"ttl",
			],
		},
		message: {
			type: "object",
			properties: {
				intent: {
					type: "object",
					properties: {
						category: {
							anyOf: [
								{
									type: "object",
									properties: {
										descriptor: {
											type: "object",
											properties: {
												code: {
													type: "string",
													enum: MESSAGE_INTENT_CATEGORY_DESCRIPTOR_CODE,
												},
											},
											required: ["code"],
										},
									},
									required: ["descriptor"],
								},
								{
									type: "null",
								},
							],
						},
						provider: {
							type: "object",
							properties: {
								time: {
									type: "object",
									properties: {
										days: {
											type: "string",
										},
										schedule: {
											type: "object",
											properties: {
												holidays: {
													type: "array",
													items: {
														type: "string",
													},
												},
											},
											required: ["holidays"],
										},
										range: {
											type: "object",
											properties: {
												start: {
													type: "string",
												},
												end: {
													type: "string",
												},
											},
											required: ["start", "end"],
										},
									},
									required: ["days", "schedule", "range"],
								},
							},
							required: ["time"],
						},
						fulfillments: {
							type: "object",
							properties: {
								type: {
									type: "string",
								},
								stops: {
									type: "array",
									items: {
										type: "object",
										properties: {
											id: {
												type: "string",
											},
											parent_stop_id: {
												type: "string",
											},
											type: {
												type: "string",
											},
											location: {
												type: "object",
												properties: {
													gps: {
														type: "string",
													},
													area_code: {
														type: "string",
													},
												},
												required: ["gps", "area_code"],
											},
											time: {
												type: "object",
												properties: {
													range: {
														type: "object",
														properties: {
															start: {
																type: "string",
															},
															end: {
																type: "string",
															},
														},
														required: ["start", "end"],
													},
												},
												required: ["range"],
											},
										},
										required: ["id", "parent_stop_id", "type", "location"],
									},
								},
							},
							required: ["type", "stops"],
						},
						payment: {
							type: "object",
							properties: {
								collected_by: {
									type: "string",
								},
								tags: {
									type: "array",
									items: {
										type: "object",
										properties: {
											descriptor: {
												type: "object",
												properties: {
													code: {
														type: "string",
													},
												},
												required: ["code"],
											},
											list: {
												type: "array",
												items: {
													type: "object",
													properties: {
														descriptor: {
															type: "object",
															properties: {
																code: {
																	type: "string",
																},
															},
															required: ["code"],
														},
														value: {
															type: "string",
														},
													},
													required: ["descriptor", "value"],
												},
											},
										},
										required: ["descriptor", "list"],
									},
								},
							},
							required: ["collected_by", "tags"],
						},
						tags: {
							type: "array",
							items: {
								type: "object",
								properties: {
									descriptor: {
										type: "object",
										properties: {
											code: {
												type: "string",
												enum: MESSAGE_INTENT_TAGS_CODE,
											},
										},
										required: ["code"],
									},
									list: {
										type: "array",
										items: {
											type: "object",
											properties: {
												descriptor: {
													type: "object",
													properties: {
														code: {
															type: "string",
														},
													},
													required: ["code"],
												},
												value: {
													type: "string",
												},
											},
											
										},
									},
								},
								
									
										if: {
											properties: {
												descriptor: {
													properties: {
														code: {
															const :"Package_Weight"
															
														},
													},
												},
											},
										},
										then: {
											properties: { list:{properties:{descriptor:{properties:{code:{enum:PACKAGE_WEIGHT_TAGS}}}}}}},
								
									// {
									// 	if: {
									// 		properties: {
									// 			descriptor: {
									// 				properties: {
									// 					code: {
									// 						type: "string",
									// 						enum: PACKAGE_DIMENSIONS_TAGS,
									// 					},
									// 				},
									// 			},
									// 		},
									// 	},
									// 	then: {
									// 		properties: {
									// 			value: {
									// 				type: "string",
									// 				enum: PACKAGE_DIMENSIONS_UNIT_VALUES, // Example currency codes
									// 			},
									// 		},
									// 	},
									// },
									// {
									// 	if: {
									// 		properties: {
									// 			descriptor: {
									// 				properties: {
									// 					code: {
									// 						type: "string",
									// 						enum: PACKAGE_DETAILS_TAGS,
									// 					},
									// 				},
									// 			},
									// 		},
									// 	},
									// 	then: {
									// 		properties: {
									// 			value: {
									// 				type: "string",
									// 				enum: PACKAGE_DETAILS_CATEGORY_VALUES,
									// 			},
									// 		},
									// 	},
									// },
									// {
									// 	if: {
									// 		properties: {
									// 			descriptor: {
									// 				properties: {
									// 					code: {
									// 						type: "string",
									// 						enum: COLD_LOGISTICS_TAGS,
									// 					},
									// 				},
									// 			},
									// 		},
									// 	},
									// 	then: {
									// 		properties: {
									// 			value: {
									// 				type: "string",
									// 			},
									// 		},
									// 	},
									
								
								required: ["descriptor", "list"],
							},
						},
					},
					required: ["category", "provider", "fulfillments", "payment", "tags"],
				},
			},
			required: ["intent"],
		},
	},
	required: ["context", "message"],
};