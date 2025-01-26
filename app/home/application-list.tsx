import { createContext, memo, useContext } from "react"
import { create } from "zustand"
import { useShallow } from "zustand/react/shallow"
import { Button } from "~/components/button"
import { DEFAULT_NODE, type Entry } from "~/home/graph"
import { useStore } from "./store"

function ApplicationList() {
	const entries = useStore(useShallow((state) => state.entries))
	return Object.values(entries).map((entry) => (
		<ApplicationListItem key={entry.name} entry={entry} />
	))
}

interface ListItemStore {
	isAddingStage: boolean
	newStageValue: string

	setNewStageValue: (newStageValue: string) => void
	setIsAddingStage: (isAddingStage: boolean) => void
}

const useListItemStore = create<ListItemStore>()((set) => ({
	isAddingStage: false,
	newStageValue: "",
	setNewStageValue: (newStageValue: string) => set({ newStageValue }),
	setIsAddingStage: (isAddingStage: boolean) => set({ isAddingStage }),
}))

const EntryContext = createContext<Entry>(null as unknown as Entry)

const ApplicationListItem = memo(({ entry }: { entry: Entry }) => (
	<EntryContext value={entry}>
		<details className="w-full px-2 pb-2 -mx-2">
			<summary className="cursor-pointer">{entry.name}</summary>
			<ol className="pl-3 list-decimal list-inside text-sm">
				{entry.stages.map((step) => (
					<StageItem key={step} step={step} />
				))}
				<NewStageInput />
			</ol>
			<ApplicationActions />
		</details>
	</EntryContext>
))

const StageItem = memo(({ step }: { step: string }) => {
	const entry = useContext(EntryContext)
	const deleteStageInEntry = useStore((state) => state.deleteStageInEntry)
	return (
		<li key={step} className="w-full group justify-between px-1">
			<div className="w-[90%] inline-flex flex-row items-center justify-between">
				{step}
				{step !== DEFAULT_NODE.applicationSubmittedNode.key ? (
					<Button
						variant="small"
						onClick={() => {
							deleteStageInEntry(step, entry.name)
						}}
						className="invisible group-hover:visible"
					>
						Delete
					</Button>
				) : null}
			</div>
		</li>
	)
})

function NewStageInput() {
	const isAddingStage = useListItemStore((state) => state.isAddingStage)
	if (isAddingStage) {
		return (
			<li className="px-1">
				<ActualStageInput />
			</li>
		)
	}
	return null
}
function ActualStageInput() {
	const newStageValue = useListItemStore((state) => state.newStageValue)
	const setNewStageValue = useListItemStore((state) => state.setNewStageValue)
	return (
		<input
			value={newStageValue}
			onChange={(event) => {
				setNewStageValue(event.currentTarget.value)
			}}
			className="bg-transparent"
		/>
	)
}

function ApplicationActions() {
	const isAddingStage = useListItemStore((state) => state.isAddingStage)
	if (isAddingStage) {
		return <AddStageActions />
	}
	return <DefaultActions />
}

const DefaultActions = memo(() => {
	const entry = useContext(EntryContext)
	const setIsAddingStage = useListItemStore((state) => state.setIsAddingStage)
	const addStageToEntry = useStore((state) => state.addStageInEntry)
	const deleteEntry = useStore((state) => state.deleteEntry)

	const isApplicationFinalized =
		entry.stages.at(-1) === DEFAULT_NODE.acceptedNode.key ||
		entry.stages.at(-1) === DEFAULT_NODE.rejectedNode.key

	function onDeleteApplication() {
		if (confirm("Are you sure you want to delete this application?")) {
			deleteEntry(entry.name)
		}
	}

	function onAccepted() {
		addStageToEntry(DEFAULT_NODE.acceptedNode.key, entry.name)
	}

	function onRejected() {
		addStageToEntry(DEFAULT_NODE.rejectedNode.key, entry.name)
	}

	return (
		<div className="flex flex-row flex-wrap gap-2 pl-4 mt-2">
			<Button
				variant="small"
				disabled={isApplicationFinalized}
				onClick={() => {
					setIsAddingStage(true)
				}}
			>
				New stage
			</Button>
			<Button
				variant="small"
				disabled={isApplicationFinalized}
				onClick={onAccepted}
			>
				Accepted
			</Button>
			<Button
				variant="small"
				disabled={isApplicationFinalized}
				onClick={onRejected}
			>
				Rejected
			</Button>
			<Button variant="small" onClick={onDeleteApplication}>
				Delete application
			</Button>
		</div>
	)
})

const AddStageActions = memo(() => {
	const entry = useContext(EntryContext)
	const setIsAddingStage = useListItemStore((state) => state.setIsAddingStage)
	const setNewStageValue = useListItemStore((state) => state.setNewStageValue)
	const addStageToEntry = useStore((state) => state.addStageInEntry)

	function onOk() {
		const stage = useListItemStore.getState().newStageValue
		if (stage) {
			addStageToEntry(stage, entry.name)
			setIsAddingStage(false)
			setNewStageValue("")
		}
	}

	function onCancel() {
		setIsAddingStage(false)
	}

	return (
		<div className="flex flex-row space-x-2 pl-4 mt-2">
			<Button variant="small" onClick={onOk}>
				Ok
			</Button>
			<Button variant="small" onClick={onCancel}>
				Cancel
			</Button>
		</div>
	)
})

export { ApplicationList }
