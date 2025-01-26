import { create } from "zustand/index"
import { immer } from "zustand/middleware/immer"
import { DEFAULT_NODE, type Entry, type Node } from "~/home/graph"

interface Store {
	nodes: Record<string, Node>
	starts: Node["key"][]
	entries: Record<string, Entry>

	addEntry: (name: string) => void
	hasEntry: (name: string) => boolean
	addStageInEntry: (stage: string, entryName: string) => void
	deleteStageInEntry: (stage: string, entryName: string) => void
	deleteEntry: (entryName: string) => void
}

const useStore = create<Store>()(
	immer((set, get) => ({
		isAddingEntry: false,
		nodes: {
			[DEFAULT_NODE.applicationSubmittedNode.key]:
				DEFAULT_NODE.applicationSubmittedNode,
		},
		starts: [DEFAULT_NODE.applicationSubmittedNode.key],
		entries: {},

		addEntry: (name) =>
			set((state) => {
				const currentEntries = state.entries
				if (!(name in currentEntries)) {
					state.entries[name] = {
						name,
						stages: [DEFAULT_NODE.applicationSubmittedNode.key],
					}
				}
			}),

		hasEntry: (name) => {
			return name in get().entries
		},

		addStageInEntry: (stage, entryName) =>
			set((state) => {
				const entry = state.entries[entryName]
				if (entry) {
					let node = state.nodes[stage]
					if (!node) {
						node = {
							key: stage,
							outs: {},
						}
						state.nodes[stage] = node
					}

					const lastStageNodeKey = entry.stages.at(-1) ?? state.starts[0]
					if (lastStageNodeKey === stage) {
						return
					}

					const lastStageNode = state.nodes[lastStageNodeKey]
					const conn = lastStageNode.outs[node.key]
					if (conn) {
						conn.weight++
					} else {
						lastStageNode.outs[node.key] = { nodeKey: node.key, weight: 1 }
					}
					entry.stages.push(node.key)
				}
			}),

		deleteStageInEntry: (stage, entryName) =>
			set((state) => {
				if (stage === DEFAULT_NODE.applicationSubmittedNode.key) {
					return
				}

				const entry = state.entries[entryName]
				const node = state.nodes[stage]
				if (entry && node) {
					const lastStageNodeKey = entry.stages.at(-2)
					if (!lastStageNodeKey) {
						return
					}

					const lastStageNode = state.nodes[lastStageNodeKey]
					const conn = lastStageNode.outs[node.key]
					if (conn) {
						if (conn.weight === 1) {
							delete lastStageNode.outs[node.key]
						} else {
							conn.weight--
						}
					}
					entry.stages = entry.stages.filter((step) => step !== stage)
				}
			}),

		deleteEntry: (entryName) =>
			set((state) => {
				const entry = state.entries[entryName]
				for (let i = 1; i < entry.stages.length; ++i) {
					const lastStageNode = state.nodes[entry.stages[i - 1]]
					const node = state.nodes[entry.stages[i]]
					const conn = lastStageNode.outs[node.key]
					if (conn) {
						if (conn.weight === 1) {
							delete lastStageNode.outs[node.key]
						} else {
							conn.weight--
						}
					}
				}
				delete state.entries[entryName]
			}),
	})),
)

export { useStore }
