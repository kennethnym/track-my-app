import clsx from "clsx"

const VARIANT_CLASSES = {
	small: "text-xs py-0",
} as const

function Button({
	className,
	variant,
	...props
}: React.DetailedHTMLProps<
	React.ButtonHTMLAttributes<HTMLButtonElement>,
	HTMLButtonElement
> & { variant?: keyof typeof VARIANT_CLASSES }) {
	return (
		<button
			{...props}
			className={clsx(
				"text-sm bg-neutral-200 dark:bg-neutral-700 px-2 py-1 rounded disabled:opacity-20",
				variant ? VARIANT_CLASSES[variant] : "",
				className,
			)}
		/>
	)
}

export { Button }
