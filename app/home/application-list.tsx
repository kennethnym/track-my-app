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
	const deleteEntry = useStore((state) => state.deleteEntry)

	function onDeleteApplication() {
		if (confirm("Are you sure you want to delete this application?")) {
			deleteEntry(entry.name)
		}
	}

	return (
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
			<Button onClick={onOk} className="text-xs py-0">
				Ok
			</Button>
			<Button onClick={onCancel} className="text-xs py-0">
				Cancel
			</Button>
		</div>
	)
})

export { ApplicationList }
