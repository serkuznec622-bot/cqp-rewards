
export async function fetchAsText(path) {
	const response = await fetch(path);
	return await response.text();
}

export function forEachLine(string, func) {
	function substring(string, from, to) {
		return string.substring(from, to);
	}

	let seek = 0;
	let i = 0;
	while(true) {
		const endOfLine = string.indexOf('\n', seek);
		if (endOfLine === -1) {
			func(substring(string, seek), i);
			break;
		} else {
			func(substring(string, seek, endOfLine), i);
			seek = endOfLine + 1;
		}
		i += 1;
	}
}