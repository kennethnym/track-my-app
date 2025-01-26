import {
	type Infer,
	array,
	integer,
	min,
	object,
	record,
	string,
} from "superstruct"

const $Connection = object({
	nodeKey: string(),
	weight: min(integer(), 0),
})
type Connection = Infer<typeof $Connection>

const $Node = object({
	key: string(),
	outs: record(string(), $Connection),
})
type Node = Infer<typeof $Node>

const $Entry = object({
	name: string(),
	stages: array(string()),
})
type Entry = Infer<typeof $Entry>

const $Graph = object({
	nodes: record(string(), $Node),
	starts: array(string()),
	entries: record(string(), $Entry),
})
type Graph = Infer<typeof $Graph>

const DEFAULT_NODE = {
	applicationSubmittedNode: {
		key: "Application submitted",
		outs: {},
	},
	acceptedNode: {
		key: "Accepted",
		outs: {},
	},
	rejectedNode: {
		key: "Rejected",
		outs: {},
	},
} as const

export { $Graph, DEFAULT_NODE }
export type { Graph, Node, Entry, Connection }
