<script lang="ts" generics="T extends string">
	interface Option {
		value: T;
		label: string;
	}

	interface Props {
		options: Option[];
		value: T;
		name: string;
		onchange?: (value: T) => void;
	}

	let { options, value, name, onchange }: Props = $props();

	function handleChange(newValue: T) {
		onchange?.(newValue);
	}
</script>

<span class="seg">
	{#each options as option}
		<label class="seg-opt">
			<input
				type="radio"
				{name}
				checked={value === option.value}
				onchange={() => handleChange(option.value)}
			/>
			{option.label}
		</label>
	{/each}
</span>
