import { is } from "superstruct"
import { create } from "zustand/index"
import { immer } from "zustand/middleware/immer"
import {
	$Graph,
	DEFAULT_NODE,
	type Entry,
	type Node,
	connectNode,
	disconnectNode,
} from "~/home/graph"

interface RootStore {
	nodes: Record<string, Node>
	starts: Node["key"][]
	entries: Record<string, Entry>

	loadGraphFromLocalStorage: () => boolean
	resetGraph: () => void
	addEntry: (name: string) => void
	hasEntry: (name: string) => boolean
	addStageInEntry: (stage: string, entryName: string) => void
	editStageInEntry: (i: number, stage: string, entryName: string) => void
	deleteStageInEntry: (stage: string, entryName: string) => void
	deleteEntry: (entryName: string) => void
}

const useRootStore = create<RootStore>()(
	immer((set, get) => ({
		isAddingEntry: false,
		nodes: {
			[DEFAULT_NODE.applicationSubmittedNode.key]:
				DEFAULT_NODE.applicationSubmittedNode,
		},
		starts: [DEFAULT_NODE.applicationSubmittedNode.key],
		entries: {},

		loadGraphFromLocalStorage: () => {
			const graphJson = localStorage.getItem("graph")
			if (!graphJson) {
				// if there is no saved data, then we simply return
				// this is not considered to be an error
				return true
			}

			const graph = JSON.parse(graphJson)
			if (!is(graph, $Graph)) {
				return false
			}

			set({
				nodes: graph.nodes,
				starts: graph.starts,
				entries: graph.entries,
			})

			return true
		},

		resetGraph: () =>
			set({
				nodes: {
					[DEFAULT_NODE.applicationSubmittedNode.key]:
						DEFAULT_NODE.applicationSubmittedNode,
				},
				starts: [DEFAULT_NODE.applicationSubmittedNode.key],
				entries: {},
			}),

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
					if (
						lastStageNodeKey === stage ||
						// cannot add stage after accepted/rejected
						lastStageNodeKey === DEFAULT_NODE.acceptedNode.key ||
						lastStageNodeKey === DEFAULT_NODE.rejectedNode.key
					) {
						return
					}

					const lastStageNode = state.nodes[lastStageNodeKey]
					if (lastStageNode) {
						connectNode(lastStageNode, node)
					}

					entry.stages.push(node.key)
				}
			}),

		editStageInEntry: (i, stage, entryName) =>
			set((state) => {
				const entry = state.entries[entryName]
				if (entry && stage) {
					if (i >= entry.stages.length) {
						return
					}
					entry.stages[i] = stage
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
					const i = entry.stages.indexOf(stage)
					if (i < 0) {
						return
					}

					const lastStageNodeKey = entry.stages.at(i - 1)
					let lastStageNode: Node | null = null
					if (lastStageNodeKey) {
						lastStageNode = state.nodes[lastStageNodeKey]
						if (lastStageNode) {
							disconnectNode(lastStageNode, node)
						}
					}

					const nextStageNodeKey = entry.stages.at(i + 1)
					let nextStageNode: Node | null = null
					if (nextStageNodeKey) {
						nextStageNode = state.nodes[nextStageNodeKey]
						if (nextStageNode) {
							disconnectNode(node, nextStageNode)
						}
					}

					if (lastStageNode && nextStageNode) {
						connectNode(lastStageNode, nextStageNode)
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
					disconnectNode(lastStageNode, node)
				}
				delete state.entries[entryName]
			}),
	})),
)

export { useRootStore }
