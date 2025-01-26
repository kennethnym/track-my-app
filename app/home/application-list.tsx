import {
	type Ref,
	createContext,
	memo,
	useContext,
	useEffect,
	useRef,
} from "react"
import { createStore, useStore } from "zustand"
import { useShallow } from "zustand/react/shallow"
import { Button } from "~/components/button"
import { DEFAULT_NODE, type Entry } from "~/home/graph"
import { useRootStore } from "./store"

function ApplicationList() {
	const entries = useRootStore(useShallow((state) => state.entries))
	return Object.values(entries).map((entry) => (
		<ApplicationListItem key={entry.name} entry={entry} />
	))
}

interface ListItemState {
	isAddingStage: boolean
	newStageValue: string

	setNewStageValue: (newStageValue: string) => void
	setIsAddingStage: (isAddingStage: boolean) => void
	addStage: (entryName: string) => void
}

function createListItemStore() {
	return createStore<ListItemState>()((set, get) => ({
		isAddingStage: false,
		newStageValue: "",

		setNewStageValue: (newStageValue: string) => set({ newStageValue }),
		setIsAddingStage: (isAddingStage: boolean) => set({ isAddingStage }),
		addStage: (entryName) => {
			const store = useRootStore.getState()
			let stage = get().newStageValue
			if (stage) {
				if (stage === DEFAULT_NODE.acceptedNode.key.toLowerCase()) {
					stage = DEFAULT_NODE.acceptedNode.key
				} else if (stage === DEFAULT_NODE.rejectedNode.key.toLowerCase()) {
					stage = DEFAULT_NODE.rejectedNode.key
				}
				store.addStageInEntry(stage, entryName)
				set({ isAddingStage: false, newStageValue: "" })
			}
		},
	}))
}
type ListItemStore = ReturnType<typeof createListItemStore>

const ListItemStoreContext = createContext<ListItemStore>(
	null as unknown as ListItemStore,
)

function useListItemStore<T>(selector: (state: ListItemState) => T): T {
	const store = useContext(ListItemStoreContext)
	return useStore(store, selector)
}

const EntryContext = createContext<Entry>(null as unknown as Entry)

const ApplicationListItem = memo(({ entry }: { entry: Entry }) => {
	const store = useRef<ListItemStore | null>(null)
	if (!store.current) {
		store.current = createListItemStore()
	}
	return (
		<ListItemStoreContext value={store.current}>
			<EntryContext value={entry}>
				<details className="w-full px-2 pb-2 -mx-2">
					<summary className="cursor-pointer">{entry.name}</summary>
					<ol className="pl-3 list-decimal list-inside text-sm">
						{entry.stages.map((step) => (
							<StageItem key={step} stage={step} />
						))}
						<NewStageInput />
					</ol>
					<ApplicationActions />
				</details>
			</EntryContext>
		</ListItemStoreContext>
	)
})

const StageItem = memo(({ stage }: { stage: string }) => (
	<li key={stage} className="w-full group justify-between px-1">
		<div className="w-[90%] inline-flex flex-row flex-wrap items-center justify-between">
			{stage}
			{stage !== DEFAULT_NODE.applicationSubmittedNode.key ? (
				<StageItemActions stage={stage} />
			) : null}
		</div>
	</li>
))

function StageItemActions({ stage }: { stage: string }) {
	const entry = useContext(EntryContext)
	const deleteStageInEntry = useRootStore((state) => state.deleteStageInEntry)

	return (
		<div className="flex flex-row space-x-2 invisible group-hover:visible">
			<Button
				variant="small"
				onClick={() => {
					deleteStageInEntry(stage, entry.name)
				}}
			>
				Edit
			</Button>
			<Button
				variant="small"
				onClick={() => {
					deleteStageInEntry(stage, entry.name)
				}}
			>
				Delete
			</Button>
		</div>
	)
}

function NewStageInput() {
	const isAddingStage = useListItemStore((state) => state.isAddingStage)
	const inputRef = useRef<HTMLInputElement | null>(null)

	useEffect(() => {
		if (isAddingStage) {
			inputRef.current?.focus()
		}
	}, [isAddingStage])

	if (isAddingStage) {
		return (
			<li className="px-1">
				<ActualStageInput ref={inputRef} />
			</li>
		)
	}
	return null
}
function ActualStageInput({ ref }: { ref: Ref<HTMLInputElement> }) {
	const entry = useContext(EntryContext)
	const newStageValue = useListItemStore((state) => state.newStageValue)
	const setNewStageValue = useListItemStore((state) => state.setNewStageValue)
	const addStage = useListItemStore((state) => state.addStage)

	return (
		<input
			ref={ref}
			value={newStageValue}
			onChange={(event) => {
				setNewStageValue(event.currentTarget.value)
			}}
			onKeyDown={(event) => {
				if (event.key === "Enter") {
					addStage(entry.name)
				}
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
	const addStageToEntry = useRootStore((state) => state.addStageInEntry)
	const deleteEntry = useRootStore((state) => state.deleteEntry)

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
	const addStage = useListItemStore((state) => state.addStage)

	function onOk() {
		addStage(entry.name)
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
