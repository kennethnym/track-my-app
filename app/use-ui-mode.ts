import { useEffect, useState } from "react"

function useUiMode() {
	const [mode, setMode] = useState<"light" | "dark">("light")

	useEffect(() => {
		const query = window.matchMedia("(prefers-color-scheme: dark)")
		setMode(query.matches ? "dark" : "light")

		function onChange(event: MediaQueryListEvent) {
			setMode(event.matches ? "dark" : "light")
		}

		query.addEventListener("change", onChange)
		return () => {
			query.removeEventListener("change", onChange)
		}
	}, [])

	return mode
}

export { useUiMode }
