import type { Route } from "./+types/home"
import { create } from "zustand"
import Chart from "react-google-charts"
import { memo, useMemo, useRef, useState } from "react"
import { Button } from "~/components/button"
import { useShallow } from "zustand/react/shallow"
import { immer } from "zustand/middleware/immer"
import { Queue } from "~/queue"
import clsx from "clsx"
import { useUiMode } from "~/use-ui-mode"

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "TrackMyApp" },
		{ name: "description", content: "Track and visualize your applications" },
	]
}

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

const applicationSubmittedNode: Node = {
	key: "Application submitted",
	outs: {},
}

const useStore = create<Store>()(
	immer((set, get) => ({
		isAddingEntry: false,
		nodes: {
			[applicationSubmittedNode.key]: applicationSubmittedNode,
		},
		starts: [applicationSubmittedNode.key],
		entries: {},

		addEntry: (name) =>
			set((state) => {
				const currentEntries = state.entries
				if (!(name in currentEntries)) {
					state.entries[name] = {
						name,
						stages: [applicationSubmittedNode.key],
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
				if (stage === applicationSubmittedNode.key) {
					return
				}

				const entry = state.entries[entryName]
				const node = state.nodes[stage]
				if (entry && node) {
					const lastStageNodeKey = entry.stages.at(-2)!
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

export default function Home() {
	return (
		<div className="flex items-center justify-center p-4 md:px-16 md:pt-20 w-full">
			<main className="w-full max-w-xl flex flex-col items-start">
				<header>
					<h1 className="text-2xl font-bold">TrackMyApp</h1>
				</header>

				<FluffChart />

				<h2 className="text-lg font-bold my-4">My Applications</h2>

				<ApplicationList />
				<AddApplicationForm />
			</main>
		</div>
	)
}

function FluffChart() {
	const nodes = useStore((state) => state.nodes)
	const starts = useStore((state) => state.starts)
	const uiMode = useUiMode()

	const data = useMemo(() => {
		const rows: [string, string, number][] = []
		const queue = new Queue<Node>()
		for (const nodeKey of starts) {
			queue.enqueue(nodes[nodeKey])
		}
		while (!queue.isEmpty) {
			// biome-ignore lint/style/noNonNullAssertion: if queue is non empty, then dequeue will always be non null
			const currentNode = queue.dequeue()!
			for (const nodeKey in currentNode.outs) {
				// biome-ignore lint/style/noNonNullAssertion: <explanation>
				const connection = currentNode.outs[nodeKey]!
				rows.push([currentNode.key, connection.nodeKey, connection.weight])
				queue.enqueue(nodes[connection.nodeKey])
			}
		}
		return rows
	}, [starts, nodes])

	const hasData = data.length > 0

	return (
		<div className="w-full relative my-4">
			<Chart
				className={clsx(hasData ? "" : "invisible", "text-white")}
				width="100%"
				chartType="Sankey"
				data={[["From", "To", "Weight"], ...data]}
				options={{
					sankey: {
						node: {
							label: { color: uiMode === "dark" ? "#fff" : "#000" },
						},
					},
				}}
			/>
			{hasData ? null : (
				<div className="absolute inset-0 flex items-center justify-center rounded border dark:border-neutral-800">
					<p className="opacity-50">Enter some data to see the graph here.</p>
				</div>
			)}
		</div>
	)
}

function ApplicationList() {
	const entries = useStore(useShallow((state) => state.entries))

	return Object.values(entries).map((entry) => (
		<ApplicationListItem key={entry.name} entry={entry} />
	))
}

const ApplicationListItem = memo(({ entry }: { entry: Entry }) => {
	const [isAddingStage, setIsAddingStage] = useState(false)
	const inputRef = useRef<HTMLInputElement | null>(null)
	const addStageInEntry = useStore((state) => state.addStageInEntry)
	const deleteStageInEntry = useStore((state) => state.deleteStageInEntry)
	const deleteEntry = useStore((state) => state.deleteEntry)

	function onOk() {
		if (inputRef.current && inputRef.current.value) {
			addStageInEntry(inputRef.current.value, entry.name)
			setIsAddingStage(false)
		}
	}

	function onCancel() {
		setIsAddingStage(false)
	}

	function onDeleteApplication() {
		if (confirm("Are you sure you want to delete this application?")) {
			deleteEntry(entry.name)
		}
	}

	return (
		<details className="w-full px-2 pb-2 -mx-2">
			<summary className="cursor-pointer">{entry.name}</summary>
			<ol className="pl-3 list-decimal list-inside text-sm">
				{entry.stages.map((step) => (
					<li key={step} className="w-full group justify-between px-1">
						<div className="w-[90%] inline-flex flex-row items-center justify-between">
							{step}
							{step !== applicationSubmittedNode.key ? (
								<Button
									onClick={() => {
										deleteStageInEntry(step, entry.name)
									}}
									className="text-xs py-0 invisible group-hover:visible"
								>
									Delete
								</Button>
							) : null}
						</div>
					</li>
				))}
				{isAddingStage ? (
					<li className="px-1">
						<input required ref={inputRef} className="bg-transparent" />
					</li>
				) : null}
			</ol>
			{!isAddingStage ? (
				<div className="flex flex-row flex-wrap gap-2 pl-4 mt-2">
					<Button
						onClick={() => {
							setIsAddingStage(true)
						}}
						className="text-xs py-0"
					>
						New stage
					</Button>
					<Button className="text-xs py-0">Accepted</Button>
					<Button className="text-xs py-0">Rejected</Button>
					<Button onClick={onDeleteApplication} className="text-xs py-0">
						Delete application
					</Button>
				</div>
			) : (
				<div className="flex flex-row space-x-2 pl-4 mt-2">
					<Button onClick={onOk} className="text-xs py-0">
						Ok
					</Button>
					<Button onClick={onCancel} className="text-xs py-0">
						Cancel
					</Button>
				</div>
			)}
		</details>
	)
})

function AddApplicationForm() {
	const [isAddingEntry, setIsAddingEntry] = useState(false)
	const addEntry = useStore((state) => state.addEntry)
	const hasEntry = useStore((state) => state.hasEntry)
	const inputRef = useRef<HTMLInputElement | null>(null)

	function onAddButtonClick() {
		if (!isAddingEntry) {
			setIsAddingEntry(true)
		} else if (inputRef.current) {
			const entryName = inputRef.current.value
			if (hasEntry(entryName)) {
				alert(`There is already an application named ${entryName}!`)
			} else {
				addEntry(entryName)
				setIsAddingEntry(false)
			}
		}
	}

	function cancelEntry() {
		setIsAddingEntry(false)
	}

	return (
		<div className="mt-2">
			{isAddingEntry ? (
				<input
					ref={inputRef}
					className="px-2"
					type="text"
					placeholder="Application name"
				/>
			) : null}
			<div className="flex flex-row space-x-2 mt-2">
				<Button onClick={onAddButtonClick}>
					{isAddingEntry ? "Add" : "Add application"}
				</Button>
				{isAddingEntry ? <Button onClick={cancelEntry}>Cancel</Button> : null}
			</div>
		</div>
	)
}
