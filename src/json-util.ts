export function clone(obj: any): any {
	var cloneObj = {};
	for (var attribut in this) {
		if (typeof obj[attribut] === "object") {
			cloneObj[attribut] = clone(obj);
		} else {
			cloneObj[attribut] = obj[attribut];
		}
	}
	return cloneObj;
}

export function eachObj(object: any, path: string[], cb: (path: string[], key: string, value: string) => void) {
	Object.keys(object)
		.forEach((key: string) => {
			if (typeof (object[key]) === 'string') {
				cb(path, key, object[key]);
			} else {
				eachObj(object[key], [...path, key], cb);
			}
		});
}

export function objValue(object: any, path: string[]) {
	let val: any = object;
	path.forEach((key: string) => {
		if (val) {
			val = val[key];
		}
	});
	return val;
}

export function setObjValue(object: any, path: string[], value: string) {
	let val: any = object;
	path.forEach((key: string, index: number) => {
		if (!val[key]) {
			val[key] = {};
		}
		if (index === path.length - 1) {
			val[key] = value;
		} else {
			val = val[key];
		}
	});
}
