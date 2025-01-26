interface Node {
	key: string
	outs: Record<string, Connection>
}

interface Entry {
	name: string
	stages: Node["key"][]
}

interface Connection {
	nodeKey: Node["key"]
	weight: number
}

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

export { DEFAULT_NODE }
export type { Node, Entry, Connection }
