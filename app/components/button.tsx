import clsx from "clsx"

function Button({
	className,
	...props
}: React.DetailedHTMLProps<
	React.ButtonHTMLAttributes<HTMLButtonElement>,
	HTMLButtonElement
>) {
	return (
		<button
			{...props}
			className={clsx(
				"text-sm bg-neutral-200 dark:bg-neutral-700 px-2 py-1 rounded",
				className,
			)}
		/>
	)
}

export { Button }
