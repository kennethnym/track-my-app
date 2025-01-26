interface QueueItem<T> {
	value: T
	behind: QueueItem<T> | null
}

class Queue<T> {
	private front: QueueItem<T> | null = null
	private back: QueueItem<T> | null = null
	private length = 0

	get isEmpty() {
		return this.length === 0
	}

	enqueue(value: T) {
		const item: QueueItem<T> = {
			value,
			behind: null,
		}
		if (!this.front && !this.back) {
			this.front = item
			this.back = item
		} else {
			this.back!.behind = item
			this.back = item
		}
		this.length++
	}

	dequeue(): T | null {
		if (this.front) {
			const value = this.front.value
			this.front = this.front.behind
			if (--this.length === 0) {
				this.front = null
				this.back = null
			}
			return value
		}
		return null
	}
}

export { Queue }
