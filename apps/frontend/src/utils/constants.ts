import { B2B_SCENARIOS } from "openapi-specs/constants";

export const SUPPORTED_DOMAINS = [
	"B2B",
	"SERVICES",
	"AGRI SERVICES",
	"HEALTHCARE SERVICES",
	"LOGISTICS",
];

export const USER_GUIDE_LINK =
	"https://github.com/tanyamadaan/b2b_mock_server/blob/feat-monorepo/README.md";

export const SWAGGER_BUILD_LINK =
	"https://raw.githubusercontent.com/abhik-wil/b2b_mock_server/feat-monorepo/apps/backend/src/openapi/build/swagger.yaml";

export const URL_MAPPING = {
	bpp: ["search", "select", "init", "confirm", "update", "status", "cancel"],
	bap: [
		"on_search",
		"on_select",
		"on_init",
		"on_confirm",
		"on_update",
		"on_status",
		"on_cancel",
	],
};

export const ACTION_PRECENDENCE = [
	"search",
	"on_search",
	"select",
	"on_select",
	"init",
	"on_init",
	"confirm",
	"on_confirm",
	"status",
	"on_status",
	"update",
	"on_update",
	"cancel",
	"on_cancel",
];

export const B2B_DOMAINS = [
	"ONDC:RET1A",
	"ONDC:RET1B",
	"ONDC:RET1C",
	"ONDC:RET1D",
	"ONDC:RET10",
	"ONDC:RET12",
	"ONDC:RET13",
	"ONDC:RET14",
];

export const LOGISTICS_DOMAINS = ["ONDC:LOG10", "ONDC:LOG11"];

export const B2C_DOMAINS = [
	"ONDC:RET10",
	"ONDC:RET12"
]

export const SERVICES_DOMAINS = ["ONDC:SRV11"];

export const AGRI_SERVICES_DOMAINS = ["ONDC:SRV14"];

export const HEALTHCARE_SERVICES_DOMAINS = [
	"ONDC:SRV13",
]

export const AGRI_EQUIPMENT_SERVICES_DOMAINS = [
	"ONDC:SRV15",
]
export const CITY_CODE = [
	"std:080",
	"std:011"
]

export const INITIATE_FIELDS = {
	search: [
		{
			name: "bpp_uri",
			placeholder: "Enter Your BPP URI",
			type: "text",
		},
		{
			name: "domain",
			placeholder: "Select domain...",
			type: "select",
			domainDepended: true,
			options: {
				"b2b": B2B_DOMAINS,
				"b2c":B2C_DOMAINS,
				"services": SERVICES_DOMAINS,
				"agri-services": AGRI_SERVICES_DOMAINS,
				"healthcare-services": HEALTHCARE_SERVICES_DOMAINS,
				"agri-equipment-hiring": AGRI_EQUIPMENT_SERVICES_DOMAINS,
				"logistics": LOGISTICS_DOMAINS,
			},
		},
		{
			name: "city",
			placeholder: "Select A City",
			type: "select",
			domainDepended: false,
			options: CITY_CODE,
		},
	],
	select: [
		{
			name: "transactionId",
			placeholder: "Enter Your Transaction ID",
			type: "text",
		},
		{
			name: "scenario",
			placeholder: "Select Scenario",
			type: "select",
			domainDepended: true,
			options: {
				b2b: B2B_SCENARIOS["select"].map((each) => each.scenario),
			  // "agri-equipment-hiring": A,

				// services: SERVICES_SCENARIOS["select"].map((each) => each.scenario),
			},
		},
	],
	init: [
		{
			name: "transactionId",
			placeholder: "Enter Your Transaction ID",
			type: "text",
		},
		{
			name: "scenario",
			placeholder: "Select Scenario",
			type: "select",
			domainDepended: true,
			options: {
				b2b: B2B_SCENARIOS["init"].map((each) => each.scenario),
				// services: SERVICES_SCENARIOS["init"].map((each) => each.scenario),
			},
		},
	],
	confirm: [
		{
			name: "transactionId",
			placeholder: "Enter Your Transaction ID",
			type: "text",
		},
		{
			name: "scenario",
			placeholder: "Select Scenario",
			type: "select",
			domainDepended: true,
			options: {
				// services: SERVICES_SCENARIOS["confirm"].map((each) => each.scenario),
			},
		},
	],
	status: [
		{
			name: "transactionId",
			placeholder: "Enter Your Transaction ID",
			type: "text",
		},
		{
			name: "scenario",
			placeholder: "Select Scenario",
			type: "select",
			domainDepended: true,
			options: {
				// services: SERVICES_SCENARIOS["confirm"].map((each) => each.scenario),
			},
		},
	],
	update: [
		{
			name: "transactionId",
			placeholder: "Enter Your Transaction ID",
			type: "text",
		},
		{
			name: "update_target",
			placeholder: "Update Target",
			type: "select",
			domainDepended: true,
			options: {
				"b2b":["payments"],
				"services": ["payments"],
				"logistics": ["fulfillments"],
				"agri-services": ["payments","fulfillments"],
				"healthcare-services": ["payments","fulfillments","items"],
				"agri-equipment-hiring": ["payments","items"]
			},
		},
	],
	cancel: [
		{
			name: "transactionId",
			placeholder: "Enter Your Transaction ID",
			type: "text",
		},
		{
			name: "orderId",
			placeholder: "Enter Your Order ID",
			type: "text",
		},
		{
			name: "cancellationReasonId",
			placeholder: "Enter Your Cancellation Reason ID",
			type: "text",
			domainDepended: true,
			options: {
				logistics: ["TAT Breach, 007"], // Follow this format if new options are added.
			},
		},
		{
			name: "scenario",
			placeholder: "Select Scenario",
			type: "select",
			domainDepended: true,
			options: {
				// services: SERVICES_SCENARIOS["confirm"].map((each) => each.scenario),
			},
		},
	],
};
