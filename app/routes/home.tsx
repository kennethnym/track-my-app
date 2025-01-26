import clsx from "clsx"
import { useEffect, useMemo, useRef, useState } from "react"
import Chart from "react-google-charts"
import { Button } from "~/components/button"
import { ApplicationList } from "~/home/application-list"
import type { Node } from "~/home/graph"
import { useRootStore } from "~/home/store"
import { Queue } from "~/queue"
import { useUiMode } from "~/use-ui-mode"

export function meta() {
	return [
		{ title: "TrackMyApp" },
		{ name: "description", content: "Track and visualize your applications" },
	]
}

export default function Home() {
	return (
		<div className="flex items-center justify-center p-4 md:px-16 md:pt-20 w-full">
			<main className="w-full max-w-xl flex flex-col items-start">
				<header>
					<h1 className="text-2xl font-bold">TrackMyApp</h1>
				</header>

				<FlufferChart />

				<h2 className="text-lg font-bold my-4">My Applications</h2>

				<ApplicationList />
				<AddApplicationForm />
			</main>
		</div>
	)
}

function FlufferChart() {
	const nodes = useRootStore((state) => state.nodes)
	const starts = useRootStore((state) => state.starts)
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

function AddApplicationForm() {
	const [isAddingEntry, setIsAddingEntry] = useState(false)
	const addEntry = useRootStore((state) => state.addEntry)
	const hasEntry = useRootStore((state) => state.hasEntry)
	const inputRef = useRef<HTMLInputElement | null>(null)

	useEffect(() => {
		if (isAddingEntry) {
			inputRef.current?.focus()
		}
	}, [isAddingEntry])

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
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							onAddButtonClick()
						}
					}}
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
