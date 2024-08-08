export function replaceIgnoreCase(str: string, searchFor: string, replaceWith: string): string {
	var esc = searchFor.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
	var reg = new RegExp(esc, 'ig');
	return str.replace(reg, replaceWith);
}
